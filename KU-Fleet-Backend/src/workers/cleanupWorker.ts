import { Worker } from "bullmq";
import { redisClient } from "../config/redis";
import { cacheHelpers } from "../config/redis";
import TripLog from "../models/TripLog.model";
import Alert from "../models/Alert.model";
import Feedback from "../models/Feedback.model";
import dotenv from "dotenv"
dotenv.config()

export const cleanupWorker = new Worker("cleanupQueue", async (job) => {
  console.log("Processing cleanup job:", job.name);

  try {
    if (job.name === "cleanupOldTripLogs") {
      const retentionDays = parseInt(process.env.TRIP_RETENTION_DAYS || "7");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      const deletedCount = await TripLog.deleteMany({ 
        createdAt: { $lt: cutoff },
        endTime: { $ne: null } // Only delete completed trips
      });
      
      console.log(`Cleaned up ${deletedCount.deletedCount} old trip logs`);
    }

    if (job.name === "cleanupOldAlerts") {
      const alertRetentionDays = parseInt(process.env.ALERT_RETENTION_DAYS || "30");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - alertRetentionDays);
      
      const deletedCount = await Alert.deleteMany({ 
        createdAt: { $lt: cutoff },
        resolved: true // Only delete resolved alerts
      });
      
      console.log(`Cleaned up ${deletedCount.deletedCount} old resolved alerts`);
    }

    if (job.name === "cleanupOldFeedback") {
      const feedbackRetentionDays = parseInt(process.env.FEEDBACK_RETENTION_DAYS || "90");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - feedbackRetentionDays);
      
      const deletedCount = await Feedback.deleteMany({ 
        createdAt: { $lt: cutoff }
      });
      
      console.log(`Cleaned up ${deletedCount.deletedCount} old feedback entries`);
    }

    if (job.name === "clearExpiredCache") {
      // Clear expired cache entries (Redis TTL handles this automatically, but we can force cleanup)
      const keys = await redisClient.keys("analytics:*");
      let clearedCount = 0;
      
      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) { // No expiration set
          await redisClient.del(key);
          clearedCount++;
        }
      }
      
      console.log(`Cleared ${clearedCount} expired cache entries`);
    }

    if (job.name === "archiveOldData") {
      const archiveDays = parseInt(process.env.ARCHIVE_DAYS || "30");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - archiveDays);
      
      // Archive old completed trips (move to separate collection or mark as archived)
      const archivedCount = await TripLog.updateMany(
        { 
          createdAt: { $lt: cutoff },
          endTime: { $ne: null }
        },
        { $set: { archived: true } }
      );
      
      console.log(`Archived ${archivedCount.modifiedCount} old trip logs`);
    }

  } catch (error) {
    console.error(`Error processing cleanup job ${job.name}:`, error);
    throw error;
  }
}, { 
  connection: redisClient,
  concurrency: 2,
  removeOnComplete: 20,
  removeOnFail: 10
});
