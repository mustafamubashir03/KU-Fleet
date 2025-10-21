import mongoose, { Schema } from "mongoose";
import { IAlert } from "../interfaces/Alert";

const alertSchema = new Schema<IAlert>(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    type: { 
      type: String, 
      enum: ["panic", "overspeed", "routeDeviation", "system", "other"], 
      default: "other" 
    },
    message: String,
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    resolved: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

alertSchema.index({ bus: 1, type: 1, timestamp: -1 });

export default mongoose.model<IAlert>("Alert", alertSchema);
