import {
  PrismaClient,
  Role,
  TourStatus,
  PaymentType,
  PaymentStatus,
  ItemType, // 👈 Import new Enum
} from "../generated/prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log("🌱 Starting seed with Smart Routes & Flexible Itinerary...");

  // =========================================
  // 0. CLEANUP (Uncomment to reset DB in Dev)
  // =========================================
  // console.log('🧹 Cleaning up database...')
  // await prisma.routeStopover.deleteMany()
  // await prisma.route.deleteMany()
  // await prisma.itineraryItem.deleteMany()
  // await prisma.itineraryDay.deleteMany()
  // await prisma.tour.deleteMany()
  // ... (keep other cleanups if needed)

  // =========================================
  // 1. ADMIN USER
  // =========================================
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
  console.log("👤 Admin Created");

  // =========================================
  // 2. CLIENT USER (For Demo Tour)
  // =========================================
  const demoClient = await prisma.user.upsert({
    where: { email: "client@demo.com" },
    update: {},
    create: {
      email: "client@demo.com",
      name: "John Doe",
      passwordHash,
      role: "CLIENT",
      clientProfile: {
        create: {
          nationality: "USA",
          phone: "+1 555 0199",
        },
      },
    },
  });

  // =========================================
  // 3. COUNTRIES
  // =========================================
  const nepal = await prisma.country.upsert({
    where: { name: "Nepal" },
    update: {},
    create: {
      name: "Nepal",
      description: "The land of Himalayas and Buddha.",
      imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa" },
        ],
      },
    },
  });

  console.log("🌏 Countries Created");

  // =========================================
  // 4. LOCATIONS (Destinations & Stopovers)
  // =========================================

  // Destination: Kathmandu
  const kathmandu = await prisma.location.upsert({
    where: { name: "Kathmandu" },
    update: { type: "DESTINATION" },
    create: {
      name: "Kathmandu",
      countryId: nepal.id,
      type: "DESTINATION",
      altitude: 1400,
      description: "Capital city rich in history and temples.",
      imageUrl: "https://images.unsplash.com/photo-1558693175-97a6e138a446",
    },
  });

  // Destination: Pokhara
  const pokhara = await prisma.location.upsert({
    where: { name: "Pokhara" },
    update: { type: "DESTINATION" },
    create: {
      name: "Pokhara",
      countryId: nepal.id,
      type: "DESTINATION",
      altitude: 822,
      description: "City of lakes and gateway to Annapurna.",
      imageUrl: "https://images.unsplash.com/photo-1540397106260-e24a59faf08f",
    },
  });

  // Destination: Chitwan
  const chitwan = await prisma.location.upsert({
    where: { name: "Chitwan" },
    update: { type: "DESTINATION" },
    create: {
      name: "Chitwan",
      countryId: nepal.id,
      type: "DESTINATION",
      altitude: 415,
      description: "Famous for wildlife safaris and Tharu culture.",
      imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b",
    },
  });

  // Highway Stop: Malekhu
  const malekhu = await prisma.location.upsert({
    where: { name: "Malekhu" },
    update: { type: "STOPOVER" },
    create: {
      name: "Malekhu",
      countryId: nepal.id,
      type: "STOPOVER",
      altitude: 400,
      description: "Popular highway stop famous for local fish.",
      imageUrl: "https://images.unsplash.com/photo-1605640840605-14ac1855827b",
    },
  });

  // Highway Stop: Mugling
  const mugling = await prisma.location.upsert({
    where: { name: "Mugling" },
    update: { type: "STOPOVER" },
    create: {
      name: "Mugling",
      countryId: nepal.id,
      type: "STOPOVER",
      altitude: 300,
      description:
        "Major transit junction connecting Kathmandu, Pokhara, and Chitwan.",
      imageUrl: "https://images.unsplash.com/photo-1595259715208-143763266581",
    },
  });
  console.log("📍 Locations Created");

  // =========================================
  // 5. RESOURCES (Hotels, Vehicles, etc.)
  // =========================================

  // Hotel in KTM
  const hotelShanker = await prisma.hotel.create({
    data: {
      name: "Hotel Shanker",
      locationId: kathmandu.id,
      contactInfo: "01-4410151",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "BB",
            costPrice: 8000,
            salesPrice: 10000,
            inclusions: "Buffet Breakfast",
          },
        ],
      },
    },
  });

  // Hotel in PKR
  const hotelTempleTree = await prisma.hotel.create({
    data: {
      name: "Temple Tree Resort",
      locationId: pokhara.id,
      contactInfo: "061-460021",
      imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "BB",
            costPrice: 9000,
            salesPrice: 11500,
            inclusions: "Welcome Drink, Breakfast",
          },
        ],
      },
    },
  });

  // Vehicle
  const vehicleScorpio = await prisma.vehicle.create({
    data: {
      name: "Mahindra Scorpio",
      type: "SUV",
      plateNumber: "Ba 12 Cha 3456",
      costPerDay: 5000,
      salesPerDay: 6500,
      details: "4WD SUV with AC.",
      imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
    },
  });

  // Activity
  const activityParagliding = await prisma.activity.create({
    data: {
      name: "Paragliding",
      locationId: pokhara.id,
      costPrice: 6000,
      salesPrice: 8500,
      details: "30 min tandem flight.",
      imageUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae",
    },
  });

  // Restaurant
  const restaurantBlueHeaven = await prisma.restaurant.create({
    data: {
      name: "Blue Heaven Restaurant",
      locationId: malekhu.id,
      cuisine: "Nepali, Fish",
      costPrice: 500,
      salesPrice: 700,
      details: "Famous for local river fish curry.",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    },
  });

  console.log("🏨 Resources Created");

  // =========================================
  // 6. SMART ROUTES (The AI Brain Data) 🧠
  // =========================================

  // Route 1: Kathmandu -> Pokhara (The most common tourist route)
  await prisma.route.create({
    data: {
      originId: kathmandu.id,
      destinationId: pokhara.id,
      distanceKm: 200,
      durationMins: 420, // 7 Hours
      description:
        "Prithvi Highway route offering scenic views of Trishuli river.",
      stopovers: {
        create: [
          { locationId: malekhu.id, order: 1, isLunchStop: true }, // Lunch at Malekhu
          { locationId: mugling.id, order: 2, isLunchStop: false }, // Transit at Mugling
        ],
      },
    },
  });

  // Route 2: Pokhara -> Chitwan
  await prisma.route.create({
    data: {
      originId: pokhara.id,
      destinationId: chitwan.id,
      distanceKm: 150,
      durationMins: 300, // 5 Hours
      description: "Route via Mugling and Narayanghat.",
      stopovers: {
        create: [
          { locationId: mugling.id, order: 1, isLunchStop: true }, // Lunch at Mugling
        ],
      },
    },
  });

  console.log("🛣️ Smart Routes Created");

  // =========================================
  // 7. SAMPLE TOUR (With Flexible Itinerary)
  // =========================================

  const tour = await prisma.tour.create({
    data: {
      name: "Nepal Golden Triangle - Demo",
      status: "DRAFT",
      creatorId: admin.id,
      clientId: demoClient.id,
      startLocation: "Kathmandu",
      destination: "Pokhara",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      duration: 5,
      financials: {
        create: {
          budget: 50000,
          sellingPrice: 65000,
          profitMargin: 30,
        },
      },
      participantSummary: {
        create: { totalPax: 2, boys: 2 },
      },

      // THE NEW ITINERARY STRUCTURE
      itinerary: {
        create: [
          // DAY 1: Arrival in Kathmandu
          {
            dayNumber: 1,
            title: "Arrival in Kathmandu",
            items: {
              create: [
                {
                  type: "TRANSFER",
                  order: 0,
                  title: "Airport Pickup",
                  description: "Transfer to Hotel via Private Car",
                  vehicleId: vehicleScorpio.id,
                  costPrice: 1500,
                  salesPrice: 2000,
                },
                {
                  type: "ACCOMMODATION",
                  order: 1,
                  title: "Overnight Stay",
                  hotelId: hotelShanker.id,
                  costPrice: 8000,
                  salesPrice: 10000,
                },
              ],
            },
          },

          // DAY 2: Drive to Pokhara (Using the Route logic)
          {
            dayNumber: 2,
            title: "Scenic Drive to Pokhara",
            items: {
              create: [
                {
                  type: "TRANSFER",
                  order: 0,
                  title: "Kathmandu to Pokhara",
                  description: "7-hour scenic drive along Prithvi Highway",
                  vehicleId: vehicleScorpio.id,
                  costPrice: 5000,
                  salesPrice: 6500,
                },
                {
                  type: "MEAL",
                  order: 1,
                  title: "Lunch Stop at Malekhu",
                  description: "Traditional Nepali Thali with Fish",
                  restaurantId: restaurantBlueHeaven.id, // Linked to the stopover!
                  costPrice: 1000,
                  salesPrice: 1400,
                },
                {
                  type: "ACCOMMODATION",
                  order: 2,
                  title: "Check-in at Resort",
                  hotelId: hotelTempleTree.id,
                  costPrice: 9000,
                  salesPrice: 11500,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("📦 Sample Tour Created with Itinerary");
  console.log("✅ Seed completed successfully!");
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
