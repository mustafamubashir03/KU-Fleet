// src/routes/tripRoutes.ts
import express from "express";
import {
  logBusPosition,
  getTripLogsByBus,
  getDailyTripSummary,
  cleanupOldTrips,
} from "../controllers/tripController";

const router = express.Router();

router.post("/log", logBusPosition);                // called by hardware every 10–15 mins
router.get("/bus/:busId", getTripLogsByBus);        // analytics per bus
router.get("/summary/daily", getDailyTripSummary);  // admin summary
router.delete("/cleanup", cleanupOldTrips);         // remove old data

export default router;
