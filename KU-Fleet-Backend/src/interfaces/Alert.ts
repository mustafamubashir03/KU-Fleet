import { Document, Types } from "mongoose";

export interface IAlert extends Document {
  bus: Types.ObjectId;
  type: "panic" | "overspeed" | "routeDeviation" | "system" | "other";
  message?: string;
  priority: "low" | "medium" | "high";
  resolved: boolean;
  timestamp: Date;
}
