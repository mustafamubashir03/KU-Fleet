import { Schema, model, Document, Types } from "mongoose";

export interface IFeedback extends Document {
  bus: Types.ObjectId;
  user?: Types.ObjectId; // student who submitted feedback
  driver?: Types.ObjectId;
  trip?: Types.ObjectId; // link to specific trip
  rfidLog?: Types.ObjectId; // proof of actual boarding
  rating: number; // 1–5 stars
  comment?: string;
  type?: "complaint" | "suggestion" | "general";
  resolved: boolean;
  response?: string;
  photo?: string; // optional image proof
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    trip: { type: Schema.Types.ObjectId, ref: "TripLog" },
    rfidLog: { type: Schema.Types.ObjectId, ref: "RFIDLog" },
    rating: { type: Number, min: 1, max: 5, default: 3 },  
    comment: { type: String, trim: true, maxlength: 500 },
    type: {
      type: String,
      enum: ["complaint", "suggestion", "general"],
      default: "general",
    },
    resolved: { type: Boolean, default: false },
    response: { type: String, trim: true },
    photo: { type: String }, // Cloudinary URL, optional
  },
  { timestamps: true }
);

// Indexes for better analytics
feedbackSchema.index({ bus: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ trip: 1 });
feedbackSchema.index({ user: 1 });

const Feedback = model<IFeedback>("Feedback", feedbackSchema);
export default Feedback;
