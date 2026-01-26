import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { ResourceManager } from "@/components/resources/ResourceManager";

export default async function ResourcesPage() {
  const session = await auth();

  // Protect Route
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
  ) {
    redirect("/dashboard");
  }

  // 1. Fetch ALL data (Including Locations)
  const [rawHotels, rawVehicles, rawActivities, locations] = await Promise.all([
    prisma.hotel.findMany({
      orderBy: { name: "asc" },
      include: { rates: true, location: true },
    }),
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
    prisma.activity.findMany({
      orderBy: { name: "asc" },
      include: { location: true },
    }),
    prisma.location.findMany({ orderBy: { name: "asc" } }), // 👈 Fetching Locations
  ]);

  // 2. Serialize Data (Convert Decimals to Numbers for Client)
  const hotels = rawHotels.map((h) => ({
    ...h,
    rates: h.rates.map((r) => ({ ...r, costPrice: r.costPrice.toNumber() })),
  }));

  const vehicles = rawVehicles.map((v) => ({
    ...v,
    ratePerDay: v.ratePerDay.toNumber(),
    ratePerKm: v.ratePerKm.toNumber(),
    driverAllowance: v.driverAllowance.toNumber(),
  }));

  const activities = rawActivities.map((a) => ({
    ...a,
    costPerHead: a.costPerHead.toNumber(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Resource Management
        </h1>
        <p className="text-base-content/60">
          Manage your locations, hotels, vehicles, and activities.
        </p>
      </div>

      <ResourceManager
        hotels={hotels}
        vehicles={vehicles}
        activities={activities}
        locations={locations} // 👈 Passing Locations to Client
      />
    </div>
  );
}
