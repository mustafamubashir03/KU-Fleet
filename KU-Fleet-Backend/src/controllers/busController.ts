import { Request, Response } from "express";
import { Types } from "mongoose";
import Bus from "../models/Bus.model";
import Route from "../models/Route.model";
import User from "../models/User.model";

// GET /api/buses — List all buses
export const getBuses = async (req: Request, res: Response) => {
  try {
    const buses = await Bus.find().populate("route");
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch buses", error });
  }
};

// GET /api/buses/:id — Get single bus details
export const getBusById = async (req: Request, res: Response) => {
  try {
    const bus = await Bus.findById(req.params.id).populate("route");
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.status(200).json(bus);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bus", error });
  }
};

// GET /api/buses/status/:status — Filter by status
export const getBusesByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const validStatuses = ["active", "inactive", "maintenance"];
    if (!validStatuses.includes(status as string)) {
      return res.status(400).json({ message: "Invalid bus status" });
    }

    const buses = await Bus.find({ busStatus: status }).populate("route");
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ message: "Failed to filter buses", error });
  }
};

// POST /api/buses — Register new bus
export const createBus = async (req: Request, res: Response) => {
  try {
    const { busNumber, busNumberPlate, driver, route, trackerIMEI, photo } = req.body;

    const existing = await Bus.findOne({ busNumber });
    if (existing) return res.status(400).json({ message: "Bus already exists" });

    const newBus = await Bus.create({
      busNumber,
      busNumberPlate,
      driver,
      route,
      trackerIMEI,
      photo,
      busStatus: "active",
    });

    res.status(201).json({
      message: "Bus registered successfully",
      bus: newBus,
    });
  } catch (error) {
    res.status(400).json({ message: "Failed to register bus", error });
  }
};

// PATCH /api/buses/:id — Update bus info
export const updateBus = async (req: Request, res: Response) => {
  try {
    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBus) return res.status(404).json({ message: "Bus not found" });
    res.status(200).json(updatedBus);
  } catch (error) {
    res.status(400).json({ message: "Failed to update bus", error });
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
