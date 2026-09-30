import nodemailer, { type Transporter } from "nodemailer";
import dns from "node:dns/promises";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;

// Render has no IPv6 egress, but smtp.gmail.com often resolves to IPv6
// first (ENETUNREACH). Resolve the SMTP host to IPv4 explicitly and
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
  // Brevo HTTP API (works everywhere, incl. hosts that block SMTP ports),
  // else plain SMTP (local dev with Gmail app password).
  return Boolean(env.BREVO_API_KEY || (env.SMTP_USER && env.SMTP_PASS));
}

function parseSender(): { name: string; email: string } {
  const match = env.SMTP_FROM.match(/^(.*)<([^>]+)>$/);
  if (match) return { name: match[1].trim() || "Sutlej Automotives", email: match[2].trim() };
  return { name: "Sutlej Automotives", email: env.SMTP_FROM };
}

async function sendViaBrevo(to: string, toName: string, subject: string, text: string, html: string): Promise<void> {
  const sender = parseSender();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to, name: toName }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo rejected the email (${res.status}): ${detail}`);
  }
}

async function deliver(
  to: string,
  toName: string,
  subject: string,
  text: string,
  html: string
): Promise<void> {
  if (env.BREVO_API_KEY) return sendViaBrevo(to, toName, subject, text, html);
  await (await getTransporter()).sendMail({ from: env.SMTP_FROM, to, subject, text, html });
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

  await deliver(
    to,
    name,
    "Sutlej Automotives — Your password reset code",
    `Hi ${name}, your Sutlej password reset code is ${otp}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    html
  );
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

  await deliver(
    to,
    name,
    "Sutlej Automotives — Verify your email",
    `Hi ${name}, your Sutlej verification code is ${otp}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    html
  );
}
