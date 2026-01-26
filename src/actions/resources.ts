"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "crypto";

// --- CONFIG & HELPER ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/${fileName}`;
}

async function deleteLocalImage(url: string | null) {
  if (url && url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      /* ignore missing files */
    }
  }
}

// --- SCHEMAS ---
const HotelSchema = z.object({
  name: z.string().min(2),
  locationId: z.string().min(2, "Location is required"),
  contactInfo: z.string().optional(),
  imageUrl: z.string().optional(),
  rates: z.array(
    z.object({
      roomType: z.string(),
      mealPlan: z.string(),
      inclusions: z.string().optional(),
      costPrice: z.coerce.number(),
      currency: z.string(),
    }),
  ),
});

const VehicleSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  plateNumber: z.string().optional(),
  driverName: z.string().optional(),
  contactNumber: z.string().optional(),
  imageUrl: z.string().optional(),
  ratePerDay: z.coerce.number().optional(),
  ratePerKm: z.coerce.number().optional(),
  driverAllowance: z.coerce.number().optional(),
  currency: z.string(),
});

const ActivitySchema = z.object({
  name: z.string().min(2),
  locationId: z.string().optional(),
  imageUrl: z.string().optional(),
  costPerHead: z.coerce.number(),
  currency: z.string(),
});

// =========================================
// CREATE ACTIONS
// =========================================

export async function createHotel(prevState: any, formData: FormData) {
  // 1. Handle Image
  const imageFile = formData.get("image") as File | null;
  let imageUrl = null;
  try {
    imageUrl = await saveImageLocally(imageFile);
  } catch (e) {
    console.error(e);
  }

  // 2. Parse Data
  const ratesRaw = formData.get("rates") as string;
  let rates = [];
  try {
    rates = JSON.parse(ratesRaw);
  } catch (e) {
    return { error: "Invalid rate data" };
  }

  const data = HotelSchema.safeParse({
    name: formData.get("name"),
    locationId: formData.get("locationId"),
    contactInfo: formData.get("contactInfo"),
    imageUrl: imageUrl, // Use the saved URL
    rates: rates,
  });

  if (!data.success) return { error: "Invalid data" };

  try {
    await prisma.hotel.create({
      data: {
        name: data.data.name,
        locationId: data.data.locationId,
        contactInfo: data.data.contactInfo,
        imageUrl: data.data.imageUrl,
        rates: { create: data.data.rates },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Hotel created successfully" };
  } catch (e) {
    return { error: "Database error" };
  }
}

export async function createVehicle(prevState: any, formData: FormData) {
  const imageFile = formData.get("image") as File | null;
  let imageUrl = null;
  try {
    imageUrl = await saveImageLocally(imageFile);
  } catch (e) {
    console.error(e);
  }

  const data = VehicleSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    plateNumber: formData.get("plateNumber"),
    driverName: formData.get("driverName"),
    contactNumber: formData.get("contactNumber"),
    imageUrl: imageUrl,
    ratePerDay: formData.get("ratePerDay"),
    ratePerKm: formData.get("ratePerKm"),
    driverAllowance: formData.get("driverAllowance"),
    currency: formData.get("currency"),
  });

  if (!data.success) return { error: "Invalid data" };

  try {
    await prisma.vehicle.create({ data: data.data });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Vehicle created successfully" };
  } catch (e) {
    return { error: "Failed to create vehicle" };
  }
}

export async function createActivity(prevState: any, formData: FormData) {
  const imageFile = formData.get("image") as File | null;
  let imageUrl = null;
  try {
    imageUrl = await saveImageLocally(imageFile);
  } catch (e) {
    console.error(e);
  }

  const locId = formData.get("locationId") as string;
  const data = ActivitySchema.safeParse({
    name: formData.get("name"),
    locationId: locId || undefined,
    imageUrl: imageUrl,
    costPerHead: formData.get("costPerHead"),
    currency: formData.get("currency"),
  });

  if (!data.success) return { error: "Invalid data" };

  try {
    await prisma.activity.create({ data: data.data });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Activity created successfully" };
  } catch (e) {
    return { error: "Failed to create activity" };
  }
}

// =========================================
// UPDATE ACTIONS
// =========================================

export async function updateHotel(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;

  // Handle Image Update
  const imageFile = formData.get("image") as File | null;
  let newImageUrl = null;
  if (imageFile && imageFile.size > 0) {
    try {
      newImageUrl = await saveImageLocally(imageFile);
    } catch (e) {
      console.error(e);
    }
  }

  const ratesRaw = formData.get("rates") as string;
  let rates = [];
  try {
    rates = JSON.parse(ratesRaw);
  } catch (e) {
    return { error: "Invalid rate data" };
  }

  const data = HotelSchema.safeParse({
    name: formData.get("name"),
    locationId: formData.get("locationId"),
    contactInfo: formData.get("contactInfo"),
    imageUrl: newImageUrl || undefined, // Only validate if new one exists, logic handled below
    rates: rates,
  });

  if (!data.success) return { error: "Invalid data" };

  try {
    const updateData: any = {
      name: data.data.name,
      locationId: data.data.locationId,
      contactInfo: data.data.contactInfo,
    };

    if (newImageUrl) {
      updateData.imageUrl = newImageUrl;
      // Find old and delete
      const old = await prisma.hotel.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      await deleteLocalImage(old?.imageUrl || null);
    }

    await prisma.$transaction([
      prisma.hotel.update({ where: { id }, data: updateData }),
      prisma.hotelRoomRate.deleteMany({ where: { hotelId: id } }),
      prisma.hotelRoomRate.createMany({
        data: data.data.rates.map((r) => ({
          hotelId: id,
          roomType: r.roomType,
          mealPlan: r.mealPlan,
          inclusions: r.inclusions,
          costPrice: r.costPrice,
          currency: r.currency,
        })),
      }),
    ]);
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Hotel updated successfully" };
  } catch (e) {
    return { error: "Failed to update hotel" };
  }
}

export async function updateVehicle(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;

  const imageFile = formData.get("image") as File | null;
  let newImageUrl = null;
  if (imageFile && imageFile.size > 0) {
    try {
      newImageUrl = await saveImageLocally(imageFile);
    } catch (e) {
      console.error(e);
    }
  }

  const data = VehicleSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    plateNumber: formData.get("plateNumber"),
    driverName: formData.get("driverName"),
    contactNumber: formData.get("contactNumber"),
    imageUrl: newImageUrl || undefined,
    ratePerDay: formData.get("ratePerDay"),
    ratePerKm: formData.get("ratePerKm"),
    driverAllowance: formData.get("driverAllowance"),
    currency: formData.get("currency"),
  });

  if (!data.success) return { error: "Invalid data" };

  try {
    const updateData: any = { ...data.data };
    // Remove imageUrl from updateData if it is undefined (so we don't overwrite with null)
    if (!newImageUrl) delete updateData.imageUrl;
    else {
      const old = await prisma.vehicle.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      await deleteLocalImage(old?.imageUrl || null);
    }

    await prisma.vehicle.update({ where: { id }, data: updateData });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Vehicle updated successfully" };
  } catch (e) {
    return { error: "Failed to update vehicle" };
  }
}

