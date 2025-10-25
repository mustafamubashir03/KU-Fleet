// src/routes/feedbackRoutes.ts
import express from "express";
import {
  submitFeedback,
  getAllFeedbacks,
  getFeedbackByBus,
  resolveFeedback,
  deleteFeedback,
} from "../controllers/feedbackController";
import { adminOnly, protect } from "../middleware/AuthMiddleware";


const router = express.Router();

// 🟢 Public (students)
router.post("/submit",protect, submitFeedback);             

// 🔒 Admin-only
router.get("/",protect, adminOnly, getAllFeedbacks);
router.get("/bus/:busId",protect, adminOnly, getFeedbackByBus);
router.put("/:id/resolve",protect, adminOnly, resolveFeedback);
router.delete("/:id",protect, adminOnly, deleteFeedback);

export default router;
