import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const passwordResetSchema = new Schema(
  {
    // Account requesting the reset — exactly one of these is set.
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff" },
    role: { type: String, enum: ["customer", "staff"], required: true },
    // Where the OTP was sent (customer's own email, or the fixed admin
    // inbox for staff resets).
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
