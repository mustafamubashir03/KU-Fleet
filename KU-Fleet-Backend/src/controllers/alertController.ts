import { Request, Response } from "express";
import { Types } from "mongoose";
import Alert from "../models/Alert.model";
import Bus from "../models/Bus.model";

// GET /api/alerts — Get all alerts
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { type, priority, resolved, busId, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (resolved !== undefined) filter.resolved = resolved === "true";
    if (busId) filter.bus = busId;

    const skip = (Number(page) - 1) * Number(limit);
    
    const alerts = await Alert.find(filter)
      .populate("bus", "busNumber plateNumber route")
      .populate("bus.route", "routeName")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Alert.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      alerts
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch alerts", error });
  }
};

// GET /api/alerts/:id — Get single alert
export const getAlertById = async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("bus", "busNumber plateNumber route driver")
      .populate("bus.route", "routeName")
      .populate("bus.driver", "name email");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch alert", error });
  }
};

// POST /api/alerts — Create new alert
export const createAlert = async (req: Request, res: Response) => {
  try {
    const { busId, type, message, priority = "medium" } = req.body;

    if (!busId || !type) {
      return res.status(400).json({ 
        message: "Bus ID and alert type are required" 
      });
    }

    // Verify bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const alert = await Alert.create({
      bus: busId,
      type,
      message,
      priority,
      timestamp: new Date()
    });

    const populatedAlert = await Alert.findById(alert._id)
      .populate("bus", "busNumber plateNumber route")
      .populate("bus.route", "routeName");

    res.status(201).json({ 
      success: true, 
      message: "Alert created successfully",
      alert: populatedAlert 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create alert", error });
  }
};

// PUT /api/alerts/:id — Update alert
export const updateAlert = async (req: Request, res: Response) => {
  try {
    const { resolved, priority, message } = req.body;
    
    const updateData: any = {};
    if (resolved !== undefined) updateData.resolved = resolved;
    if (priority) updateData.priority = priority;
    if (message) updateData.message = message;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("bus", "busNumber plateNumber route")
     .populate("bus.route", "routeName");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Alert updated successfully",
      alert 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update alert", error });
  }
};

// DELETE /api/alerts/:id — Delete alert
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Alert deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete alert", error });
  }
};

// PUT /api/alerts/:id/resolve — Resolve alert
export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true, runValidators: true }
    ).populate("bus", "busNumber plateNumber route")
     .populate("bus.route", "routeName");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Alert resolved successfully",
      alert 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to resolve alert", error });
  }
};

// GET /api/alerts/bus/:busId — Get alerts for specific bus
export const getBusAlerts = async (req: Request, res: Response) => {
  try {
    const { busId } = req.params;
    const { resolved, limit = 50 } = req.query;

    const filter: any = { bus: busId };
    if (resolved !== undefined) filter.resolved = resolved === "true";

    const alerts = await Alert.find(filter)
      .populate("bus", "busNumber plateNumber")
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bus alerts", error });
  }
};

// GET /api/alerts/stats — Get alert statistics
export const getAlertStats = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(days));

    const totalAlerts = await Alert.countDocuments({
      timestamp: { $gte: cutoff }
    });

    const resolvedAlerts = await Alert.countDocuments({
      timestamp: { $gte: cutoff },
      resolved: true
    });

    const alertsByType = await Alert.aggregate([
      { $match: { timestamp: { $gte: cutoff } } },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);

    const alertsByPriority = await Alert.aggregate([
      { $match: { timestamp: { $gte: cutoff } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const recentAlerts = await Alert.find({
      timestamp: { $gte: cutoff }
    })
      .populate("bus", "busNumber plateNumber")
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalAlerts,
        resolvedAlerts,
        unresolvedAlerts: totalAlerts - resolvedAlerts,
        resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
        alertsByType,
        alertsByPriority,
        recentAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch alert statistics", error });
  }
};
