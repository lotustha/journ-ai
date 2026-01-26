"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "crypto";

// Config
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Schema
const LocationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2),
  altitude: z.number().optional(),
  description: z.string().optional(),
});

// Helper: Save Image
async function saveImageLocally(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  // Validate type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    console.error(`Invalid file type: ${file.type}`);
    return null;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/${fileName}`;
}

// 1. CREATE
export async function createLocation(prevState: any, formData: FormData) {
  const imageFile = formData.get("image") as File | null;
  let imageUrl = null;

  try {
    imageUrl = await saveImageLocally(imageFile);
  } catch (e) {
    console.error(e);
  }

  const rawAltitude = formData.get("altitude");
  const altitude =
    rawAltitude && rawAltitude !== "" ? Number(rawAltitude) : undefined;
  const rawDesc = formData.get("description") as string;
  const description = rawDesc || undefined;

  const data = LocationSchema.safeParse({
    name: formData.get("name"),
    altitude: altitude,
    country: formData.get('country'),
    description: description,
  });

  if (!data.success) return { error: "Invalid data. Name required." };

  try {
    await prisma.location.create({
      data: { ...data.data, imageUrl: imageUrl },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Location added successfully" };
  } catch (e) {
    return { error: "Failed to create location." };
  }
}

// 2. UPDATE (With Image Cleanup)
export async function updateLocation(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;

  // A. Handle New Image Upload
  const imageFile = formData.get("image") as File | null;
  let newImageUrl = null;

  if (imageFile && imageFile.size > 0) {
    try {
      newImageUrl = await saveImageLocally(imageFile);
    } catch (e) {
      console.error("Image Update Error:", e);
    }
  }

  // B. Sanitize Text Inputs
  const rawAltitude = formData.get("altitude");
  const altitude =
    rawAltitude && rawAltitude !== "" ? Number(rawAltitude) : undefined;
  const rawDesc = formData.get("description") as string;
  const description = rawDesc || undefined;

  const data = LocationSchema.safeParse({
    name: formData.get("name"),
    country: formData.get('country'),
    altitude: altitude,
    description: description,
  });

  if (!data.success) return { error: "Invalid data." };

  try {
    const updateData: any = { ...data.data };

    // C. Delete Old Image if New One Exists
    if (newImageUrl) {
      updateData.imageUrl = newImageUrl;

      // 1. Find the old record
      const oldLocation = await prisma.location.findUnique({
        where: { id },
        select: { imageUrl: true },
      });

      // 2. If it has an image and it's a local upload, delete it
      if (
        oldLocation?.imageUrl &&
        oldLocation.imageUrl.startsWith("/uploads/")
      ) {
        const oldPath = path.join(
          process.cwd(),
          "public",
          oldLocation.imageUrl,
        );
        try {
          await fs.unlink(oldPath);
          console.log(`Deleted old image: ${oldPath}`);
        } catch (err) {
          console.warn(
            "Could not delete old image (file might be missing):",
            err,
          );
        }
      }
    }

    // D. Update Database
    await prisma.location.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/resources");
    return { success: true, message: "Location updated successfully" };
  } catch (e) {
    return { error: "Failed to update location." };
  }
}

// 3. DELETE (With Image Cleanup)
export async function deleteLocation(id: string) {
  try {
    const loc = await prisma.location.findUnique({ where: { id } });

    // Delete image file first
    if (loc?.imageUrl && loc.imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", loc.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (e) { }
    }

    await prisma.location.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Location deleted" };
  } catch (e) {
    return { error: "Cannot delete. Hotels/Activities are linked here." };
  }
}
