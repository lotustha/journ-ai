"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { TourStatus } from "../../generated/prisma/client";

export async function updateTourStatus(tourId: string, newStatus: TourStatus) {
  try {
    await prisma.tour.update({
      where: { id: tourId },
      data: { status: newStatus },
    });

    // Refresh the dashboard and the specific tour page
    revalidatePath("/dashboard/tours");
    revalidatePath(`/dashboard/tours/${tourId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update tour status:", error);
    return { error: "Failed to update status" };
  }
}
