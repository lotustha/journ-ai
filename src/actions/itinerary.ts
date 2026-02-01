"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { ItemType } from "../../generated/prisma/client";
import { redirect } from "next/navigation";

export async function addItemToDay(formData: FormData) {
  try {
    const dayId = formData.get("dayId") as string;
    const tourId = formData.get("tourId") as string;
    const type = formData.get("type") as ItemType;
    const resourceId = formData.get("resourceId") as string;
    const rateId = formData.get("rateId") as string;

    let costPrice = 0;
    let salesPrice = 0;
    let title = "";
    let description = "";

    // 1. HOTEL LOGIC (With Package Selection)
    if (type === "ACCOMMODATION") {
      const hotel = await prisma.hotel.findUnique({
        where: { id: resourceId },
        include: { rates: true },
      });

      if (hotel) {
        title = hotel.name;
        // Find specific rate/package if selected, else default to first
        const selectedRate =
          hotel.rates.find((r) => r.id === rateId) || hotel.rates[0];

        if (selectedRate) {
          costPrice = Number(selectedRate.costPrice);
          salesPrice = Number(selectedRate.salesPrice);
          description = `${selectedRate.roomType} (${selectedRate.mealPlan})`;
          if (selectedRate.inclusions)
            description += ` - ${selectedRate.inclusions}`;
        } else {
          description = "Standard Room";
        }
      }
    }
    // 2. ACTIVITY LOGIC
    else if (type === "ACTIVITY") {
      const activity = await prisma.activity.findUnique({
        where: { id: resourceId },
      });
      if (activity) {
        costPrice = Number(activity.costPrice);
        salesPrice = Number(activity.salesPrice);
        title = activity.name;
        description = activity.details || "";
      }
    }
    // 3. VEHICLE LOGIC
    else if (type === "TRANSFER") {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: resourceId },
      });
      if (vehicle) {
        costPrice = Number(vehicle.costPerDay);
        salesPrice = Number(vehicle.salesPerDay);
        title = vehicle.name;
        description = `${vehicle.type} - Full Day Disposal`;
      }
    }
    // 4. RESTAURANT LOGIC
    else if (type === "MEAL") {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: resourceId },
      });
      if (restaurant) {
        costPrice = Number(restaurant.costPrice);
        salesPrice = Number(restaurant.salesPrice);
        title = restaurant.name;
        description = restaurant.cuisine
          ? `${restaurant.cuisine} Cuisine`
          : "Meal Stop";
      }
    }

    // Create the Item
    await prisma.itineraryItem.create({
      data: {
        itineraryDayId: dayId,
        type,
        hotelId: type === "ACCOMMODATION" ? resourceId : null,
        activityId: type === "ACTIVITY" ? resourceId : null,
        vehicleId: type === "TRANSFER" ? resourceId : null,
        restaurantId: type === "MEAL" ? resourceId : null,
        title,
        description,
        costPrice,
        salesPrice,
        order: 99, // Put at the end of the day's list
      },
    });

    revalidatePath(`/dashboard/tours/${tourId}/itinerary`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to add item" };
  }
}

export async function deleteItem(itemId: string, tourId: string) {
  try {
    await prisma.itineraryItem.delete({ where: { id: itemId } });
    revalidatePath(`/dashboard/tours/${tourId}/itinerary`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete item" };
  }
}

export async function completePlanning(tourId: string) {
  try {
    await prisma.tour.update({
      where: { id: tourId },
      data: { status: "DESIGNED" },
    });
  } catch (e) {
    console.error(e);
    return { error: "Failed to update status" };
  }
  redirect(`/dashboard/tours/${tourId}`);
}
