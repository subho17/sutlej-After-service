import { Schema, model, type InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    customerId: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String },
  },
  { timestamps: true }
);

export type CustomerDoc = InferSchemaType<typeof customerSchema>;
export const Customer = model("Customer", customerSchema);
