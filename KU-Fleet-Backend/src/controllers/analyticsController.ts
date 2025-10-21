import { Request, Response } from "express";
import Bus from "../models/Bus.model";
import TripLog from "../models/TripLog.model";
import Alert from "../models/Alert.model";
import Feedback from "../models/Feedback.model";


/**  GET /api/analytics/overview */
export const getFleetOverview = async (req: Request, res: Response) => {
  try {
    const [totalBuses, activeBuses, totalDrivers, totalTrips, totalAlerts] = await Promise.all([
      Bus.countDocuments(),
      Bus.countDocuments({ busStatus: "active" }),
      Bus.distinct("driver.name").then((arr) => arr.length),
      TripLog.countDocuments(),
      Alert.countDocuments(),
    ]);

    const avgRatingAgg = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    const overview = {
      totalBuses,
      activeBuses,
      totalDrivers,
      totalTrips,
      totalAlerts,
      avgRating: avgRatingAgg[0]?.avgRating || 0,
    };

    res.status(200).json({ success: true, overview });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fleet overview", error });
  }
};

/**  GET /api/analytics/bus/:id */
export const getBusAnalytics = async (req: Request, res: Response) => {
  try {
    const busId = req.params.id;

    const [tripStats, alerts, feedbacks] = await Promise.all([
      TripLog.aggregate([
        { $match: { bus: busId } },
        {
          $group: {
            _id: "$bus",
            totalDistance: { $sum: "$distance" },
            avgSpeed: { $avg: "$avgSpeed" },
            totalTrips: { $sum: 1 },
          },
        },
      ]),
      Alert.find({ bus: busId }).sort({ createdAt: -1 }).limit(10),
      Feedback.find({ bus: busId }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      busId,
      stats: tripStats[0] || {},
      alerts,
      feedbacks,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bus analytics", error });
  }
};

/**  GET /api/analytics/driver/:id */
export const getDriverAnalytics = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;

    // Find all buses driven by this driver
    const buses = await Bus.find({ "driver._id": driverId });
    const busIds = buses.map((b) => b._id);

    const trips = await TripLog.aggregate([
      { $match: { bus: { $in: busIds } } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: "$distance" },
          avgSpeed: { $avg: "$avgSpeed" },
        },
      },
    ]);

    const alerts = await Alert.countDocuments({ bus: { $in: busIds } });

    res.status(200).json({
      success: true,
      driverId,
      trips: trips[0] || {},
      totalAlerts: alerts,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch driver analytics", error });
  }
};

/**  GET /api/analytics/routes */
export const getRouteAnalytics = async (req: Request, res: Response) => {
  try {
    const routeStats = await TripLog.aggregate([
      {
        $lookup: {
          from: "buses",
          localField: "bus",
          foreignField: "_id",
          as: "busInfo",
        },
      },
      { $unwind: "$busInfo" },
      {
        $group: {
          _id: "$busInfo.route",
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: "$distance" },
          avgSpeed: { $avg: "$avgSpeed" },
        },
      },
    ]);

    res.status(200).json({ success: true, routeStats });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch route analytics", error });
  }
};

/**  GET /api/analytics/alerts */
export const getAlertTrends = async (req: Request, res: Response) => {
  try {
    const alertTrends = await Alert.aggregate([
      {
        $group: {
          _id: { type: "$type" },
          total: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, alertTrends });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch alert analytics", error });
  }
};

/**  GET /api/analytics/feedback */
export const getFeedbackAnalytics = async (req: Request, res: Response) => {
  try {
    const ratings = await Feedback.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const unresolved = await Feedback.countDocuments({ resolved: false });

    res.status(200).json({
      success: true,
      ratings,
      unresolvedComplaints: unresolved,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feedback analytics", error });
  }
};

/**  GET /api/analytics/timeseries?days=7 */
export const getFleetTimeseries = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const trips = await TripLog.aggregate([
      { $match: { startTime: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          totalDistance: { $sum: "$distance" },
          totalTrips: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, days, trips });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fleet timeseries", error });
  }
};
