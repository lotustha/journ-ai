"use server";

import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const ResetSchema = z
  .object({
    token: z.string(),
    password: z.string().min(6, "Password must be at least 6 chars"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(prevState: any, formData: FormData) {
  const validated = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return {
      error: "Invalid data",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { token, password } = validated.data;

  // Verify Token
  const existingToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return { error: "Invalid token" };
  }

  const hasExpired = new Date() > existingToken.expires;
  if (hasExpired) {
    return { error: "Token has expired" };
  }

  // Update User Password
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: existingToken.email },
    data: { passwordHash: hashedPassword },
  });

  // Delete the token (Single use)
  await prisma.passwordResetToken.delete({
    where: { id: existingToken.id },
  });

  return { success: true, message: "Password updated! You can now login." };
}
