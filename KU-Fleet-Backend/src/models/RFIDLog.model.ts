import mongoose, { Schema, Document } from "mongoose";

export interface IRFIDLog extends Document {
  rfidTag: string; // unique RFID tag UID
  student: mongoose.Types.ObjectId; // ref: User (role: student)
  bus: mongoose.Types.ObjectId;
  eventType: "BOARD" | "EXIT";
  timestamp: Date;
  trip?: mongoose.Types.ObjectId; // optional link to active trip
}

const rfidLogSchema = new Schema<IRFIDLog>(
  {
    rfidTag: { type: String, required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    eventType: { type: String, enum: ["BOARD", "EXIT"], required: true },
    timestamp: { type: Date, default: Date.now },
    trip: { type: Schema.Types.ObjectId, ref: "TripLog" },
  },
  { timestamps: true }
);

rfidLogSchema.index({ bus: 1, timestamp: -1 });

export default mongoose.model<IRFIDLog>("RFIDLog", rfidLogSchema);
