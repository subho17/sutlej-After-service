import { Schema, model, type InferSchemaType } from "mongoose";

const staffSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    staffId: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "staff", trim: true },
  },
  { timestamps: true }
);

export type StaffDoc = InferSchemaType<typeof staffSchema>;
export const Staff = model("Staff", staffSchema);
