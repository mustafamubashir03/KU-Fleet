import { Document, Types } from "mongoose";

export interface IMedia extends Document {
  bus?: Types.ObjectId;
  type: "photo" | "video";
  url: string;
  capturedAt: Date;
  source: "camera" | "upload";
}
