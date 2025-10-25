import mongoose, { Schema, Document } from "mongoose";

export interface IStation extends Document {
  stationName: string;
  position: {
    type: string;
    coordinates: [number, number];
  };
}

const stationSchema = new Schema<IStation>(
  {
    stationName: {
      type: String,
      unique: true,
      required: [true, "Station name is required"],
      trim: true,
    },
    position: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Enable geospatial indexing
stationSchema.index({ position: "2dsphere" });

const Station = mongoose.model<IStation>("Station", stationSchema);
export default Station;
