"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { saveImageLocally, handleGalleryUpload } from "./additional-resources";

export async function createStaff(prevState: any, formData: FormData) {
  const imageUrl = await saveImageLocally(formData.get("image") as File);
  const galleryUrls = await handleGalleryUpload(formData);

  try {
    await prisma.staff.create({
      data: {
        name: formData.get("name") as string,
        role: formData.get("role") as string,
        languages: formData.get("languages") as string,
        contactInfo: formData.get("contactInfo") as string,
        dailySalary: Number(formData.get("dailySalary")),
        details: formData.get("details") as string,
        imageUrl: imageUrl,
        images: { create: galleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Staff member added" };
  } catch (e) {
    return { error: "Failed to create staff" };
  }
}

export async function updateStaff(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const newImageUrl = await saveImageLocally(formData.get("image") as File);
  const newGalleryUrls = await handleGalleryUpload(formData);

  try {
    const updateData: any = {
      name: formData.get("name"),
      role: formData.get("role"),
      languages: formData.get("languages"),
      contactInfo: formData.get("contactInfo"),
      dailySalary: Number(formData.get("dailySalary")),
      details: formData.get("details"),
    };
    if (newImageUrl) updateData.imageUrl = newImageUrl;

    await prisma.staff.update({
      where: { id },
      data: {
        ...updateData,
        images: { create: newGalleryUrls.map((url) => ({ url })) },
      },
    });
    revalidatePath("/dashboard/resources");
    return { success: true, message: "Staff updated" };
  } catch (e) {
    return { error: "Failed to update" };
  }
}

export async function deleteStaffImage(id: string) {
  try {
    await prisma.staffImage.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete image" };
  }
}

export async function deleteStaff(id: string) {
  try {
    await prisma.staff.delete({ where: { id } });
    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete" };
  }
}
