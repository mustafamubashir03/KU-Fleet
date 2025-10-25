import { Request, Response } from "express";
import Route from "../models/Route.model";
import Station from "../models/Station.model";

/** ✅ Create Route */
export const createRoute = async (req: Request, res: Response) => {
  try {
    const { routeName, stations } = req.body;
    const stationIds = stations;


    if (!routeName || !stations || !Array.isArray(stations) || stations.length === 0){
      return res.status(400).json({ message: "Route name and valid stationIds are required" });
    }

    // Verify all station IDs exist
    const validStations = await Station.find({ _id: { $in: stationIds } });
    if (validStations.length !== stationIds.length) {
      return res.status(400).json({ message: "Some provided station IDs are invalid" });
    }

    const route = await Route.create({ routeName, stations: stationIds });
    res.status(201).json({ success: true, message: "Route created successfully", route });
  } catch (error) {
    res.status(500).json({ message: "Failed to create route", error });
  }
};

/** ✅ Get All Routes */
export const getRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await Route.find().populate({
      path: "stations",
      select: "stationName position -_id",
    });

    res.status(200).json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch routes", error });
  }
};

/** ✅ Get Single Route by ID */
export const getRouteById = async (req: Request, res: Response) => {
  try {
    const route = await Route.findById(req.params.id).populate({
      path: "stations",
      select: "stationName position -_id",
    });

    if (!route) return res.status(404).json({ message: "Route not found" });

    res.status(200).json({ success: true, route });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch route", error });
  }
};

/** ✅ Delete Route */
export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Route not found" });

    res.status(200).json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete route", error });
  }
};
