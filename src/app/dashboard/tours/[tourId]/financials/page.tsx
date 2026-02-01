import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { FinancialsManager } from "@/components/tours/financials/FinancialsManager";

// Helper to clean Decimals
const serialize = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => serialize(item));
  if (typeof obj === "object") {
    if (typeof obj.toNumber === "function") return obj.toNumber();
    if (obj instanceof Date) return obj.toISOString();
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

export default async function FinancialsPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { tourId } = await params;

  // 1. Fetch Tour with deeply nested Itinerary Items to calculate costs
  const tourRaw = await prisma.tour.findUnique({
    where: { id: tourId },
    include: {
      itinerary: {
        include: {
          items: true, // Need costPrice and salesPrice from items
        },
      },
      participantSummary: true,
      financials: true, // Fetch existing saved financials
    },
  });

  if (!tourRaw) notFound();

  const tour = serialize(tourRaw);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{tour.name}</h1>
        <p className="text-base-content/60">
          Financial Planning & Profit Analysis
        </p>
      </div>

      <FinancialsManager tour={tour} financials={tour.financials || {}} />
    </div>
  );
}
