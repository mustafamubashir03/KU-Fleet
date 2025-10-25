import { Redis } from "ioredis";
import dotenv from "dotenv"
dotenv.config()

export const redisClient = new Redis(process.env.REDIS_URL as string, {
  tls: { rejectUnauthorized: false }, // for Upstash SSL
  maxRetriesPerRequest: null,    
});

redisClient.on("connect", () => console.log("✅ Redis connected"));
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

// Cache helpers for bus location data
export const cacheHelpers = {
  // Cache bus location data
  async setBusLocation(busId: string, location: any, ttl: number = 300) {
    const key = `bus:location:${busId}`;
    await redisClient.setex(key, ttl, JSON.stringify(location));
  },

  // Get cached bus location
  async getBusLocation(busId: string) {
    const key = `bus:location:${busId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Clear bus location cache
  async clearBusLocation(busId: string) {
    const key = `bus:location:${busId}`;
    await redisClient.del(key);
  },

  // Cache trip data
  async setTripData(tripId: string, data: any, ttl: number = 600) {
    const key = `trip:${tripId}`;
    await redisClient.setex(key, ttl, JSON.stringify(data));
  },

  // Get cached trip data
  async getTripData(tripId: string) {
    const key = `trip:${tripId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Clear all bus location caches
  async clearAllBusLocations() {
    const keys = await redisClient.keys("bus:location:*");
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  },

  // Cache analytics data
  async setAnalyticsData(key: string, data: any, ttl: number = 1800) {
    const cacheKey = `analytics:${key}`;
    await redisClient.setex(cacheKey, ttl, JSON.stringify(data));
  },

  // Get cached analytics data
  async getAnalyticsData(key: string) {
    const cacheKey = `analytics:${key}`;
    const data = await redisClient.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }
};