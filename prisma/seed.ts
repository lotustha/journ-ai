import {
  PrismaClient,
  Role,
  TourStatus,
  PaymentType,
  PaymentStatus,
} from "../generated/prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log("🌱 Starting seed...");

  // 2. CREATE ADMIN USER
  const passwordHash = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@journai.com" },
    update: {},
    create: {
      email: "admin@journai.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`👤 Created Admin: ${admin.email}`);

  // 3. CREATE LOCATIONS
  const kathmandu = await prisma.location.upsert({
    where: { name: "Kathmandu" },
    update: {},
    create: {
      name: "Kathmandu",
      altitude: 1400,
      description:
        "Capital city known for its historic temples and vibrant culture.",
      imageUrl:
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800",
    },
  });

  const pokhara = await prisma.location.upsert({
    where: { name: "Pokhara" },
    update: {},
    create: {
      name: "Pokhara",
      altitude: 822,
      description: "City of Lakes, gateway to the Annapurna Circuit.",
      imageUrl:
        "https://images.unsplash.com/photo-1625902347250-77a834164b38?q=80&w=800",
    },
  });

  const chitwan = await prisma.location.upsert({
    where: { name: "Chitwan" },
    update: {},
    create: {
      name: "Chitwan",
      altitude: 415,
      description: "Famous for Chitwan National Park and wildlife safaris.",
      imageUrl:
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=800",
    },
  });
  console.log("📍 Created Locations: Kathmandu, Pokhara, Chitwan");

  // 4. CREATE HOTELS
  await prisma.hotel.create({
    data: {
      name: "Hotel Shanker",
      locationId: kathmandu.id,
      contactInfo: "01-4410151",
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800",
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "BB",
            inclusions: "Buffet Breakfast",
            costPrice: 4500,
          },
          {
            roomType: "Deluxe",
            mealPlan: "BB",
            inclusions: "Breakfast + Welcome Drink",
            costPrice: 6500,
          },
          {
            roomType: "Standard",
            mealPlan: "MAP",
            inclusions: "Breakfast + Dinner",
            costPrice: 6000,
          },
        ],
      },
    },
  });

  await prisma.hotel.create({
    data: {
      name: "Temple Tree Resort",
      locationId: pokhara.id,
      contactInfo: "061-460021",
      imageUrl:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800",
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "BB",
            inclusions: "Breakfast",
            costPrice: 8000,
          },
          {
            roomType: "Deluxe",
            mealPlan: "BB",
            inclusions: "Breakfast, Lake View",
            costPrice: 10000,
          },
        ],
      },
    },
  });

  await prisma.hotel.create({
    data: {
      name: "Green Park Chitwan",
      locationId: chitwan.id,
      contactInfo: "056-580123",
      imageUrl:
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800",
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "AP",
            inclusions: "Breakfast, Lunch, Dinner",
            costPrice: 5000,
          },
        ],
      },
    },
  });
  console.log("🏨 Created Hotels with Rates");

  // 5. CREATE VEHICLES
  await prisma.vehicle.createMany({
    data: [
      {
        name: "Mahindra Scorpio",
        type: "SUV",
        plateNumber: "Ba 12 Cha 1234",
        driverName: "Ram Bahadur",
        ratePerDay: 4500,
        ratePerKm: 25,
        driverAllowance: 1000,
        imageUrl:
          "https://images.unsplash.com/photo-1605218427306-635ba2439af2?q=80&w=800",
      },
      {
        name: "Toyota Hiace",
        type: "Van",
        plateNumber: "Ba 3 Kha 9876",
        driverName: "Shyam Krishna",
        ratePerDay: 6500,
        ratePerKm: 35,
        driverAllowance: 1200,
        imageUrl:
          "https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=800",
      },
      {
        name: "Sutlej Bus (AC)",
        type: "Bus",
        plateNumber: "Na 4 Kha 5555",
        driverName: "Hari Prasad",
        ratePerDay: 12000,
        ratePerKm: 50,
        driverAllowance: 1500,
        imageUrl:
          "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800",
      },
    ],
  });
  console.log("🚙 Created Vehicles");

  // 6. CREATE ACTIVITIES
  await prisma.activity.create({
    data: {
      name: "Paragliding",
      locationId: pokhara.id,
      costPerHead: 8000,
      imageUrl:
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800",
    },
  });

  await prisma.activity.create({
    data: {
      name: "Boating on Phewa Lake",
      locationId: pokhara.id,
      costPerHead: 500,
      imageUrl:
        "https://images.unsplash.com/photo-1542662565-7e4b66bae529?q=80&w=800",
    },
  });

  await prisma.activity.create({
    data: {
      name: "Jungle Safari (Jeep)",
      locationId: chitwan.id,
      costPerHead: 2500,
      imageUrl:
        "https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=800",
    },
  });
  console.log("🏄 Created Activities");

  console.log("✅ Seed completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
