import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
} from "../controllers/userController";
import { adminOnly, protect } from "../middleware/AuthMiddleware";


const router = express.Router();

router.get("/", protect, adminOnly, getAllUsers);
router
  .route("/:id")
  .get(protect, getUserById)
  .patch(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deactivateUser);

export default router;
