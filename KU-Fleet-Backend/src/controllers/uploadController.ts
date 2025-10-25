import { Request, Response } from "express";
import { uploadSingle, uploadMultiple, deleteImage } from "../middleware/uploadMiddleware";
import User from "../models/User.model";
import Bus from "../models/Bus.model";
import Feedback from "../models/Feedback.model";

// ✅ Upload driver photo
export const uploadDriverPhoto = [
  uploadSingle("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Delete old photo if exists
      if (user.photo) {
        await deleteImage(user.photo);
      }

      user.photo = req.file.path;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Driver photo uploaded successfully",
        photo: user.photo,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload driver photo", error });
    }
  },
];

// ✅ Upload bus photo
// Upload bus photo
export const uploadBusPhoto = [
  uploadSingle("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { busId } = req.params;
      const bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
      }

      // ✅ Safe check before deleting old photo
      if (bus.photo?.publicId) {
        await deleteImage(bus.photo.publicId);
      }

      // ✅ Assign Cloudinary file path & ID correctly
      bus.photo = {
        url: req.file.path,
        publicId: req.file.filename,
      };

      await bus.save();

      res.status(200).json({
        success: true,
        message: "Bus photo uploaded successfully",
        photo: bus.photo,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload bus photo", error });
    }
  },
];



// ✅ Upload feedback photo (only one, no media array)
export const uploadFeedbackPhoto = [
  uploadSingle("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { feedbackId } = req.params;
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) return res.status(404).json({ message: "Feedback not found" });

      // Delete old photo if exists
      if (feedback.photo) {
        await deleteImage(feedback.photo);
      }

      feedback.photo = req.file.path;
      await feedback.save();

      res.status(200).json({
        success: true,
        message: "Feedback photo uploaded successfully",
        photo: feedback.photo,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload feedback photo", error });
    }
  },
];

// ✅ Delete photo
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const result = await deleteImage(publicId as string);

    if (result?.result === "ok") {
      res.status(200).json({ success: true, message: "Photo deleted successfully" });
    } else {
      res.status(400).json({ success: false, message: "Failed to delete photo" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete photo", error });
  }
};

// ✅ Get direct client upload URL
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { folder = "ku-fleet", type = "image" } = req.query;
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = require("crypto")
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest("hex");

    res.status(200).json({
      success: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${type}/upload`,
      params: {
        folder,
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate upload URL", error });
  }
};
