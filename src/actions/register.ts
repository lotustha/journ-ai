"use server";

import { prisma } from "@/lib/db/prisma"; // Ensure this matches your prisma path
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "../../generated/prisma/client";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerAction(prevState: any, formData: FormData) {
  // 1. Validate Form Data
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation Error",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { message: "Email already registered. Please login." };
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create User (Default to CLIENT role for safety)
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.CLIENT,
      },
    });

    // 5. Success (We don't redirect automatically here to show a success message first)
    return { success: true, message: "Account created! You can now log in." };
  } catch (error) {
    console.error("Registration Error:", error);
    return { message: "Failed to create account. Please try again." };
  }
}
