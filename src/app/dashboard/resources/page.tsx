import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { ResourceManager } from "@/components/resources/ResourceManager";

export default async function ResourcesPage() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
  ) {
    redirect("/dashboard");
  }

  // Fetch ALL Data
  const [
    rawHotels,
    rawVehicles,
    rawActivities,
    locations,
    countries,
    staff,
    restaurants,
  ] = await Promise.all([
    // 1. HOTELS
    prisma.hotel.findMany({
      orderBy: { name: "asc" },
      include: { rates: true, location: true, images: true },
    }),

    // 2. VEHICLES
    prisma.vehicle.findMany({
      orderBy: { name: "asc" },
      include: { images: true },
    }),

    // 3. ACTIVITIES
    prisma.activity.findMany({
      orderBy: { name: "asc" },
      include: { location: true, images: true },
    }),

    // 4. LOCATIONS
    prisma.location.findMany({
      orderBy: { name: "asc" },
      include: { country: true, images: true },
    }),

    // 5. COUNTRIES
    prisma.country.findMany({
      orderBy: { name: "asc" },
      include: { images: true },
    }),

    // 6. STAFF
    prisma.staff.findMany({
      orderBy: { name: "asc" },
      include: { images: true },
    }),

    // 7. RESTAURANTS
    prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      include: { location: true, images: true },
    }),
  ]);

  // --- DATA SERIALIZATION (Decimal -> Number) ---

  const hotels = rawHotels.map((h) => ({
    ...h,
    rates: h.rates.map((r) => ({
      ...r,
      costPrice: Number(r.costPrice),
      salesPrice: Number(r.salesPrice), // 👈 Updated
    })),
  }));

  const vehicles = rawVehicles.map((v) => ({
    ...v,
    // 👈 UPDATED: New Profit Margin Fields
    costPerDay: Number(v.costPerDay),
    salesPerDay: Number(v.salesPerDay),
    costPerKm: Number(v.costPerKm),
    salesPerKm: Number(v.salesPerKm),
    driverAllowance: Number(v.driverAllowance),
  }));

  const activities = rawActivities.map((a) => ({
    ...a,
    // 👈 UPDATED: New Profit Margin Fields
    costPrice: Number(a.costPrice),
    salesPrice: Number(a.salesPrice),
  }));

  const safeLocations = locations.map((l) => ({
    ...l,
    altitude: l.altitude ? Number(l.altitude) : null,
  }));

  const safeStaff = staff.map((s) => ({
    ...s,
    dailySalary: Number(s.dailySalary),
  }));

  const safeRestaurants = restaurants.map((r) => ({
    ...r,
    // 👈 UPDATED: New Profit Margin Fields
    costPrice: Number(r.costPrice),
    salesPrice: Number(r.salesPrice),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Resource Management
        </h1>
        <p className="text-base-content/60">
          Manage your travel inventory: locations, hotels, vehicles, activities,
          staff, and dining.
        </p>
      </div>

      <ResourceManager
        hotels={hotels}
        vehicles={vehicles}
        activities={activities}
        locations={safeLocations}
        countries={countries}
        staff={safeStaff}
        restaurants={safeRestaurants}
      />
    </div>
  );
}
