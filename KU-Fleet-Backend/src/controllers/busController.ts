import { Request, Response } from "express";
import { Types } from "mongoose";
import Bus from "../models/Bus.model";
import Route from "../models/Route.model";
import User from "../models/User.model";
import { cacheHelpers } from "../config/redis";
import { tripQueue } from "../workers/queue";

// GET /api/buses — List all buses
/** ✅ Get all buses */
export const getBuses = async (_req: Request, res: Response) => {
  try {
    const buses = await Bus.find()
      .populate({
        path: "route",
        select: "routeName stations",
        populate: {
          path: "stations",
          select: "stationName", // You can add more fields if needed
        },
      })
      .populate("driver", "name email photo")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: buses.length, buses });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch buses", error });
  }
};


// GET /api/buses/:id — Get single bus details
/** ✅ Get single bus by ID */
export const getBusById = async (req: Request, res: Response) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate("route", "routeName stations")
      .populate("driver", "name email photo");

    if (!bus) return res.status(404).json({ message: "Bus not found" });

    res.status(200).json({ success: true, bus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bus", error });
  }
};


// GET /api/buses/status/:status — Filter by status
/** ✅ Filter buses by status (active/inactive/maintenance) */
export const getBusesByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const buses = await Bus.find({status})
      .populate({
        path: "route",
        select: "routeName stations",
        populate: {
          path: "stations",
          select: "stationName", // You can add more fields if needed
        },
      })
      .populate("driver", "name email photo")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: buses.length, buses });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch buses by status", error });
  }
};


// POST /api/buses — Register new bus


export const createBus = async (req: Request, res: Response) => {
  try {
    const {
      busNumber,
      busNumberPlate,
      capacity,
      routeId,
      driverId,
      trackerIMEI,
      photo,
    } = req.body;

    if (!busNumber || !busNumberPlate || !routeId)
      return res.status(400).json({ message: "Bus number, number plate, and route are required" });

    const route = await Route.findById(routeId);
    if (!route)
      return res.status(404).json({ message: "Route not found" });

    let driver = null;
    if (driverId) {
      driver = await User.findById(driverId);
      if (!driver || driver.role !== "driver")
        return res.status(400).json({ message: "Invalid driver ID" });
    }

    const bus = await Bus.create({
      busNumber,
      busNumberPlate,
      capacity,
      route: routeId,
      driver: driverId || null,
      trackerIMEI,
      photo,
    });

    res.status(201).json({
      success: true,
      message: "Bus registered successfully",
      bus,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create bus", error });
  }
};



/** ✅ Update bus details */
export const updateBus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bus = await Bus.findByIdAndUpdate(id, updates, {
      new: true,
    })
      .populate("route", "routeName")
      .populate("driver", "name email");

    if (!bus) return res.status(404).json({ message: "Bus not found" });

    res.status(200).json({ success: true, message: "Bus updated", bus });
  } catch (error) {
    res.status(500).json({ message: "Failed to update bus", error });
  }
};


// DELETE /api/buses/:id — Deactivate bus
export const deleteBus = async (req: Request, res: Response) => {
  try {
    const deactivatedBus = await Bus.findByIdAndUpdate(
      req.params.id,
      { busStatus: "inactive" },
      { new: true }
    );
    if (!deactivatedBus) return res.status(404).json({ message: "Bus not found" });

    res.status(200).json({ message: "Bus deactivated", bus: deactivatedBus });
  } catch (error) {
    res.status(400).json({ message: "Failed to deactivate bus", error });
  }
};

// POST /api/buses/assign-driver — Assign driver to bus
export const assignDriver = async (req: Request, res: Response) => {
  try {
    const { busId, driverId } = req.body;
    if (!busId || !driverId)
      return res.status(400).json({ message: "Bus ID and Driver ID are required" });

    const bus = await Bus.findById(busId);
    const driver = await User.findById(driverId);

    if (!bus) return res.status(404).json({ message: "Bus not found" });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // Assign driver's ObjectId to the bus per schema
    bus.driver = driver._id as unknown as Types.ObjectId;
    await bus.save();

    res.status(200).json({ message: "Driver assigned successfully", bus });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign driver", error });
  }
};

// POST /api/buses/unassign-driver — Remove driver from bus
export const unassignDriver = async (req: Request, res: Response) => {
  try {
    const { busId } = req.body;
    if (!busId) return res.status(400).json({ message: "Bus ID required" });

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    delete bus.driver;
    await bus.save();

    res.status(200).json({ message: "Driver unassigned successfully", bus });
  } catch (error) {
    res.status(500).json({ message: "Failed to unassign driver", error });
  }
};

// GET /api/buses/:id/location — Get bus current location
export const getBusLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "Bus ID is required" });
    }
    
    // Try to get from cache first
    let location = await cacheHelpers.getBusLocation(id);
    
    if (!location) {
      // If not in cache, get from database
      const bus = await Bus.findById(id).select("lastLocation lastUpdate status");
      if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
      }
      
      location = {
        coordinates: bus.lastLocation,
        timestamp: bus.lastUpdate,
        status: bus.status
      };
      
      // Cache the location for 5 minutes
      if (location.coordinates) {
        await cacheHelpers.setBusLocation(id.toString(), location, 300);
      }
    }

    res.status(200).json({ 
      success: true, 
      busId: id,
      location 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bus location", error });
  }
};

// PUT /api/buses/:id/location — Update bus location
export const updateBusLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { coordinates, speed, timestamp } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: "Bus ID is required" });
    }
    
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return res.status(400).json({ 
        message: "Valid coordinates (lat, lng) are required" 
      });
    }

    // Update bus location in database
    await Bus.findByIdAndUpdate(id, {
      lastLocation: coordinates,
      lastUpdate: timestamp || new Date()
    });

    // Cache the location
    const locationData = {
      coordinates,
      speed,
      timestamp: timestamp || new Date()
    };
    await cacheHelpers.setBusLocation(id.toString(), locationData, 300);

    // Queue trip segment update if bus is on a trip
    await tripQueue.add("saveTripSegment", {
      busId: id,
      coords: coordinates,
      speed,
      timestamp: timestamp || new Date()
    }, {
      delay: 0,
      attempts: 3
    });

    res.status(200).json({ 
      success: true, 
      message: "Bus location updated successfully",
      location: locationData
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update bus location", error });
  }
};

// GET /api/buses/locations/all — Get all bus locations
export const getAllBusLocations = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    
    const buses = await Bus.find(filter)
      .select("busNumber plateNumber lastLocation lastUpdate status")
      .populate("route", "routeName")
      .populate("driver", "name");

    const locations = [];
    
    for (const bus of buses) {
      // Try cache first, fallback to database
      let location = await cacheHelpers.getBusLocation(bus._id?.toString() || "");
      
      if (!location && bus.lastLocation) {
        location = {
          coordinates: bus.lastLocation,
          timestamp: bus.lastUpdate,
          status: bus.status
        };
      }
      
      locations.push({
        busId: bus._id,
        busNumber: bus.busNumber,
        plateNumber: bus.busNumberPlate, // Use busNumberPlate instead of plateNumber
        route: bus.route,
        driver: bus.driver,
        location,
        status: bus.status
      });
    }

    res.status(200).json({ 
      success: true, 
      count: locations.length,
      locations 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bus locations", error });
  }
};
