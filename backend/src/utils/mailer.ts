import nodemailer, { type Transporter } from "nodemailer";
import dns from "node:dns/promises";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;

// Some hosts have no IPv6 egress while smtp.gmail.com often resolves to
// IPv6 first (ENETUNREACH). Resolve the SMTP host to IPv4 explicitly and
// connect to the IP, keeping TLS verification against the real hostname.
async function getTransporter(): Promise<Transporter> {
  if (!transporter) {
    let host = env.SMTP_HOST;
    try {
      const resolved = await dns.lookup(env.SMTP_HOST, { family: 4 });
      const ip = Array.isArray(resolved) ? resolved[0]?.address : resolved.address;
      if (ip) host = ip;
    } catch (err) {
      console.error("[backend] SMTP IPv4 lookup failed, using hostname", err);
    }

    transporter = nodemailer.createTransport({
      host,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465 (Gmail SSL), false for 587 (STARTTLS)
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls: { servername: env.SMTP_HOST },
    });
  }
  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

// Safe diagnostic: only host/port/user (never log the password).
export function logMailConfig(): void {
  if (env.SMTP_USER && env.SMTP_PASS) {
    console.log(`[backend] mail provider: smtp (${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER})`);
  } else {
    console.log("[backend] mail provider: none (OTP emails will fail)");
  }
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

  await (await getTransporter()).sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Sutlej Automotives — Your password reset code",
    text: `Hi ${name}, your Sutlej password reset code is ${otp}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    html,
  });
}

export async function sendSignupOtpEmail(to: string, otp: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Sutlej Automotives — Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Use this code to verify your email and finish creating your customer account. It expires in ${env.OTP_TTL_MINUTES} minutes.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${otp}</p>
      <p style="color: #666; font-size: 13px;">If you did not request this, ignore this email.</p>
    </div>
  `;

  await (await getTransporter()).sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Sutlej Automotives — Verify your email",
    text: `Hi ${name}, your Sutlej verification code is ${otp}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    html,
  });
}
