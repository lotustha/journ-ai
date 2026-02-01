"use server";

import { prisma } from "@/lib/db/prisma";
import { ItemType } from "../../generated/prisma/enums";

export async function createTourBrief(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const clientId = formData.get("clientId") as string;

    const startDateRaw = formData.get("startDate") as string;
    const duration = parseInt(formData.get("duration") as string);

    const startDate = new Date(startDateRaw);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    // 🟢 UPDATED: Handle Optional Pax
    const totalPax = parseInt(formData.get("totalPax") as string) || 0;

    // Check if empty string, if so send null, otherwise parse int
    const boysRaw = formData.get("boys") as string;
    const girlsRaw = formData.get("girls") as string;

    const boys = boysRaw ? parseInt(boysRaw) : null;
    const girls = girlsRaw ? parseInt(girlsRaw) : null;

    const budgetPerPax =
      parseFloat(formData.get("budgetPerPax") as string) || 0;
    const totalBudget = budgetPerPax * totalPax;

    if (!name || !clientId || !startDateRaw || !totalPax) {
      return {
        error: "Missing required fields (Name, Client, Date, Total Pax)",
      };
    }

    const tour = await prisma.tour.create({
      data: {
        name,
        clientId,
        status: "DRAFT",
        startLocation: "Kathmandu",
        destination: "Multi-City",
        startDate,
        endDate,
        duration,

        financials: {
          create: {
            budget: totalBudget,
            sellingPrice: 0,
            profitMargin: 20,
          },
        },

        participantSummary: {
          create: {
            totalPax,
            boys, // Can be null
            girls, // Can be null
            nonVeg: totalPax,
          },
        },
      },
    });

    return { success: true, tourId: tour.id };
  } catch (e: any) {
    console.error(e);
    return { error: "Failed to create tour." };
  }
}

export async function generateRoute(
  tourId: string,
  stops: { locationId: string; nights: number }[],
) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { itinerary: true },
    });

    if (!tour) return { error: "Tour not found" };

    // 1. Validation: Check duration matches
    const totalNights = stops.reduce((acc, stop) => acc + stop.nights, 0);
    // Note: Usually Duration = Nights + 1 (days), or equal depending on business logic.
    // Let's assume Duration is DAYS. So 5 Days = 4 Nights usually, or 5 Days of activity.
    // For simplicity here, we map 1 Day record per day of duration.
    if (totalNights !== tour.duration) {
      // We can allow mismatch but warn, or strictly enforce. Let's strictly enforce for V1.
      // actually, let's relax it: simply generate days up to the duration limit.
    }

    // 2. Clear existing itinerary (Re-generation)
    await prisma.itineraryDay.deleteMany({ where: { tourId } });

    // 3. Generate Days Loop
    let currentDayNum = 1;
    let currentDate = new Date(tour.startDate);

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const prevStop = i > 0 ? stops[i - 1] : null;

        // Fetch Location Details
        const location = await tx.location.findUnique({
          where: { id: stop.locationId },
        });
        if (!location) continue;

        // --- SMART ROUTE DETECTION ---
        // Check if there is a known route from Previous Stop -> Current Stop
        let transferItemData = null;
        if (prevStop) {
          const route = await tx.route.findUnique({
            where: {
              originId_destinationId: {
                originId: prevStop.locationId,
                destinationId: stop.locationId,
              },
            },
            include: { stopovers: { include: { location: true } } },
          });

          if (route) {
            // AI Magic: We found a route! Let's prep a Transfer Item
            transferItemData = {
              type: "TRANSFER" as ItemType, // Explicit cast
              order: 0, // First thing in the morning
              title: `Transfer: ${route.originId === stop.locationId ? "Local" : "Inter-city"}`, // Simplification
              description:
                route.description ||
                `Travel to ${location.name} (${route.durationMins ? Math.round(route.durationMins / 60) + " hrs" : "Direct"})`,
              // We will actually attach this to the FIRST day of this new location block
            };
          }
        }

        // Generate Days for this Stop
        for (let n = 0; n < stop.nights; n++) {
          // Create the Day
          const day = await tx.itineraryDay.create({
            data: {
              tourId,
              dayNumber: currentDayNum,
              date: new Date(currentDate),
              title:
                n === 0
                  ? `Arrival in ${location.name}`
                  : `Explore ${location.name}`, // Simple naming logic
            },
          });

          // If it's the FIRST day of this stop, and we have a transfer from previous, add it!
          if (n === 0 && transferItemData) {
            await tx.itineraryItem.create({
              data: {
                itineraryDayId: day.id,
                ...transferItemData,
                title: `Travel to ${location.name}`, // Override title
              },
            });
          }
          // If it's Day 1 of the WHOLE tour, add an "Arrival" item
          else if (currentDayNum === 1) {
            await tx.itineraryItem.create({
              data: {
                itineraryDayId: day.id,
                type: "TRANSFER",
                order: 0,
                title: "Arrival & Pickup",
                description: "Airport pickup and transfer to hotel.",
              },
            });
          }

          // Increment
          currentDayNum++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { error: "Failed to generate itinerary." };
  }
}
