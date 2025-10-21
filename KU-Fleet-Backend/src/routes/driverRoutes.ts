import express from "express";
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deactivateDriver,
  assignDriverToBus,
  getDriverLogs,
} from "../controllers/driverController";
import { adminOnly, protect } from "../middleware/AuthMiddleware";


const router = express.Router();

// Main driver management routes
router
  .route("/")
  .get(protect, adminOnly, getAllDrivers)
  .post(protect, adminOnly, createDriver);

router
  .route("/:id")
  .get(protect, adminOnly, getDriverById)
  .patch(protect, adminOnly, updateDriver)
  .delete(protect, adminOnly, deactivateDriver);

// Assign bus and view performance logs
router.post("/:id/assign-bus", protect, adminOnly, assignDriverToBus);
router.get("/:id/logs", protect, adminOnly, getDriverLogs);

export default router;
