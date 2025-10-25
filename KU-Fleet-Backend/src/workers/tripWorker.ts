import { Worker } from "bullmq";
import { redisClient } from "../config/redis";
import { cacheHelpers } from "../config/redis";
import TripLog from "../models/TripLog.model";
import Bus from "../models/Bus.model";
import Alert from "../models/Alert.model";
import dotenv from "dotenv"
dotenv.config()

export const tripWorker = new Worker("tripQueue", async (job) => {
  console.log("Processing trip job:", job.name);

  try {
    if (job.name === "saveTripSegment") {
      const { busId, coords, speed, timestamp } = job.data;
      
      // Update trip log with new coordinates
      await TripLog.updateOne(
        { bus: busId, endTime: null },
        { 
          $push: { coordinates: coords },
          $set: { 
            lastUpdate: timestamp || new Date(),
            currentSpeed: speed 
          }
        }
      );

      // Cache bus location
      await cacheHelpers.setBusLocation(busId, {
        coordinates: coords,
        speed,
        timestamp: timestamp || new Date()
      });

      // Check for overspeed alert (if speed > 80 km/h)
      if (speed && speed > 80) {
        await Alert.create({
          bus: busId,
          type: "overspeed",
          message: `Bus exceeded speed limit: ${speed} km/h`,
          priority: "high",
          timestamp: timestamp || new Date()
        });
      }
    }

    if (job.name === "endTrip") {
      const { busId, endCoords } = job.data;
      
      await TripLog.updateOne(
        { bus: busId, endTime: null },
        { 
          $set: { 
            endTime: new Date(),
            endCoordinates: endCoords
          }
        }
      );

      // Clear bus location cache
      await cacheHelpers.clearBusLocation(busId);
    }

    if (job.name === "dailyCleanup") {
      const retentionDays = parseInt(process.env.TRIP_RETENTION_DAYS || "7");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      const deletedCount = await TripLog.deleteMany({ 
        createdAt: { $lt: cutoff },
        endTime: { $ne: null } // Only delete completed trips
      });
      
      console.log(`Cleaned up ${deletedCount.deletedCount} old trip logs`);
    }

    if (job.name === "updateBusStatus") {
      const { busId, status, location } = job.data;
      
      await Bus.findByIdAndUpdate(busId, { 
        status,
        lastLocation: location,
        lastUpdate: new Date()
      });

      if (location) {
        await cacheHelpers.setBusLocation(busId, location);
      }
    }

  } catch (error) {
    console.error(`Error processing trip job ${job.name}:`, error);
    throw error; // Re-throw to trigger retry mechanism
  }
}, { 
  connection: redisClient,
  concurrency: 5, // Process up to 5 jobs concurrently
  removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
  removeOnFail: { count: 50 } // Keep last 50 failed jobs
});
