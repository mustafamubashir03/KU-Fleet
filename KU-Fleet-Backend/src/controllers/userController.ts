import { Request, Response } from "express";
import User from "../models/User.model";


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error });
  }
};


export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, active } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, active },
      { new: true }
    ).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error });
  }
};

//Admin only (soft delete)
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deactivated", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate user", error });
  }
};
