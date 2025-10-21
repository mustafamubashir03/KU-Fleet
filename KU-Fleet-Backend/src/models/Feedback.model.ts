import { Schema, model, Document, Types } from "mongoose";

export interface IFeedback extends Document {
  bus: Types.ObjectId;
  user?: Types.ObjectId; // optional - student or parent who submitted
  driver?: Types.ObjectId;
  rating: number; // 1–5 stars
  comment?: string;
  type?: "complaint" | "suggestion" | "general";
  resolved: boolean;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    bus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["complaint", "suggestion", "general"],
      default: "general",
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    response: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster analytics and filtering
feedbackSchema.index({ bus: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ createdAt: -1 });

const Feedback = model<IFeedback>("Feedback", feedbackSchema);
export default Feedback;
