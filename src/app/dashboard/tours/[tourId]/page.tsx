import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Optimized Image
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Pencil,
  FileText,
  Wallet,
  AlertCircle,
  Clock,
  CheckCircle2,
  Hotel,
  Mountain,
  Car,
  Utensils,
  DollarSign,
} from "lucide-react";
import { TourStatusButton } from "@/components/tours/TourStatusButton";
import { ProposalButton } from "@/components/tours/proposal/ProposalButton";

// --- HELPER: Serialize Decimals & Dates ---
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

// --- HELPER: Get Image URL ---
const getItemImage = (item: any) => {
  return (
    item.hotel?.imageUrl ||
    item.activity?.imageUrl ||
    item.vehicle?.imageUrl ||
    item.restaurant?.imageUrl
  );
};

export default async function TourOverviewPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { tourId } = await params;

  // 1. FETCH DATA (Includes full Itinerary + Relations)
  const tourRaw = await prisma.tour.findUnique({
    where: { id: tourId },
    include: {
      client: {
        include: { clientProfile: true },
      },
      financials: true,
      participantSummary: true,
      itinerary: {
        orderBy: { dayNumber: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              hotel: true,
              activity: true,
              vehicle: true,
              restaurant: true,
            },
          },
        },
      },
      _count: {
        select: { itinerary: true },
      },
    },
  });

  if (!tourRaw) notFound();

  // 2. Serialize Data (Fixes Decimal/Date issues)
  const tour = serialize(tourRaw);

  // Status Badge Logic
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "badge-ghost";
      case "DESIGNED":
        return "badge-info";
      case "CONFIRMED":
        return "badge-success text-white";
      case "ACTIVE":
        return "badge-primary text-white";
      case "COMPLETED":
        return "badge-neutral text-white";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* TOP NAV */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard/tours"
          className="btn btn-ghost btn-sm gap-2 pl-0 hover:bg-transparent text-base-content/50 hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Tours
        </Link>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tight">{tour.name}</h1>
            <div
              className={`badge ${getStatusColor(tour.status)} font-bold p-3`}
            >
              {tour.status.replace("_", " ")}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} /> {tour.startLocation} → {tour.destination}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} /> {new Date(tour.startDate).toDateString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} /> {tour.duration} Days
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2">
          <ProposalButton tour={tour} />
          {tour.status === "DRAFT" && (
            <Link
              href={`/dashboard/tours/${tour.id}/itinerary`}
              className="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
            >
              <Pencil size={16} /> Resume Planning
            </Link>
          )}
          {tour.status !== "DRAFT" && (
            <Link
              href={`/dashboard/tours/${tour.id}/itinerary`}
              className="btn btn-outline rounded-xl"
            >
              Edit Itinerary
            </Link>
          )}
        </div>
      </div>

      {/* SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Details */}
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6">
          <h3 className="text-xs font-bold uppercase text-base-content/40 mb-4 flex items-center gap-2">
            <User size={14} /> Client Details
          </h3>
          {tour.client ? (
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className="w-12 h-12 rounded-full bg-base-200 text-xl font-bold text-base-content/50">
                  {tour.client.name?.charAt(0)}
                </div>
              </div>
              <div>
                <div className="font-bold">{tour.client.name}</div>
                <div className="text-xs opacity-60">{tour.client.email}</div>
                <div className="text-xs opacity-60">
                  {tour.client.clientProfile?.phone || "No phone"}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-50 italic">No client assigned</div>
          )}
        </div>

        {/* Stats */}
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6">
          <h3 className="text-xs font-bold uppercase text-base-content/40 mb-4 flex items-center gap-2">
            <FileText size={14} /> Trip Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-black">{tour._count.itinerary}</div>
              <div className="text-xs opacity-50">Days Planned</div>
            </div>
            <div>
              <div className="text-2xl font-black">
                {tour.participantSummary?.totalPax || 0}
              </div>
              <div className="text-xs opacity-50">Total Pax</div>
            </div>
          </div>
        </div>

        {/* Financials Summary */}
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6">
          <h3 className="text-xs font-bold uppercase text-base-content/40 mb-4 flex items-center gap-2">
            <Wallet size={14} /> Financials
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <span className="text-sm opacity-60">Estimated Cost</span>
              <span className="font-bold">
                NPR{" "}
                {Number(tour.financials?.sellingPrice || 0).toLocaleString()}
              </span>
            </div>
            <div className="divider my-2"></div>
            <Link
              href={`/dashboard/tours/${tour.id}/financials`}
              className="btn btn-xs btn-link p-0 text-primary no-underline"
            >
              View Full Analysis →
            </Link>
          </div>
        </div>
      </div>

      {/* STATUS ACTIONS (Draft/Designed) */}
      {tour.status === "DRAFT" && (
        <div className="alert bg-base-100 border-l-4 border-l-warning shadow-sm items-start">
          <AlertCircle className="text-warning mt-1" size={20} />
          <div>
            <h3 className="font-bold text-sm">Tour is in Draft Mode</h3>
            <div className="text-xs text-base-content/60 mt-1">
              You have planned {tour._count.itinerary} out of {tour.duration}{" "}
              days.
            </div>
          </div>
          <Link
            href={`/dashboard/tours/${tour.id}/itinerary`}
            className="btn btn-sm btn-warning"
          >
            Continue Planning
          </Link>
        </div>
      )}

      {tour.status === "DESIGNED" && (
        <div className="alert bg-base-100 border-l-4 border-l-info shadow-sm items-start">
          <CheckCircle2 className="text-info mt-1" size={20} />
          <div>
            <h3 className="font-bold text-sm">Design Phase Complete</h3>
            <div className="text-xs text-base-content/60 mt-1">
              Review the itinerary below. If everything looks good, confirm this
              tour.
            </div>
          </div>
          <TourStatusButton
            tourId={tour.id}
            targetStatus="CONFIRMED"
            label="Confirm Tour"
            className="btn btn-sm btn-info text-white gap-2"
          />
        </div>
      )}

      {/* --- DETAILED ITINERARY VIEW --- */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="text-primary" /> Itinerary & Costs
        </h2>

        <div className="space-y-0 relative">
          {/* Timeline Connector Line */}
          <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-base-300"></div>

          {tour.itinerary.length > 0 ? (
            tour.itinerary.map((day: any) => {
              // Calculate Daily Total
              const dailyTotal = day.items.reduce(
                (sum: number, item: any) => sum + Number(item.salesPrice || 0),
                0,
              );

              return (
                <div key={day.id} className="relative pl-12 pb-12 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-[11px] top-1 w-[18px] h-[18px] rounded-full bg-base-100 border-4 border-primary z-10"></div>

                  {/* DAY HEADER */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-base-200/50 p-4 rounded-xl border border-base-200">
                    <div>
                      <h3 className="font-black text-lg">
                        Day {day.dayNumber}: {day.title}
                      </h3>
                      <div className="text-xs text-base-content/60 font-medium">
                        {new Date(day.date).toDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase opacity-50">
                        Daily Total
                      </div>
                      <div className="font-mono font-bold text-lg text-primary">
                        NPR {dailyTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* ITEMS GRID */}
                  <div className="space-y-3">
                    {day.items.length === 0 ? (
                      <div className="text-sm italic opacity-50 pl-2">
                        No activities planned.
                      </div>
                    ) : (
                      day.items.map((item: any) => {
                        const imgUrl = getItemImage(item);
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row gap-4 p-3 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:border-primary/50 transition-all"
                          >
                            {/* THUMBNAIL */}
                            <div className="w-full sm:w-24 h-24 sm:h-20 shrink-0 relative bg-base-200 rounded-lg overflow-hidden">
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  sizes="96px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-30">
                                  {item.type === "ACCOMMODATION" && (
                                    <Hotel size={24} />
                                  )}
                                  {item.type === "ACTIVITY" && (
                                    <Mountain size={24} />
                                  )}
                                  {item.type === "TRANSFER" && (
                                    <Car size={24} />
                                  )}
                                  {item.type === "MEAL" && (
                                    <Utensils size={24} />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1 flex flex-col justify-center min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`badge badge-xs font-bold border-none text-white ${
                                    item.type === "ACCOMMODATION"
                                      ? "bg-indigo-500"
                                      : item.type === "ACTIVITY"
                                        ? "bg-emerald-500"
                                        : item.type === "TRANSFER"
                                          ? "bg-orange-500"
                                          : "bg-pink-500"
                                  }`}
                                >
                                  {item.type}
                                </span>
                                <h4 className="font-bold text-sm truncate">
                                  {item.title}
                                </h4>
                              </div>
                              <p className="text-xs text-base-content/70 line-clamp-2">
                                {item.description}
                              </p>
                            </div>

                            {/* PRICE */}
                            <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-end sm:text-right border-t sm:border-t-0 sm:border-l border-base-200 pt-2 sm:pt-0 sm:pl-4 min-w-[100px]">
                              <span className="text-[10px] font-bold uppercase opacity-40 sm:hidden">
                                Price
                              </span>
                              <div>
                                <div className="font-bold font-mono text-sm">
                                  NPR {Number(item.salesPrice).toLocaleString()}
                                </div>
                                <div className="text-[10px] opacity-40 hidden sm:block">
                                  Est. Value
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="pl-12 py-8 text-base-content/50 italic">
              No itinerary details available yet. Click "Resume Planning" to
              start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
