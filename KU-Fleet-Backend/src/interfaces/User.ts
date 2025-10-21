import { Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "driver" | "student" | "parent";
  phone?: string;
  rfidCardUID?: string;
  assignedBus?: Types.ObjectId;
  parentOf?: Types.ObjectId[];
  status: "active" | "inactive";
  photo?: string;
}
