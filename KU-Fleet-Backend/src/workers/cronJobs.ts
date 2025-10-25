import * as cron from "node-cron";
import { tripQueue, analyticsQueue, cleanupQueue } from "./queue";

// Daily cleanup job - runs at 2 AM every day
cron.schedule("0 2 * * *", async () => {
  console.log("🔄 Starting daily cleanup job...");
  
  try {
    await cleanupQueue.add("cleanupOldTripLogs", {}, {
      delay: 0,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    await cleanupQueue.add("cleanupOldAlerts", {}, {
      delay: 1000,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    await cleanupQueue.add("cleanupOldFeedback", {}, {
      delay: 2000,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    console.log("✅ Daily cleanup jobs scheduled");
  } catch (error) {
    console.error("❌ Error scheduling daily cleanup:", error);
  }
});

// Daily analytics generation - runs at 1 AM every day
cron.schedule("0 1 * * *", async () => {
  console.log("📊 Starting daily analytics generation...");
  
  try {
    await analyticsQueue.add("generateDailyAnalytics", {}, {
      delay: 0,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    console.log("✅ Daily analytics job scheduled");
  } catch (error) {
    console.error("❌ Error scheduling daily analytics:", error);
  }
});

// Cache cleanup - runs every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("🧹 Starting cache cleanup...");
  
  try {
    await cleanupQueue.add("clearExpiredCache", {}, {
      delay: 0,
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });

    console.log("✅ Cache cleanup job scheduled");
  } catch (error) {
    console.error("❌ Error scheduling cache cleanup:", error);
  }
});

// Data archiving - runs weekly on Sunday at 3 AM
cron.schedule("0 3 * * 0", async () => {
  console.log("📦 Starting weekly data archiving...");
  
  try {
    await cleanupQueue.add("archiveOldData", {}, {
      delay: 0,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    });

    console.log("✅ Data archiving job scheduled");
  } catch (error) {
    console.error("❌ Error scheduling data archiving:", error);
  }
});

// Health check - runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🏥 Running health check...");
  
  try {
    // Check queue health
    const tripQueueHealth = await tripQueue.getJobCounts();
    const analyticsQueueHealth = await analyticsQueue.getJobCounts();
    const cleanupQueueHealth = await cleanupQueue.getJobCounts();
    
    console.log("Queue Health:", {
      trip: tripQueueHealth,
      analytics: analyticsQueueHealth,
      cleanup: cleanupQueueHealth
    });

    // Alert if any queue has too many failed jobs
    if (tripQueueHealth.failed > 10) {
      console.warn("⚠️ Trip queue has many failed jobs:", tripQueueHealth.failed);
    }
    
    if (analyticsQueueHealth.failed > 5) {
      console.warn("⚠️ Analytics queue has many failed jobs:", analyticsQueueHealth.failed);
    }
    
    if (cleanupQueueHealth.failed > 5) {
      console.warn("⚠️ Cleanup queue has many failed jobs:", cleanupQueueHealth.failed);
    }
  } catch (error) {
    console.error("❌ Error in health check:", error);
  }
});

console.log("🕐 Cron jobs initialized:");
console.log("  - Daily cleanup: 2:00 AM");
console.log("  - Daily analytics: 1:00 AM");
console.log("  - Cache cleanup: Every 6 hours");
console.log("  - Data archiving: Sunday 3:00 AM");
console.log("  - Health check: Every 5 minutes");
