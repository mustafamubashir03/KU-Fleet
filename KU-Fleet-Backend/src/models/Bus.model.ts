import mongoose, { Schema } from "mongoose";
import { IBus } from "../interfaces/Bus";

const busSchema = new Schema<IBus>(
  {
    busNumber: { type: String, required: true, unique: true },
    busNumberPlate: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 50 },
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    trackerIMEI: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    lastKnownLocation: {
      lat: Number,
      lng: Number,
      speed: Number,
      timestamp: Date,
    },
    lastLocation: {
      lat: Number,
      lng: Number,
    },
    lastUpdate: Date,
    plateNumber: { type: String, required: true, unique: true },
    photo: {
      url: String,
      publicId: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBus>("Bus", busSchema);
