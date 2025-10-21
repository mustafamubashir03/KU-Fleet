import { Document, Types } from "mongoose";

export interface IFeedback extends Document {
  bus?: Types.ObjectId;
  student?: Types.ObjectId;
  rating: number;
  comment?: string;
  reply?: string;
  resolved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
