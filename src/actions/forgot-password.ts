"use server";

import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";

// --- 1. Request Reset Link ---

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  const validated = ForgotPasswordSchema.safeParse({ email });
  if (!validated.success) {
    return { message: "Invalid email address" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    };
  }

  // Generate Token
  const token = crypto.randomUUID();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 Hour

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // 👇 PROFESSIONAL EMAIL TEMPLATE
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #1e293b; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 32px 24px; color: #334155; line-height: 1.6; }
        .button-wrapper { text-align: center; margin: 32px 0; }
        .button { background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .link-text { color: #2563eb; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JournAI</h1>
        </div>
        
        <div class="content">
          <h2 style="margin-top: 0; color: #0f172a;">Password Reset Request</h2>
          <p>Hello ${user.name || "Traveler"},</p>
          <p>We received a request to reset the password for your JournAI account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div class="button-wrapper">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>

          <p style="font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px;"><a href="${resetLink}" class="link-text">${resetLink}</a></p>
        </div>

        <div class="footer">
          <p>This link will expire in 60 minutes.</p>
          <p>&copy; ${new Date().getFullYear()} JournAI Inc. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🔒 Reset your JournAI Password", // Added emoji for visibility
      html: emailHtml,
    });

    return { success: true, message: "Check your email for the reset link." };
  } catch (error) {
    console.error("Email Error:", error);
    return { message: "Failed to send email. Please try again later." };
  }
}
