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
  console.log("🌱 Starting seed with Profit Margin & Location Type data...");

  // =========================================
  // 0. CLEANUP (Uncomment to reset DB in Dev)
  // =========================================
  // console.log('🧹 Cleaning up database...')
  // await prisma.itineraryDay.deleteMany()
  // await prisma.itinerary.deleteMany()
  // await prisma.incidentLog.deleteMany()
  // await prisma.paymentTransaction.deleteMany()
  // await prisma.tourFinancials.deleteMany()
  // await prisma.participantSummary.deleteMany()
  // await prisma.tour.deleteMany()

  // await prisma.hotelRoomRate.deleteMany()
  // await prisma.hotelImage.deleteMany()
  // await prisma.hotel.deleteMany()

  // await prisma.vehicleImage.deleteMany()
  // await prisma.vehicle.deleteMany()

  // await prisma.activityImage.deleteMany()
  // await prisma.activity.deleteMany()

  // await prisma.restaurantImage.deleteMany()
  // await prisma.restaurant.deleteMany()

  // await prisma.staffImage.deleteMany()
  // await prisma.staff.deleteMany()

  // await prisma.locationImage.deleteMany()
  // await prisma.location.deleteMany()

  // await prisma.countryImage.deleteMany()
  // await prisma.country.deleteMany()

  // await prisma.user.deleteMany()

  // =========================================
  // 1. ADMIN USER
  // =========================================
  const passwordHash = await hash("admin123", 12);
  await prisma.user.upsert({
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
  // 2. COUNTRIES
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

  const bhutan = await prisma.country.upsert({
    where: { name: "Bhutan" },
    update: {},
    create: {
      name: "Bhutan",
      description: "The last Shangri-La.",
      imageUrl: "https://images.unsplash.com/photo-1578509312291-d5907133dc0e",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1578509312291-d5907133dc0e",
          },
        ],
      },
    },
  });
  console.log("🌏 Countries Created");

  // =========================================
  // 3. LOCATIONS (Destinations & Stopovers)
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
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1518182170546-0766aa6f6914",
          },
        ],
      },
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
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1625902347250-77a834164b38",
          },
        ],
      },
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
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b" },
        ],
      },
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
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1605640840605-14ac1855827b",
          },
        ],
      },
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
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1595259715208-143763266581",
          },
        ],
      },
    },
  });
  console.log("📍 Locations Created");

  // =========================================
  // 4. HOTELS (With CP & SP)
  // =========================================
  await prisma.hotel.create({
    data: {
      name: "Hotel Shanker",
      locationId: kathmandu.id,
      contactInfo: "01-4410151",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          },
        ],
      },
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "BB",
            costPrice: 8000,
            salesPrice: 10000, // ~25% Markup
            inclusions: "Buffet Breakfast, Wifi",
          },
          {
            roomType: "Deluxe",
            mealPlan: "BB",
            costPrice: 12000,
            salesPrice: 15000,
            inclusions: "City View, Bathtub",
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
      imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
          },
        ],
      },
      rates: {
        create: [
          {
            roomType: "Standard",
            mealPlan: "BB",
            costPrice: 9000,
            salesPrice: 11500,
            inclusions: "Welcome Drink, Breakfast",
          },
          {
            roomType: "Suite",
            mealPlan: "MAP",
            costPrice: 16000,
            salesPrice: 20000,
            inclusions: "Breakfast + Dinner",
          },
        ],
      },
    },
  });
  console.log("🏨 Hotels Created");

  // =========================================
  // 5. VEHICLES (With CP & SP)
  // =========================================
  await prisma.vehicle.create({
    data: {
      name: "Mahindra Scorpio",
      type: "SUV",
      plateNumber: "Ba 12 Cha 3456",
      driverName: "Ram Bahadur",
      contactNumber: "9851011111",

      // Profit Margin Rates
      costPerDay: 5000,
      salesPerDay: 6500,

      costPerKm: 25,
      salesPerKm: 35,

      driverAllowance: 1500, // Usually flat cost

      details: "4WD SUV with AC. Good for rough terrain like Mustang.",
      imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1605218427306-635ba2439af2",
          },
        ],
      },
    },
  });

  await prisma.vehicle.create({
    data: {
      name: "Toyota Coaster",
      type: "Bus",
      plateNumber: "Ba 5 Kha 9988",
      driverName: "Shyam Kumar",
      contactNumber: "9841222222",

      costPerDay: 12000,
      salesPerDay: 15000,

      costPerKm: 45,
      salesPerKm: 60,

      driverAllowance: 2000,

      details: "22 Seater with AC. Spacious legroom for groups.",
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957" },
        ],
      },
    },
  });
  console.log("🚙 Vehicles Created");

  // =========================================
  // 6. ACTIVITIES (With CP & SP)
  // =========================================
  await prisma.activity.create({
    data: {
      name: "Paragliding",
      locationId: pokhara.id,

      costPrice: 6000, // Net Rate
      salesPrice: 8500, // Selling Rate

      details: "30 min tandem flight from Sarangkot. Includes photos/video.",
      imageUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1516938923055-66795f543168",
          },
        ],
      },
    },
  });

  await prisma.activity.create({
    data: {
      name: "Jungle Safari (Jeep)",
      locationId: chitwan.id,

      costPrice: 2000,
      salesPrice: 3000,

      details: "4-hour jeep drive inside Chitwan National Park to spot Rhinos.",
      imageUrl: "https://images.unsplash.com/photo-1535338454770-8be927b5a00b",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1579782260685-6d0e816c729e",
          },
        ],
      },
    },
  });
  console.log("🏄 Activities Created");

  // =========================================
  // 7. RESTAURANTS (With CP & SP)
  // =========================================
  await prisma.restaurant.create({
    data: {
      name: "Blue Heaven Restaurant",
      locationId: malekhu.id, // Linked to STOPOVER Location
      cuisine: "Nepali, Fish",
      contactInfo: "010-123456",

      costPrice: 500, // Net Cost per Thali
      salesPrice: 700, // Charged to Client

      details: "Famous for local river fish curry and rice.",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de" },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: "Roadhouse Cafe",
      locationId: kathmandu.id,
      cuisine: "Italian, Continental",
      contactInfo: "01-441000",

      costPrice: 1200,
      salesPrice: 1500,

      details: "Wood-fired pizza and coffee in a garden setting.",
      imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de" },
        ],
      },
    },
  });
  console.log("🍽️ Restaurants Created");

  // =========================================
  // 8. STAFF
  // =========================================
  await prisma.staff.create({
    data: {
      name: "Pasang Sherpa",
      role: "Senior Guide",
      languages: "English, French, Nepali",
      contactInfo: "9800000001",
      dailySalary: 3500, // Cost to company
      details: "Government license holder with 15 years experience.",
      imageUrl: "https://images.unsplash.com/photo-1627434579633-99b80b7c4133",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1551632811-561732d1e306" },
        ],
      },
    },
  });

  await prisma.staff.create({
    data: {
      name: "Hari Thapa",
      role: "Driver",
      languages: "Nepali, Hindi",
      contactInfo: "9800000002",
      dailySalary: 1500,
      details: "Expert off-road driver.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    },
  });
  console.log("🧑‍✈️ Staff Created");

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
