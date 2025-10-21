import mongoose, { Schema } from "mongoose";
import { IRFIDLog } from "../interfaces/RFIDLog";

const rfidLogSchema = new Schema<IRFIDLog>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bus: { type: Schema.Types.ObjectId, ref: "Bus" },
    cardUID: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    valid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rfidLogSchema.index({ student: 1, timestamp: -1 });

export default mongoose.model<IRFIDLog>("RFIDLog", rfidLogSchema);
