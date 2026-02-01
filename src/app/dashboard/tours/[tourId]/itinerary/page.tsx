import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { ItineraryEditor } from "@/components/tours/itinerary/ItineraryEditor";

/**
 * Helper to recursively convert Prisma Decimal objects to plain JavaScript numbers.
 */
const serialize = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) return obj.map((item) => serialize(item));

  if (typeof obj === "object") {
    // Check for Prisma Decimal
    if (typeof obj.toNumber === "function") return obj.toNumber();

    // Check for Date
    if (obj instanceof Date) return obj.toISOString();

    // Recursively serialize object keys
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = serialize(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { tourId } = await params;

  // 1. Fetch Tour Data with Deep Relations (to get images in timeline)
  const tourRaw = await prisma.tour.findUnique({
    where: { id: tourId },
    include: {
      itinerary: {
        orderBy: { dayNumber: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            // Include relations so we can show images in the timeline
            include: {
              hotel: true,
              activity: true,
              vehicle: true,
              restaurant: true,
            },
          },
        },
      },
      participantSummary: true,
      financials: true,
    },
  });

  if (!tourRaw) notFound();

  // 2. Fetch Resources
  const hotelsRaw = await prisma.hotel.findMany({
    include: { location: true, rates: true },
  });
  const activitiesRaw = await prisma.activity.findMany({
    include: { location: true },
  });
  const vehiclesRaw = await prisma.vehicle.findMany();
  const restaurantsRaw = await prisma.restaurant.findMany({
    include: { location: true },
  });

  // 3. Serialize Data (Decimal -> Number)
  const tour = serialize(tourRaw);
  const hotels = serialize(hotelsRaw);
  const activities = serialize(activitiesRaw);
  const vehicles = serialize(vehiclesRaw);
  const restaurants = serialize(restaurantsRaw);

  // 4. Render Editor
  return (
    <div className="min-h-screen bg-base-50">
      <ItineraryEditor
        tour={tour}
        hotels={hotels}
        activities={activities}
        vehicles={vehicles}
        restaurants={restaurants}
      />
    </div>
  );
}
