import { Document, Types } from "mongoose";

export interface IRFIDLog extends Document {
  student: Types.ObjectId;
  bus?: Types.ObjectId;
  cardUID: string;
  timestamp: Date;
  valid: boolean;
}