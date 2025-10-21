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

export default router;
