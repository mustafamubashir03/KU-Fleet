import { Queue } from "bullmq";
import { redisClient } from "../config/redis";

export const tripQueue = new Queue("tripQueue", {
  connection: redisClient,
});

export const analyticsQueue = new Queue("analyticsQueue", {
  connection: redisClient,
});

export const cleanupQueue = new Queue("cleanupQueue", {
  connection: redisClient,
});

// Queue event listeners for monitoring
tripQueue.on("completed" as any, (job: any) => {
  console.log(`✅ Trip job ${job.id} completed`);
});

tripQueue.on("failed" as any, (job: any, err: any) => {
  console.error(`❌ Trip job ${job?.id} failed:`, err);
});

analyticsQueue.on("completed" as any, (job: any) => {
  console.log(`✅ Analytics job ${job.id} completed`);
});

analyticsQueue.on("failed" as any, (job: any, err: any) => {
  console.error(`❌ Analytics job ${job?.id} failed:`, err);
});

cleanupQueue.on("completed" as any, (job: any) => {
  console.log(`✅ Cleanup job ${job.id} completed`);
});

cleanupQueue.on("failed" as any, (job: any, err: any) => {
  console.error(`❌ Cleanup job ${job?.id} failed:`, err);
});