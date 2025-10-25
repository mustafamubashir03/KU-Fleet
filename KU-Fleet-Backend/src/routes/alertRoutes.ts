import express from "express";
import {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  resolveAlert,
  getBusAlerts,
  getAlertStats
} from "../controllers/alertController";
import { protect, adminOnly } from "../middleware/AuthMiddleware";

const router = express.Router();

// Public routes (for system-generated alerts)
router.post("/", createAlert);

// Protected routes
router.get("/", protect, getAlerts);
router.get("/stats", protect, getAlertStats);
router.get("/bus/:busId", protect, getBusAlerts);
router.get("/:id", protect, getAlertById);

// Admin-only routes
router.put("/:id", protect, adminOnly, updateAlert);
router.put("/:id/resolve", protect, adminOnly, resolveAlert);
router.delete("/:id", protect, adminOnly, deleteAlert);

export default router;
