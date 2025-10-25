import mongoose, { Schema } from "mongoose";

const sampledPointSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number },
  timestamp: { type: Date, required: true },
}, { _id: false });

const tripSegmentSchema = new Schema({
  trip: { type: Schema.Types.ObjectId, ref: "TripLog", required: true, index: true },
  bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true, index: true },
  route: { type: Schema.Types.ObjectId, ref: "Route" },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  points: { type: [sampledPointSchema], required: true }, // typically 1 point or a few, but we keep an array for flexibility
  distanceMeters: { type: Number, default: 0 }, // computed between points in this segment
  avgSpeed: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("TripSegment", tripSegmentSchema);
