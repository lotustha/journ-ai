"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "crypto";

// --- CONFIG ---
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export async function saveImageLocally(
  file: File | null,
): Promise<string | null> {
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

export async function handleGalleryUpload(
  formData: FormData,
  key: string = "galleryImages",
): Promise<string[]> {
  const files = formData.getAll(key) as File[];
  const urls: string[] = [];
  for (const file of files) {
    const url = await saveImageLocally(file);
    if (url) urls.push(url);
  }
  return urls;
}
