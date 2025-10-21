import mongoose, { Schema } from "mongoose";
import { ITripLog } from "../interfaces/TripLog";

const tripLogSchema = new Schema<ITripLog>(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    coordinates: [
      {
        lat: Number,
        lng: Number,
        speed: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    distance: Number,
    avgSpeed: Number,
  },
  { timestamps: true }
);

tripLogSchema.index({ bus: 1, startTime: -1 });

export default mongoose.model<ITripLog>("TripLog", tripLogSchema);
