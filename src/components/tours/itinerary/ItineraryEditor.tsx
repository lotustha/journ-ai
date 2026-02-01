"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Hotel,
  Mountain,
  Car,
  DollarSign,
  X,
  Filter,
  Bed,
  Utensils,
  ArrowRight,
} from "lucide-react";
import {
  addItemToDay,
  deleteItem,
  completePlanning,
} from "@/actions/itinerary";
import { toast } from "sonner";

interface Props {
  tour: any;
  hotels: any[];
  activities: any[];
  vehicles: any[];
  restaurants: any[];
}

export function ItineraryEditor({
  tour,
  hotels,
  activities,
  vehicles,
  restaurants,
}: Props) {
  // --- STATE ---
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<
    "HOTEL" | "ACTIVITY" | "VEHICLE" | "MEAL"
  >("HOTEL");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // --- FINANCIALS ---
  const totalCost = tour.itinerary.reduce((acc: number, day: any) => {
    return (
      acc +
      day.items.reduce(
        (dAcc: number, item: any) => dAcc + Number(item.salesPrice),
        0,
      )
    );
  }, 0);
  const budget = Number(tour.financials?.budget) || 0;
  const budgetUsage = (totalCost / budget) * 100;

  // --- SMART FILTERING ---
  const activeDay = tour.itinerary.find((d: any) => d.id === activeDayId);

  // 1. Collect all known location names
  const allLocationNames = useMemo(() => {
    const names = new Set(
      [...hotels, ...activities, ...restaurants]
        .map((r) => r.location?.name)
        .filter(Boolean),
    );
    return Array.from(names);
  }, [hotels, activities, restaurants]);

  // 2. Detect location from the Day Title (e.g. "Explore Chitwan" -> "Chitwan")
  const detectedLocationName = useMemo(() => {
    if (!activeDay?.title) return null;
    return allLocationNames.find((name) => activeDay.title.includes(name));
  }, [activeDay, allLocationNames]);

  // 3. Resource Filters
  const filteredHotels = useMemo(() => {
    if (showAllLocations || !detectedLocationName) return hotels;
    return hotels.filter((h) => h.location?.name === detectedLocationName);
  }, [hotels, detectedLocationName, showAllLocations]);

  const filteredActivities = useMemo(() => {
    if (showAllLocations || !detectedLocationName) return activities;
    return activities.filter((a) => a.location?.name === detectedLocationName);
  }, [activities, detectedLocationName, showAllLocations]);

  // 4. Restaurant Grouping (Local vs Highway)
  const restaurantGroups = useMemo(() => {
    // If "Show All" is on, put everything in one big group
    if (showAllLocations)
      return { current: restaurants, transit: [], others: [] };
    if (!detectedLocationName)
      return { current: restaurants, transit: [], others: [] };

    const current: any[] = [];
    const transit: any[] = [];
    const others: any[] = [];

    restaurants.forEach((r) => {
      if (r.location?.name === detectedLocationName) {
        current.push(r); // Matches current city (e.g. Pokhara)
      } else if (r.location?.type === "STOPOVER") {
        transit.push(r); // Matches Highway Hubs (e.g. Mugling)
      } else {
        others.push(r);
      }
    });

    return { current, transit, others };
  }, [restaurants, detectedLocationName, showAllLocations]);

  // --- HANDLERS ---
  const handleAddItem = async (
    resourceId: string,
    type: "ACCOMMODATION" | "ACTIVITY" | "TRANSFER" | "MEAL",
    rateId?: string,
  ) => {
    if (!activeDayId) return;
    const formData = new FormData();
    formData.append("dayId", activeDayId);
    formData.append("tourId", tour.id);
    formData.append("type", type);
    formData.append("resourceId", resourceId);
    if (rateId) formData.append("rateId", rateId);

    const res = await addItemToDay(formData);
    if (res.success) {
      toast.success("Item added!");
      setActiveDayId(null);
      setShowAllLocations(false);
    } else {
      toast.error("Failed to add item");
    }
  };

  const handleDelete = async (itemId: string) => {
    const res = await deleteItem(itemId, tour.id);
    if (res.success) toast.success("Item removed");
    else toast.error("Failed to remove");
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    toast.info("Finalizing itinerary...");
    await completePlanning(tour.id);
  };

  const openModal = (dayId: string) => {
    setActiveDayId(dayId);
    setShowAllLocations(false);
  };

  const getItemImage = (item: any) => {
    return (
      item.hotel?.imageUrl ||
      item.activity?.imageUrl ||
      item.vehicle?.imageUrl ||
      item.restaurant?.imageUrl
    );
  };

  return (
    <div className="flex h-screen flex-col bg-base-200/50">
      {/* TOP BAR */}
      <div className="bg-base-100 border-b border-base-200 px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm h-16">
        <div>
          <h2 className="font-bold text-lg leading-tight text-base-content">
            {tour.name}
          </h2>
          <div className="flex gap-2 text-xs text-base-content/60">
            <span>{tour.duration} Days</span> •{" "}
            <span>{tour.participantSummary?.totalPax} Pax</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-48 hidden lg:block">
            <div className="flex justify-between text-xs font-bold mb-1 text-base-content/80">
              <span>Budget Used</span>
              <span
                className={budgetUsage > 100 ? "text-error" : "text-success"}
              >
                {budgetUsage.toFixed(0)}%
              </span>
            </div>
            <progress
              className={`progress w-full h-2 ${budgetUsage > 100 ? "progress-error" : "progress-success"}`}
              value={budgetUsage}
              max="100"
            ></progress>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs uppercase font-bold text-base-content/50">
              Total Estimate
            </div>
            <div className="text-xl font-black text-primary">
              NPR {totalCost.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-px bg-base-300 hidden sm:block"></div>
          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className="btn btn-primary shadow-lg shadow-primary/20 gap-2 rounded-xl"
          >
            {isFinishing ? (
              <>Saving...</>
            ) : (
              <>
                Finish Planning <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* TIMELINE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        {tour.itinerary.map((day: any) => (
          <div
            key={day.id}
            className="relative pl-8 border-l-2 border-base-300"
          >
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-base-300 border-2 border-base-100"></div>

            <div className="card bg-base-100 border border-base-200 shadow-sm mb-6 overflow-hidden group">
              <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-200/30">
                <div>
                  <h3 className="font-black text-lg flex items-center gap-2 text-base-content">
                    Day {day.dayNumber}{" "}
                    <span className="text-base-content/30 font-normal">|</span>{" "}
                    {day.title}
                  </h3>
                  <div className="text-xs text-base-content/50 flex gap-2 mt-1 font-medium">
                    <Calendar size={12} /> {new Date(day.date).toDateString()}
                  </div>
                </div>
                <button
                  onClick={() => openModal(day.id)}
                  className="btn btn-sm btn-ghost border border-base-200 gap-2 hover:bg-base-100 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <Plus size={16} />{" "}
                  <span className="hidden sm:inline">Add Item</span>
                </button>
              </div>

              <div className="p-2 space-y-1">
                {day.items.length === 0 ? (
                  <div className="text-center py-8 text-sm text-base-content/40 italic flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-base-200/50 flex items-center justify-center opacity-50">
                      <MapPin size={20} />
                    </div>
                    No activities planned yet.
                  </div>
                ) : (
                  day.items.map((item: any) => {
                    const imageUrl = getItemImage(item);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 hover:bg-base-200/50 rounded-xl group/item transition-colors border border-transparent hover:border-base-200 cursor-default"
                      >
                        {imageUrl ? (
                          <div className="w-12 h-12 rounded-lg bg-base-200 overflow-hidden shrink-0 shadow-sm relative border border-base-200">
                            <Image
                              src={imageUrl}
                              alt={item.title || "Item Image"}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                            <div className="absolute bottom-0 right-0 p-0.5 bg-base-100/90 rounded-tl-md text-[8px] text-base-content">
                              {item.type === "ACCOMMODATION" && (
                                <Hotel size={10} />
                              )}
                              {item.type === "ACTIVITY" && (
                                <Mountain size={10} />
                              )}
                              {item.type === "TRANSFER" && <Car size={10} />}
                              {item.type === "MEAL" && <DollarSign size={10} />}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                              item.type === "ACCOMMODATION"
                                ? "bg-indigo-500/10 text-indigo-500"
                                : item.type === "TRANSFER"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : item.type === "ACTIVITY"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : item.type === "MEAL"
                                      ? "bg-pink-500/10 text-pink-500"
                                      : "bg-base-300 text-base-content/70"
                            }`}
                          >
                            {item.type === "ACCOMMODATION" && (
                              <Hotel size={20} />
                            )}
                            {item.type === "TRANSFER" && <Car size={20} />}
                            {item.type === "ACTIVITY" && <Mountain size={20} />}
                            {item.type === "MEAL" && <Utensils size={20} />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate text-base-content">
                            {item.title}
                          </h4>
                          <p className="text-xs text-base-content/60 truncate">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-base-content/80">
                            NPR {Number(item.salesPrice).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-base-content/40 uppercase font-bold">
                            Est. Cost
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-xs btn-square btn-ghost opacity-0 group-hover/item:opacity-100 text-error transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD ITEM MODAL --- */}
      {activeDayId && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100 sticky top-0 z-20">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-base-content">
                  Add to Day {activeDay?.dayNumber}
                  {detectedLocationName && !showAllLocations ? (
                    <div
                      className="badge badge-primary gap-1 cursor-pointer hover:badge-error hover:line-through"
                      onClick={() => setShowAllLocations(true)}
                    >
                      <MapPin size={10} /> {detectedLocationName}
                    </div>
                  ) : (
                    <div
                      className="badge badge-ghost gap-1 opacity-50 cursor-pointer hover:opacity-100"
                      onClick={() => setShowAllLocations(false)}
                    >
                      <Filter size={10} /> All Locations
                    </div>
                  )}
                </h3>
                <p className="text-xs text-base-content/50">
                  Select a resource to add to this day's plan.
                </p>
              </div>
              <button
                onClick={() => setActiveDayId(null)}
                className="btn btn-sm btn-circle btn-ghost bg-base-200 hover:bg-base-300 border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 bg-base-200/30">
              <div className="tabs tabs-boxed bg-base-100 border border-base-200 p-1 rounded-xl flex-wrap">
                <a
                  onClick={() => setActiveModalTab("HOTEL")}
                  className={`tab flex-1 rounded-lg transition-all ${activeModalTab === "HOTEL" ? "tab-active bg-primary text-primary-content shadow-md" : "hover:bg-base-200"}`}
                >
                  <Hotel size={16} className="mr-2" /> Hotels
                </a>
                <a
                  onClick={() => setActiveModalTab("ACTIVITY")}
                  className={`tab flex-1 rounded-lg transition-all ${activeModalTab === "ACTIVITY" ? "tab-active bg-primary text-primary-content shadow-md" : "hover:bg-base-200"}`}
                >
                  <Mountain size={16} className="mr-2" /> Activities
                </a>
                <a
                  onClick={() => setActiveModalTab("VEHICLE")}
                  className={`tab flex-1 rounded-lg transition-all ${activeModalTab === "VEHICLE" ? "tab-active bg-primary text-primary-content shadow-md" : "hover:bg-base-200"}`}
                >
                  <Car size={16} className="mr-2" /> Vehicles
                </a>
                <a
                  onClick={() => setActiveModalTab("MEAL")}
                  className={`tab flex-1 rounded-lg transition-all ${activeModalTab === "MEAL" ? "tab-active bg-primary text-primary-content shadow-md" : "hover:bg-base-200"}`}
                >
                  <Utensils size={16} className="mr-2" /> Meals
                </a>
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 bg-base-200/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* HOTEL LIST */}
                {activeModalTab === "HOTEL" &&
                  (filteredHotels.length > 0 ? (
                    filteredHotels.map((h) => (
                      <div
                        key={h.id}
                        className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden flex flex-col hover:border-primary/50 transition-all"
                      >
                        <figure className="h-32 w-full bg-base-300 relative shrink-0">
                          <Image
                            src={h.imageUrl || "https://placehold.co/400"}
                            alt={h.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2 badge badge-xs badge-neutral bg-black/50 border-none text-white backdrop-blur-md">
                            {h.location?.name}
                          </div>
                        </figure>
                        <div className="p-4 border-b border-base-200">
                          <h3
                            className="font-bold text-sm line-clamp-1 text-base-content"
                            title={h.name}
                          >
                            {h.name}
                          </h3>
                        </div>
                        <div className="flex-1 p-2 space-y-1 bg-base-100 overflow-y-auto max-h-[150px]">
                          {h.rates.length > 0 ? (
                            h.rates.map((rate: any) => (
                              <button
                                key={rate.id}
                                onClick={() =>
                                  handleAddItem(h.id, "ACCOMMODATION", rate.id)
                                }
                                className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-primary/5 hover:text-primary border border-base-200 hover:border-primary/30 transition-all text-left group"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-bold flex items-center gap-1.5 text-base-content/80 group-hover:text-primary">
                                    <Bed size={12} className="opacity-50" />{" "}
                                    {rate.roomType}
                                  </div>
                                  <div className="text-[10px] text-base-content/50 flex items-center gap-1.5 mt-0.5">
                                    <Utensils size={10} /> {rate.mealPlan}
                                  </div>
                                </div>
                                <div className="text-xs font-black text-base-content/90 group-hover:text-primary whitespace-nowrap">
                                  NPR {rate.salesPrice.toLocaleString()}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-center p-2 text-xs opacity-50">
                              No rates available
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-base-content/40 flex flex-col items-center">
                      <Hotel size={48} className="opacity-20 mb-2" />
                      <p>No hotels found in {detectedLocationName}.</p>
                      <button
                        className="btn btn-link btn-xs mt-2"
                        onClick={() => setShowAllLocations(true)}
                      >
                        View hotels from all locations
                      </button>
                    </div>
                  ))}

                {/* ACTIVITY LIST */}
                {activeModalTab === "ACTIVITY" &&
                  (filteredActivities.length > 0 ? (
                    filteredActivities.map((a) => (
                      <div
                        key={a.id}
                        className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary cursor-pointer group transition-all"
                        onClick={() => handleAddItem(a.id, "ACTIVITY")}
                      >
                        <figure className="h-32 w-full bg-base-300 relative">
                          <Image
                            src={a.imageUrl || "https://placehold.co/400"}
                            alt={a.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 badge badge-xs badge-neutral bg-black/50 border-none text-white backdrop-blur-md">
                            {a.location?.name}
                          </div>
                        </figure>
                        <div className="card-body p-4">
                          <h3
                            className="font-bold text-sm line-clamp-1 text-base-content"
                            title={a.name}
                          >
                            {a.name}
                          </h3>
                          <div className="flex justify-between items-end mt-2 pt-2 border-t border-base-200">
                            <div className="text-[10px] uppercase font-bold opacity-40 max-w-[50%] truncate">
                              {a.details}
                            </div>
                            <div className="font-black text-primary">
                              <span className="text-[10px] font-normal opacity-60 mr-1">
                                NPR
                              </span>
                              {Number(a.salesPrice).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-base-content/40 flex flex-col items-center">
                      <Mountain size={48} className="opacity-20 mb-2" />
                      <p>No activities found in {detectedLocationName}.</p>
                      <button
                        className="btn btn-link btn-xs mt-2"
                        onClick={() => setShowAllLocations(true)}
                      >
                        View activities from all locations
                      </button>
                    </div>
                  ))}

                {/* VEHICLE LIST */}
                {activeModalTab === "VEHICLE" &&
                  vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary cursor-pointer group transition-all"
                      onClick={() => handleAddItem(v.id, "TRANSFER")}
                    >
                      <figure className="h-32 w-full bg-base-300 relative">
                        <Image
                          src={v.imageUrl || "https://placehold.co/400"}
                          alt={v.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 badge badge-xs badge-neutral bg-black/50 border-none text-white backdrop-blur-md">
                          {v.type}
                        </div>
                      </figure>
                      <div className="card-body p-4">
                        <h3
                          className="font-bold text-sm line-clamp-1 text-base-content"
                          title={v.name}
                        >
                          {v.name}
                        </h3>
                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-base-200">
                          <div className="text-[10px] uppercase font-bold opacity-40">
                            Per Day
                          </div>
                          <div className="font-black text-primary">
                            <span className="text-[10px] font-normal opacity-60 mr-1">
                              NPR
                            </span>
                            {Number(v.salesPerDay).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* 🟢 MEAL LIST WITH STOPOVER LOGIC */}
                {activeModalTab === "MEAL" && (
                  <div className="col-span-full space-y-8">
                    {/* Group 1: Local Restaurants (e.g. In Pokhara) */}
                    {restaurantGroups.current.length > 0 && (
                      <div>
                        <h4 className="font-bold text-xs text-base-content/50 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <MapPin size={12} /> In {detectedLocationName}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {restaurantGroups.current.map((r: any) => (
                            <RestaurantCard
                              key={r.id}
                              r={r}
                              handleAddItem={handleAddItem}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group 2: Highway Stops (e.g. Mugling) */}
                    {restaurantGroups.transit.length > 0 && (
                      <div>
                        <h4 className="font-bold text-xs text-orange-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <Car size={12} /> Highway / En Route
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {restaurantGroups.transit.map((r: any) => (
                            <RestaurantCard
                              key={r.id}
                              r={r}
                              handleAddItem={handleAddItem}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {restaurantGroups.current.length === 0 &&
                      restaurantGroups.transit.length === 0 && (
                        <div className="text-center py-12 text-base-content/40 flex flex-col items-center">
                          <Utensils size={48} className="opacity-20 mb-2" />
                          <p>No restaurants found nearby or en route.</p>
                          <button
                            className="btn btn-link btn-xs mt-2"
                            onClick={() => setShowAllLocations(true)}
                          >
                            View restaurants from all locations
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

// 🟢 Helper Component for Restaurant Cards
function RestaurantCard({ r, handleAddItem }: { r: any; handleAddItem: any }) {
  return (
    <div
      className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary cursor-pointer group transition-all"
      onClick={() => handleAddItem(r.id, "MEAL")}
    >
      <figure className="h-32 w-full bg-base-300 relative">
        <Image
          src={r.imageUrl || "https://placehold.co/400"}
          alt={r.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Visual Distinction for Highway Stops */}
        <div
          className={`absolute top-2 right-2 badge badge-xs border-none text-white backdrop-blur-md ${r.location?.type === "STOPOVER" ? "bg-orange-500" : "bg-black/50 badge-neutral"}`}
        >
          {r.location?.name}
        </div>
      </figure>
      <div className="card-body p-4">
        <h3
          className="font-bold text-sm line-clamp-1 text-base-content"
          title={r.name}
        >
          {r.name}
        </h3>
        <div className="flex justify-between items-end mt-2 pt-2 border-t border-base-200">
          <div className="text-[10px] uppercase font-bold opacity-40 max-w-[50%] truncate">
            {r.cuisine || "Restaurant"}
          </div>
          <div className="font-black text-primary">
            <span className="text-[10px] font-normal opacity-60 mr-1">NPR</span>
            {Number(r.salesPrice).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
