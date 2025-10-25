import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../models/User.model";
import Bus from "../models/Bus.model";
import TripLog from "../models/TripLog.model";
import bcrypt from "bcrypt";

// ✅ GET /api/drivers — List all drivers
export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await User.find({ role: "driver" }).select("-password");
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch drivers", error });
  }
};

// ✅ GET /api/drivers/:id — Get driver details
export const getDriverById = async (req: Request, res: Response) => {
  try {
    const driver = await User.findById(req.params.id).select("-password");
    if (!driver || driver.role !== "driver")
      return res.status(404).json({ message: "Driver not found" });

    const assignedBus = await Bus.findOne({ driver: driver._id });
    res.status(200).json({ driver, assignedBus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch driver details", error });
  }
};


/** ✅ Register a new driver (admin-only) */
export const createDriver = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      cnic,
      licenseNumber,
      licenseImage,
      photo,
      age,
      experienceYears,
      assignedBusId,
      remarks,
    } = req.body;

    if (!name || !email || !licenseNumber)
      return res.status(400).json({ message: "Name, email and license number are required" });

    // Prevent duplicates
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Driver already exists with this email" });

    // Auto-generate password
    const hashedPassword = await bcrypt.hash("Driver@123", 10);

    const driver = await User.create({
      name,
      email,
      phone,
      cnic,
      licenseNumber,
      licenseImage,
      photo,
      age,
      experienceYears,
      remarks,
      role: "driver",
      password: hashedPassword,
      assignedBus: assignedBusId || null,
      status: "active",
    });

    // Assign to bus if provided
    if (assignedBusId) {
      await Bus.findByIdAndUpdate(assignedBusId, { driver: driver._id });
    }

    res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      driver,
    });
  } catch (error) {
    console.error("Error registering driver:", error);
    res.status(500).json({ message: "Failed to register driver", error });
  }
};


// ✅ PATCH /api/drivers/:id — Update driver info
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      cnic,
      licenseNumber,
      licenseImage,
      photo,
      age,
      experienceYears,
      assignedBusId,
      status,
      remarks,
    } = req.body;

    const driver = await User.findById(id);
    if (!driver || driver.role !== "driver")
      return res.status(404).json({ message: "Driver not found" });

    // Update fields conditionally
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (cnic) driver.cnic = cnic;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (licenseImage) driver.licenseImage = licenseImage;
    if (photo) driver.photo = photo;
    if (age) driver.age = age;
    if (experienceYears) driver.experienceYears = experienceYears;
    if (status) driver.status = status;
    if (remarks) driver.remarks = remarks;

    // ✅ Handle bus reassignment
    if (assignedBusId && assignedBusId !== String(driver.assignedBus)) {
      // Remove old assignment if any
      if (driver.assignedBus) {
        await Bus.findByIdAndUpdate(driver.assignedBus, { $unset: { driver: 1 } });
      }
      // Assign to new bus
      await Bus.findByIdAndUpdate(assignedBusId, { driver: driver._id });
      driver.assignedBus = assignedBusId;
    }

    await driver.save();

    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      driver,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Failed to update driver", error });
  }
};

// ✅ DELETE /api/drivers/:id — Deactivate driver
export const deactivateDriver = async (req: Request, res: Response) => {
  try {
    const driver = await User.findByIdAndUpdate(req.params.id, { status: "inactive" }, { new: true });
    if (!driver || driver.role !== "driver")
      return res.status(404).json({ message: "Driver not found" });

    res.status(200).json({ message: "Driver deactivated", driver });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate driver", error });
  }
};

// ✅ POST /api/drivers/:id/assign-bus — Assign driver to bus
export const assignDriverToBus = async (req: Request, res: Response) => {
  try {
    const { busId } = req.body;
    const driverId = req.params.id;

    const driver = await User.findById(driverId);
    const bus = await Bus.findById(busId);

    if (!driver || driver.role !== "driver")
      return res.status(404).json({ message: "Driver not found" });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    // Assign driver's ObjectId to bus per schema
    bus.driver = driver._id as unknown as Types.ObjectId;
    await bus.save();

    res.status(200).json({ message: "Driver assigned to bus", bus });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign driver to bus", error });
  }
};

// ✅ GET /api/drivers/:id/logs — View trips or performance logs
export const getDriverLogs = async (req: Request, res: Response) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== "driver")
      return res.status(404).json({ message: "Driver not found" });

    // Fetch all TripLogs for buses driven by this driver
    const bus = await Bus.findOne({ driver: driver._id });
    if (!bus) return res.status(404).json({ message: "No bus assigned to this driver" });

    const trips = await TripLog.find({ bus: bus._id }).sort({ startTime: -1 });

    res.status(200).json({
      driver: driver.name,
      bus: bus.busNumber,
      totalTrips: trips.length,
      trips,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch driver logs", error });
  }
};
