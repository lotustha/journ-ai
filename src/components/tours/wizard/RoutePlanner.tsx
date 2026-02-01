"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Minus,
  ArrowRight,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { generateRoute } from "@/actions/tour-wizard";
import { toast } from "sonner";

interface Props {
  tourId: string;
  totalDuration: number;
  countries: any[]; // 👈 Receives Countries with nested locations
}

export function RoutePlanner({ tourId, totalDuration, countries }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State: Active Country Tab
  const [activeCountryId, setActiveCountryId] = useState<string>(
    countries[0]?.id || "",
  );

  // State: List of selected stops
  const [stops, setStops] = useState<
    { id: string; locationId: string; name: string; nights: number }[]
  >([]);

  // Derived: Current total days used
  const currentTotal = stops.reduce((acc, s) => acc + s.nights, 0);
  const remainingDays = totalDuration - currentTotal;

  // Derived: Locations for the active country
  const availableDestinations = useMemo(() => {
    return countries.find((c) => c.id === activeCountryId)?.locations || [];
  }, [countries, activeCountryId]);

  // Handlers
  const addDestination = (location: any) => {
    if (remainingDays <= 0) {
      toast.error(
        "Tour duration limit reached. Increase tour days or reduce nights.",
      );
      return;
    }
    setStops([
      ...stops,
      {
        id: Math.random().toString(),
        locationId: location.id,
        name: location.name,
        nights: 1,
      },
    ]);
  };

  const removeStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  const updateNights = (index: number, delta: number) => {
    const newStops = [...stops];
    const newNights = newStops[index].nights + delta;

    if (newNights < 1) return;
    if (delta > 0 && remainingDays <= 0) {
      toast.error("No days left in budget!");
      return;
    }

    newStops[index].nights = newNights;
    setStops(newStops);
  };

  const handleSubmit = async () => {
    // Validation logic (same as before)
    if (stops.length === 0) {
      toast.error("Please select at least one destination.");
      return;
    }

    setIsSubmitting(true);
    const res = await generateRoute(
      tourId,
      stops.map((s) => ({ locationId: s.locationId, nights: s.nights })),
    );

    if (res.success) {
      toast.success("Itinerary generated!");
      router.push(`/dashboard/tours/${tourId}/itinerary`);
    } else {
      toast.error(res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* LEFT: DESTINATION SELECTOR */}
      <div className="lg:col-span-4 flex flex-col h-[600px] bg-base-100 border border-base-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Country Tabs */}
        <div className="flex overflow-x-auto border-b border-base-200 bg-base-50 scrollbar-hide">
          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => setActiveCountryId(country.id)}
              className={`px-4 py-3 text-xs font-bold uppercase whitespace-nowrap transition-colors border-b-2 ${
                activeCountryId === country.id
                  ? "border-primary text-primary bg-white"
                  : "border-transparent text-base-content/50 hover:bg-base-100"
              }`}
            >
              {country.name}
            </button>
          ))}
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {availableDestinations.length > 0 ? (
            availableDestinations.map((dest: any) => (
              <div
                key={dest.id}
                onClick={() => addDestination(dest)}
                className="card bg-base-100 border border-base-200 shadow-sm hover:border-primary cursor-pointer transition-all group flex flex-row items-center p-2 gap-3"
              >
                <div className="w-12 h-12 rounded-lg bg-base-200 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.imageUrl || "https://placehold.co/100"}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{dest.name}</h4>
                  <p className="text-[10px] text-base-content/50 flex items-center gap-1">
                    <Globe size={10} />{" "}
                    {dest.altitude ? `${dest.altitude}m` : "Destination"}
                  </p>
                </div>
                <button className="btn btn-sm btn-ghost btn-circle text-primary">
                  <Plus size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-50 text-sm">
              No destinations found for this country.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: ROUTE BUILDER */}
      <div className="lg:col-span-8 space-y-6">
        {/* PROGRESS BAR */}
        <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-xs font-bold uppercase text-base-content/40">
                Duration Planning
              </div>
              <div className="text-2xl font-black">
                {currentTotal}{" "}
                <span className="text-lg text-base-content/40 font-medium">
                  / {totalDuration} Days
                </span>
              </div>
            </div>
            {remainingDays === 0 ? (
              <div className="badge badge-success gap-1 p-3">
                <CheckCircle2 size={14} /> Perfect Match
              </div>
            ) : remainingDays > 0 ? (
              <div className="badge badge-neutral gap-1 p-3">
                {remainingDays} Days Left
              </div>
            ) : (
              <div className="badge badge-error gap-1 p-3">
                <AlertCircle size={14} /> {Math.abs(remainingDays)} Days Over
              </div>
            )}
          </div>
          <progress
            className={`progress w-full h-3 ${remainingDays < 0 ? "progress-error" : remainingDays === 0 ? "progress-success" : "progress-primary"}`}
            value={currentTotal}
            max={totalDuration}
          ></progress>
        </div>

        {/* TIMELINE */}
        <div className="space-y-4">
          {stops.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-2xl bg-base-50 text-base-content/40">
              <MapPin size={48} className="mx-auto mb-3 opacity-20" />
              <p>Select a country and add destinations to build your route.</p>
            </div>
          ) : (
            stops.map((stop, index) => (
              <div
                key={stop.id}
                className="relative pl-8 animate-in slide-in-from-left-4 fade-in duration-300"
              >
                {/* Connector Line */}
                {index !== stops.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-base-300"></div>
                )}

                {/* Dot */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md z-10">
                  {index + 1}
                </div>

                <div className="card bg-base-100 border border-base-200 shadow-sm p-4 flex flex-row items-center gap-4">
                  <GripVertical
                    size={16}
                    className="text-base-content/20 cursor-move"
                  />

                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{stop.name}</h4>
                    <div className="text-xs text-base-content/50">
                      {index === 0 ? "Start Point" : "Next Stop"}
                    </div>
                  </div>

                  {/* Night Controller */}
                  <div className="join border border-base-200 rounded-lg">
                    <button
                      onClick={() => updateNights(index, -1)}
                      className="join-item btn btn-sm btn-ghost px-2"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="join-item flex items-center justify-center px-4 bg-base-50 text-sm font-bold w-24">
                      {stop.nights} Night{stop.nights !== 1 ? "s" : ""}
                    </div>
                    <button
                      onClick={() => updateNights(index, 1)}
                      className="join-item btn btn-sm btn-ghost px-2"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeStop(index)}
                    className="btn btn-sm btn-ghost btn-circle text-error hover:bg-error/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ACTION FOOTER */}
        <div className="flex justify-end pt-4 border-t border-base-200">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || stops.length === 0}
            className="btn btn-primary px-8 gap-2 rounded-xl shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Generating Itinerary..." : "Generate Itinerary"}{" "}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
