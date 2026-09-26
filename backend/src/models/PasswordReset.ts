import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const passwordResetSchema = new Schema(
  {
    // Customer requesting the reset (customer-only flow, no staff).
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // NOTE: demo only — hash OTPs (bcrypt) before production use.
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-delete expired docs so the collection stays clean.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetDoc = InferSchemaType<typeof passwordResetSchema> & {
  _id: Types.ObjectId;
};
export const PasswordReset = model("PasswordReset", passwordResetSchema);
