import { Request, Response } from "express";
import Station from "../models/Station.model";

/** POST /api/stations */
export const createStation = async (req: Request, res: Response) => {
  try {
    const { stationName, coordinates } = req.body;

    if (!stationName || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: "Station name and valid coordinates required" });
    }
    
    const exists = await Station.findOne({ stationName });
    if (exists) return res.status(400).json({ message: "Station already exists" });
    
    const station = await Station.create({
      stationName,
      position: {
        type: "Point",
        coordinates,
      },
    });
    res.status(201).json({ success: true, station });
  } catch (error) {
    res.status(500).json({ message: "Failed to create station", error });
  }
};

/** GET /api/stations */
export const getAllStations = async (_req: Request, res: Response) => {
  try {
    const stations = await Station.find().select("stationName position");
    res.status(200).json({ success: true, stations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stations", error });
  }
};
