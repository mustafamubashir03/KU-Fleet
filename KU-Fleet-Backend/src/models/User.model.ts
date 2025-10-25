// src/models/User.model.ts
import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/User";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "driver", "student", "parent"],
      default: "student",
    },

    phone: String,
    contactInfo: String,
    age: Number,
    experienceYears: Number,
    cnic: { type: String },
    licenseNumber: { type: String },
    licenseImage: { type: String }, // Cloudinary URL
    photo: { type: String }, // Profile photo

    rfidCardUID: { type: String, unique: true, sparse: true },
    assignedBus: { type: Schema.Types.ObjectId, ref: "Bus" },
    parentOf: [{ type: Schema.Types.ObjectId, ref: "User" }],

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    remarks: String, // admin notes
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
