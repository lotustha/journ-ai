import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { RoutePlanner } from "@/components/tours/wizard/RoutePlanner";

export default async function RoutePlannerPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { tourId } = await params;

  // 1. Fetch Tour Constraints
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true, name: true, duration: true, startDate: true },
  });

  if (!tour) notFound();

  // 2. Fetch Countries WITH their Destinations
  const countries = await prisma.country.findMany({
    where: {
      locations: {
        some: { type: "DESTINATION" }, // Only fetch countries that have destinations
      },
    },
    include: {
      locations: {
        where: { type: "DESTINATION" },
        select: { id: true, name: true, imageUrl: true, altitude: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-base-100 flex justify-center py-12 px-4">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight">{tour.name}</h1>
          <p className="text-base-content/60">
            Step 2: Build the Route (Target:{" "}
            <span className="font-bold text-primary">{tour.duration} Days</span>
            )
          </p>
        </div>

        {/* Pass Countries Data instead of flat locations */}
        <RoutePlanner
          tourId={tour.id}
          totalDuration={tour.duration}
          countries={countries}
        />
      </div>
    </div>
  );
}
