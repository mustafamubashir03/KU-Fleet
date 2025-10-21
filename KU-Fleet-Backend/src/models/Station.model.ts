import mongoose, { Schema } from "mongoose";
import { IStation } from "../interfaces/Station";

const stationSchema = new Schema<IStation>(
  {
    stationName: { type: String, required: true },
    position: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true }
);

stationSchema.index({ position: "2dsphere" });

export default mongoose.model<IStation>("Station", stationSchema);
