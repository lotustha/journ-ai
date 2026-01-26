"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

// 1. Server Action for Logging In
export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Attempt to sign in
    // This will THROW an error if it succeeds (NextJS Redirect)
    // or if it fails (AuthError)
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // We must catch the error to check its type
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Invalid email or password." };
        default:
          return { message: "Something went wrong. Please try again." };
      }
    }

    // ⚠️ CRITICAL: Next.js redirects are actually thrown errors.
    // We must re-throw non-Auth errors so the redirect happens.
    throw error;
  }

  // Return default state if no error (though redirect usually happens before this)
  return { message: "" };
}

// 2. Server Action for Logging Out
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
