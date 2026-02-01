"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  // We don't update email usually as it requires verification
  // Profile Image URL would ideally come from an upload service (like S3/Cloudinary)
  // For now, we assume a text URL or placeholder logic

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { error: "Failed to update profile" };
  }
}
