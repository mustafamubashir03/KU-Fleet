import { Worker } from "bullmq";
import { redisClient } from "../config/redis";
import { cacheHelpers } from "../config/redis";
import TripLog from "../models/TripLog.model";
import Bus from "../models/Bus.model";
import Alert from "../models/Alert.model";

export const analyticsWorker = new Worker("analyticsQueue", async (job) => {
  console.log("Processing analytics job:", job.name);

  try {
    if (job.name === "generateDailyAnalytics") {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Get daily trip statistics
      const totalTrips = await TripLog.countDocuments({
        startTime: { $gte: startOfDay, $lte: endOfDay }
      });

      const completedTrips = await TripLog.countDocuments({
        startTime: { $gte: startOfDay, $lte: endOfDay },
        endTime: { $ne: null }
      });

      const activeBuses = await Bus.countDocuments({ status: "active" });
      const totalBuses = await Bus.countDocuments();

      const alertsToday = await Alert.countDocuments({
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });

      const analytics = {
        date: startOfDay.toISOString().split('T')[0],
        totalTrips,
        completedTrips,
        activeBuses,
        totalBuses,
        alertsToday,
        completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
        utilizationRate: totalBuses > 0 ? (activeBuses / totalBuses) * 100 : 0
      };

      // Cache analytics data
      await cacheHelpers.setAnalyticsData(`daily:${startOfDay.toISOString().split('T')[0]}`, analytics, 86400);
      
      console.log("Daily analytics generated:", analytics);
    }

    if (job.name === "generateBusAnalytics") {
      const { busId } = job.data;
      
      const bus = await Bus.findById(busId).populate("route");
      if (!bus) return;

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const tripsToday = await TripLog.find({
        bus: busId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
      });

      const totalDistance = tripsToday.reduce((sum, trip) => {
        return sum + (trip.distance || 0);
      }, 0);

      const alertsToday = await Alert.countDocuments({
        bus: busId,
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });

      const analytics = {
        busId,
        date: startOfDay.toISOString().split('T')[0],
        tripsCount: tripsToday.length,
        totalDistance,
        alertsCount: alertsToday,
        averageSpeed: tripsToday.length > 0 ? 
          tripsToday.reduce((sum, trip) => sum + (trip.avgSpeed || 0), 0) / tripsToday.length : 0
      };

      await cacheHelpers.setAnalyticsData(`bus:${busId}:${startOfDay.toISOString().split('T')[0]}`, analytics, 86400);
    }

    if (job.name === "generateRouteAnalytics") {
      const { routeId } = job.data;
      
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const routeTrips = await TripLog.find({
        route: routeId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
      }).populate("bus");

      const totalPassengers = routeTrips.reduce((sum, trip) => sum + (trip.passengerCount || 0), 0);
      const totalDistance = routeTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

      const analytics = {
        routeId,
        date: startOfDay.toISOString().split('T')[0],
        tripsCount: routeTrips.length,
        totalPassengers,
        totalDistance,
        averagePassengers: routeTrips.length > 0 ? totalPassengers / routeTrips.length : 0
      };

      await cacheHelpers.setAnalyticsData(`route:${routeId}:${startOfDay.toISOString().split('T')[0]}`, analytics, 86400);
    }

  } catch (error) {
    console.error(`Error processing analytics job ${job.name}:`, error);
    throw error;
  }
}, { 
  connection: redisClient,
  concurrency: 3,
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 25 }
});
