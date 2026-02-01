"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateFinancials(formData: FormData) {
  try {
    const tourId = formData.get("tourId") as string;

    // Safely convert to number, defaulting to 0 if empty/invalid
    const budget = Number(formData.get("budget")) || 0;
    const profitMargin = Number(formData.get("profitMargin")) || 0;
    const sellingPrice = Number(formData.get("sellingPrice")) || 0;

    console.log("Saving Financials:", {
      tourId,
      budget,
      profitMargin,
      sellingPrice,
    });

    if (!tourId) return { error: "Missing Tour ID" };

    // Use UPSERT: It creates if missing, updates if exists. Atomic and safer.
    await prisma.tourFinancials.upsert({
      where: { tourId },
      update: {
        budget,
        profitMargin,
        sellingPrice,
      },
      create: {
        tourId,
        budget,
        profitMargin,
        sellingPrice,
      },
    });

    revalidatePath(`/dashboard/tours/${tourId}/financials`);
    return { success: true };
  } catch (e) {
    console.error("Financial Save Error:", e);
    return { error: "Database error. Check server console." };
  }
}
