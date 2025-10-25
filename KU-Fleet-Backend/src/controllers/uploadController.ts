import { Request, Response } from "express";
import { uploadSingle, uploadMultiple, deleteImage } from "../middleware/uploadMiddleware";
import User from "../models/User.model";
import Bus from "../models/Bus.model";
import Feedback from "../models/Feedback.model";

// Upload driver photo
export const uploadDriverPhoto = [
  uploadSingle("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete old photo if exists
      if (user.photo && user.photo.publicId) {
        await deleteImage(user.photo.publicId);
      }

      // Update user with new photo
      user.photo = {
        url: req.file.path,
        publicId: req.file.filename
      };
      
      await user.save();

      res.status(200).json({
        success: true,
        message: "Driver photo uploaded successfully",
        photo: user.photo
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload driver photo", error });
    }
  }
];

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

      // Delete old photo if exists
      if (bus.photo && bus.photo.publicId) {
        await deleteImage(bus.photo.publicId);
      }

      // Update bus with new photo
      bus.photo = {
        url: req.file.path,
        publicId: req.file.filename
      };
      
      await bus.save();

      res.status(200).json({
        success: true,
        message: "Bus photo uploaded successfully",
        photo: bus.photo
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload bus photo", error });
    }
  }
];

// Upload feedback media
export const uploadFeedbackMedia = [
  uploadMultiple("media", 5),
  async (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const { feedbackId } = req.params;
      const feedback = await Feedback.findById(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      const files = req.files as Express.Multer.File[];
      const mediaItems = files.map(file => ({
        url: file.path,
        publicId: file.filename,
        type: file.mimetype.startsWith("image/") ? "image" : "video"
      }));

      // Add new media to existing media array
      feedback.media = [...(feedback.media || []), ...mediaItems];
      await feedback.save();

      res.status(200).json({
        success: true,
        message: "Feedback media uploaded successfully",
        media: feedback.media
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload feedback media", error });
    }
  }
];

// Delete photo
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    
    const result = await deleteImage(publicId);
    
    if (result.result === "ok") {
      res.status(200).json({
        success: true,
        message: "Photo deleted successfully"
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete photo"
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete photo", error });
  }
};

// Get upload URL for direct client upload
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { folder = "ku-fleet", type = "image" } = req.query;
    
    // Generate upload signature for client-side upload
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
        api_key: process.env.CLOUDINARY_API_KEY
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate upload URL", error });
  }
};