export async function updateActivity(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const locId = formData.get("locationId") as string;

  const imageFile = formData.get("image") as File | null;
  let newImageUrl = null;
  if (imageFile && imageFile.size > 0) {
    try {
      newImageUrl = await saveImageLocally(imageFile);
    } catch (e) {
      console.error(e);
    }
  }

  const data = ActivitySchema.safeParse({
    name: formData.get("name"),
    locationId: locId || null,
    imageUrl: newImageUrl || undefined,
    costPerHead: formData.get("costPerHead"),
    currency: formData.get("currency"),
  });

  if (!data.success) return { error: "Invalid data" };

  try {
    const updateData: any = { ...data.data };
    if (!newImageUrl) delete updateData.imageUrl;
    else {
      const old = await prisma.activity.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      await deleteLocalImage(old?.imageUrl || null);
    }

    await prisma.activity.update({ where: { id }, data: updateData });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Activity updated successfully" };
  } catch (e) {
    return { error: "Failed to update activity" };
  }
}

export async function deleteResource(
  id: string,
  type: "hotel" | "vehicle" | "activity",
) {
  try {
    let imageUrl = null;
    if (type === "hotel") {
      const h = await prisma.hotel.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      imageUrl = h?.imageUrl;
      await prisma.hotel.delete({ where: { id } });
    }
    if (type === "vehicle") {
      const v = await prisma.vehicle.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      imageUrl = v?.imageUrl;
      await prisma.vehicle.delete({ where: { id } });
    }
    if (type === "activity") {
      const a = await prisma.activity.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      imageUrl = a?.imageUrl;
      await prisma.activity.delete({ where: { id } });
    }

    await deleteLocalImage(imageUrl || null);

    revalidatePath("/dashboard/resources");
    return { success: true, message: "Deleted successfully" };
  } catch (e) {
    return { error: "Cannot delete. Resource might be used in a tour." };
  }
}
