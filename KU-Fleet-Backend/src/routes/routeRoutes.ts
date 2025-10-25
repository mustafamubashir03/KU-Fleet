import express from "express";
import {
  createRoute,
  getRoutes,
  getRouteById,
  deleteRoute,
} from "../controllers/routeController";

const router = express.Router();

// Create new route
router.post("/", createRoute);

// Get all routes
router.get("/", getRoutes);

// Get single route
router.get("/:id", getRouteById);

// Delete route
router.delete("/:id", deleteRoute);

export default router;
