export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { TourManager } from "@/components/tours/TourManager";

export default async function ToursPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch ALL tours deeply so client-side filtering works perfectly
  const tours = await prisma.tour.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { name: true, image: true, email: true } },
      itinerary: {
        select: { id: true, items: { select: { id: true } } },
      },
      participantSummary: true,
    },
  });

  return <TourManager initialTours={tours} />;
}
