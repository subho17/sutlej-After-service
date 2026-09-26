import { Schema, model, type InferSchemaType } from "mongoose";

const complaintSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
);

export type ComplaintDoc = InferSchemaType<typeof complaintSchema>;
export const Complaint = model("Complaint", complaintSchema);
