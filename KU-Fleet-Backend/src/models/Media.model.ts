import mongoose, { Schema } from "mongoose";
import { IMedia } from "../interfaces/Media";

const mediaSchema = new Schema<IMedia>(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus" },
    type: { type: String, enum: ["photo", "video"], default: "photo" },
    url: { type: String, required: true },
    capturedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ["camera", "upload"], default: "camera" },
  },
  { timestamps: true }
);

mediaSchema.index({ bus: 1, capturedAt: -1 });

export default mongoose.model<IMedia>("Media", mediaSchema);
