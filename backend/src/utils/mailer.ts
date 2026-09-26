import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465 (Gmail SSL), false for 587 (STARTTLS)
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

export async function sendOtpEmail(to: string, otp: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Sutlej Automotives — Password Reset</h2>
      <p>Hi ${name},</p>
      <p>Use this code to reset your customer portal password. It expires in ${env.OTP_TTL_MINUTES} minutes.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${otp}</p>
      <p style="color: #666; font-size: 13px;">If you did not request this, ignore this email.</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Sutlej Automotives — Your password reset code",
    text: `Hi ${name}, your Sutlej password reset code is ${otp}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    html,
  });
}
