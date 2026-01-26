"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "crypto";

// --- FILE HELPER ---
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

async function saveImageLocally(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/${fileName}`;
}

const CountrySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

// --- ACTIONS ---

export async function createCountry(prevState: any, formData: FormData) {
  const data = CountrySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!data.success) return { error: "Invalid data" };

  // 1. Cover Image
  const coverFile = formData.get("coverImage") as File | null;
  const coverUrl = await saveImageLocally(coverFile);

  // 2. Gallery Images
  const galleryFiles = formData.getAll("galleryImages") as File[];
  const galleryUrls: string[] = [];

  for (const file of galleryFiles) {
    const url = await saveImageLocally(file);
    if (url) galleryUrls.push(url);
  }

  try {
    await prisma.country.create({
      data: {
        ...data.data,
        imageUrl: coverUrl,
        images: {
          create: galleryUrls.map((url) => ({ url })),
        },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Country added" };
  } catch (e) {
    return { error: "Country already exists" };
  }
}

export async function updateCountry(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const data = CountrySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!data.success) return { error: "Invalid data" };

  // 1. New Cover?
  const coverFile = formData.get("coverImage") as File | null;
  const newCoverUrl = await saveImageLocally(coverFile);

  // 2. New Gallery Images?
  const galleryFiles = formData.getAll("galleryImages") as File[];
  const newGalleryUrls: string[] = [];
  for (const file of galleryFiles) {
    const url = await saveImageLocally(file);
    if (url) newGalleryUrls.push(url);
  }

  try {
    const updateData: any = { ...data.data };
    if (newCoverUrl) updateData.imageUrl = newCoverUrl;

    await prisma.country.update({
      where: { id },
      data: {
        ...updateData,
        images: {
          create: newGalleryUrls.map((url) => ({ url })),
        },
      },
    });

    revalidatePath("/dashboard/resources");
    return { success: true, message: "Country updated" };
  } catch (e) {
    return { error: "Update failed" };
  }
}

// 👇 NEW: Delete single gallery image
export async function deleteCountryImage(imageId: string) {
  try {
    const img = await prisma.countryImage.findUnique({
      where: { id: imageId },
    });
    if (img?.url.startsWith("/uploads/")) {
      // Optional: Delete local file logic here
    }
    await prisma.countryImage.delete({ where: { id: imageId } });
    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete image" };
  }
}

export async function deleteCountry(id: string) {
  try {
    await prisma.country.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Country deleted" };
  } catch (e) {
    return { error: "Cannot delete. Locations linked." };
  }
}
