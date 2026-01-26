"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
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

// =========================================
// DELETE IMAGE ACTIONS
// =========================================
export async function deleteResourceImage(
  id: string,
  type: "hotel" | "vehicle" | "activity",
) {
  try {
    if (type === "hotel") await prisma.hotelImage.delete({ where: { id } });
    if (type === "vehicle") await prisma.vehicleImage.delete({ where: { id } });
    if (type === "activity")
      await prisma.activityImage.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete image" };
  }
}

// =========================================
// CREATE / UPDATE ACTIONS
// =========================================

// --- HOTEL ---
export async function createHotel(prevState: any, formData: FormData) {
  const imageUrl = await saveImageLocally(formData.get("image") as File);
  const galleryUrls = await handleGalleryUpload(formData);
  const rates = JSON.parse(formData.get("rates") as string);

  try {
    await prisma.hotel.create({
      data: {
        name: formData.get("name") as string,
        locationId: formData.get("locationId") as string,
        contactInfo: formData.get("contactInfo") as string,
        imageUrl: imageUrl,
        images: { create: galleryUrls.map((url) => ({ url })) },
        rates: {
          create: rates.map((r: any) => ({
            roomType: r.roomType,
            mealPlan: r.mealPlan,
            inclusions: r.inclusions,
            costPrice: Number(r.costPrice), // 👈 Fixed
            salesPrice: Number(r.salesPrice), // 👈 Fixed
          })),
        },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Hotel created" };
  } catch (e) {
    return { error: "Database error" };
  }
}

export async function updateHotel(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const newImageUrl = await saveImageLocally(formData.get("image") as File);
  const newGalleryUrls = await handleGalleryUpload(formData);
  const rates = JSON.parse(formData.get("rates") as string);

  try {
    const updateData: any = {
      name: formData.get("name"),
      locationId: formData.get("locationId"),
      contactInfo: formData.get("contactInfo"),
    };
    if (newImageUrl) updateData.imageUrl = newImageUrl;

    await prisma.$transaction([
      prisma.hotel.update({
        where: { id },
        data: {
          ...updateData,
          images: { create: newGalleryUrls.map((url) => ({ url })) },
        },
      }),
      // Refresh Rates
      prisma.hotelRoomRate.deleteMany({ where: { hotelId: id } }),
      prisma.hotelRoomRate.createMany({
        data: rates.map((r: any) => ({
          hotelId: id,
          roomType: r.roomType,
          mealPlan: r.mealPlan,
          inclusions: r.inclusions,
          costPrice: Number(r.costPrice), // 👈 Fixed
          salesPrice: Number(r.salesPrice), // 👈 Fixed
        })),
      }),
    ]);
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Hotel updated" };
  } catch (e) {
    return { error: "Failed to update" };
  }
}

// --- VEHICLE ---
export async function createVehicle(prevState: any, formData: FormData) {
  const imageUrl = await saveImageLocally(formData.get("image") as File);
  const galleryUrls = await handleGalleryUpload(formData);

  try {
    await prisma.vehicle.create({
      data: {
        name: formData.get("name") as string,
        type: formData.get("type") as string,
        plateNumber: formData.get("plateNumber") as string,
        driverName: formData.get("driverName") as string,
        contactNumber: formData.get("contactNumber") as string,
        details: formData.get("details") as string,

        // 👈 NEW PRICING FIELDS
        costPerDay: Number(formData.get("costPerDay")),
        salesPerDay: Number(formData.get("salesPerDay")),
        costPerKm: Number(formData.get("costPerKm")),
        salesPerKm: Number(formData.get("salesPerKm")),

        driverAllowance: Number(formData.get("driverAllowance")),
        imageUrl: imageUrl,
        images: { create: galleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Vehicle created" };
  } catch (e) {
    return { error: "Failed to create" };
  }
}

export async function updateVehicle(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const newImageUrl = await saveImageLocally(formData.get("image") as File);
  const newGalleryUrls = await handleGalleryUpload(formData);

  try {
    const updateData: any = {
      name: formData.get("name"),
      type: formData.get("type"),
      plateNumber: formData.get("plateNumber"),
      driverName: formData.get("driverName"),
      contactNumber: formData.get("contactNumber"),
      details: formData.get("details"),

      // 👈 NEW PRICING FIELDS
      costPerDay: Number(formData.get("costPerDay")),
      salesPerDay: Number(formData.get("salesPerDay")),
      costPerKm: Number(formData.get("costPerKm")),
      salesPerKm: Number(formData.get("salesPerKm")),
      driverAllowance: Number(formData.get("driverAllowance")),
    };
    if (newImageUrl) updateData.imageUrl = newImageUrl;

    await prisma.vehicle.update({
      where: { id },
      data: {
        ...updateData,
        images: { create: newGalleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Vehicle updated" };
  } catch (e) {
    return { error: "Failed to update" };
  }
}

// --- ACTIVITY ---
export async function createActivity(prevState: any, formData: FormData) {
  const imageUrl = await saveImageLocally(formData.get("image") as File);
  const galleryUrls = await handleGalleryUpload(formData);

  try {
    await prisma.activity.create({
      data: {
        name: formData.get("name") as string,
        locationId: (formData.get("locationId") as string) || null,
        details: formData.get("details") as string,

        // 👈 NEW PRICING FIELDS
        costPrice: Number(formData.get("costPrice")),
        salesPrice: Number(formData.get("salesPrice")),

        imageUrl: imageUrl,
        images: { create: galleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Activity created" };
  } catch (e) {
    return { error: "Failed to create" };
  }
}

export async function updateActivity(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const newImageUrl = await saveImageLocally(formData.get("image") as File);
  const newGalleryUrls = await handleGalleryUpload(formData);

  try {
    const updateData: any = {
      name: formData.get("name"),
      locationId: (formData.get("locationId") as string) || null,
      details: formData.get("details"),

      // 👈 NEW PRICING FIELDS
      costPrice: Number(formData.get("costPrice")),
      salesPrice: Number(formData.get("salesPrice")),
    };
    if (newImageUrl) updateData.imageUrl = newImageUrl;

    await prisma.activity.update({
      where: { id },
      data: {
        ...updateData,
        images: { create: newGalleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Activity updated" };
  } catch (e) {
    return { error: "Failed to update" };
  }
}

// --- DELETE GENERIC ---
export async function deleteResource(
  id: string,
  type: "hotel" | "vehicle" | "activity",
) {
  try {
    if (type === "hotel") await prisma.hotel.delete({ where: { id } });
    if (type === "vehicle") await prisma.vehicle.delete({ where: { id } });
    if (type === "activity") await prisma.activity.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Deleted successfully" };
  } catch (e) {
    return { error: "Cannot delete resource in use." };
  }
}
