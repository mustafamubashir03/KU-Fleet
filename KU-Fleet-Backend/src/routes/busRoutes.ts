import express from "express";

import {
  getBuses,
  getBusById,
  getBusesByStatus,
  createBus,
  updateBus,
  deleteBus,
  assignDriver,
  unassignDriver,
  getBusLocation,
  updateBusLocation,
  getAllBusLocations,
} from "../controllers/busController";
import { adminOnly, protect } from "../middleware/AuthMiddleware";

const router = express.Router();

router.route("/")
  .get(protect, getBuses)
  .post(protect, adminOnly, createBus);

router.get("/:id", protect, getBusById);
router.get("/status/:status", protect, getBusesByStatus);
router.patch("/:id", protect, adminOnly, updateBus);
router.delete("/:id", protect, adminOnly, deleteBus);

// Driver assignment routes
router.post("/assign-driver", protect, adminOnly, assignDriver);
router.post("/unassign-driver", protect, adminOnly, unassignDriver);

// Location routes
router.get("/locations/all", protect, getAllBusLocations);
router.get("/:id/location", protect, getBusLocation);
router.put("/:id/location", protect, updateBusLocation);

export default router;
