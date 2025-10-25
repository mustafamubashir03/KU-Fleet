import express from "express";
import {
  uploadDriverPhoto,
  uploadBusPhoto,
  deletePhoto,
  getUploadUrl
} from "../controllers/uploadController";
import { protect, adminOnly } from "../middleware/AuthMiddleware";

const router = express.Router();

// Protected routes
router.post("/driver/:userId", protect, uploadDriverPhoto);
router.post("/bus/:busId", protect, adminOnly, uploadBusPhoto);
router.delete("/photo/:publicId", protect, deletePhoto);
router.get("/url", protect, getUploadUrl);

export default router;
