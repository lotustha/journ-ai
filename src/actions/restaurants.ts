"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
// Import helpers from your main resources file
import { saveImageLocally, handleGalleryUpload } from "./resources";

export async function createRestaurant(prevState: any, formData: FormData) {
  const imageUrl = await saveImageLocally(formData.get("image") as File);
  const galleryUrls = await handleGalleryUpload(formData);

  try {
    await prisma.restaurant.create({
      data: {
        name: formData.get("name") as string,
        locationId: (formData.get("locationId") as string) || null,
        cuisine: formData.get("cuisine") as string,
        contactInfo: formData.get("contactInfo") as string,

        // 👈 UPDATED: New Profit Margin Fields
        costPrice: Number(formData.get("costPrice")), // Net Cost
        salesPrice: Number(formData.get("salesPrice")), // Selling Price

        details: formData.get("details") as string,
        imageUrl: imageUrl,
        images: { create: galleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Restaurant added" };
  } catch (e) {
    return { error: "Failed to create restaurant" };
  }
}

export async function updateRestaurant(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const newImageUrl = await saveImageLocally(formData.get("image") as File);
  const newGalleryUrls = await handleGalleryUpload(formData);

  try {
    const updateData: any = {
      name: formData.get("name"),
      locationId: (formData.get("locationId") as string) || null,
      cuisine: formData.get("cuisine"),
      contactInfo: formData.get("contactInfo"),

      // 👈 UPDATED: New Profit Margin Fields
      costPrice: Number(formData.get("costPrice")),
      salesPrice: Number(formData.get("salesPrice")),

      details: formData.get("details"),
    };
    if (newImageUrl) updateData.imageUrl = newImageUrl;

    await prisma.restaurant.update({
      where: { id },
      data: {
        ...updateData,
        images: { create: newGalleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Restaurant updated" };
  } catch (e) {
    return { error: "Failed to update" };
  }
}

export async function deleteRestaurantImage(id: string) {
  try {
    await prisma.restaurantImage.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete image" };
  }
}

export async function deleteRestaurant(id: string) {
  try {
    await prisma.restaurant.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete" };
  }
}
