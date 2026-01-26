"use client";

import { useState } from "react";
import {
  Building2,
  Car,
  PartyPopper,
  Mountain,
  User,
  Utensils,
} from "lucide-react";
import { LocationManager } from "./LocationManager";
import { HotelManager } from "./HotelManager";
import { VehicleManager } from "./VehicleManager";
import { ActivityManager } from "./ActivityManager";
import { StaffManager } from "./StaffManager";
import { RestaurantManager } from "./RestaurantManager";

export function ResourceManager({
  hotels,
  vehicles,
  activities,
  locations,
  countries,
  staff,
  restaurants,
}: any) {
  const [activeTab, setActiveTab] = useState<
    "locations" | "hotels" | "vehicles" | "activities" | "staff" | "restaurants"
  >("locations");

  const TabButton = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
        activeTab === id
          ? "border-primary text-primary bg-primary/5"
          : "border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-base-200 overflow-x-auto bg-base-100 rounded-t-xl px-2">
        <TabButton id="locations" icon={Mountain} label="Locations" />
        <TabButton id="hotels" icon={Building2} label="Hotels" />
        <TabButton id="vehicles" icon={Car} label="Vehicles" />
        <TabButton id="activities" icon={PartyPopper} label="Activities" />
        <TabButton id="staff" icon={User} label="Staff" />
        <TabButton id="restaurants" icon={Utensils} label="Restaurants" />
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "locations" && (
          <LocationManager
            initialData={locations}
            countries={countries}
            hotels={hotels} // 👈 PASSING DATA
            activities={activities} // 👈 PASSING DATA
            staff={staff} // 👈 PASSING DATA
            restaurants={restaurants} // 👈 PASSING DATA
          />
        )}
        {activeTab === "hotels" && (
          <HotelManager initialData={hotels} locations={locations} />
        )}
        {activeTab === "vehicles" && <VehicleManager initialData={vehicles} />}
        {activeTab === "activities" && (
          <ActivityManager initialData={activities} locations={locations} />
        )}
        {activeTab === "staff" && <StaffManager initialData={staff} />}
        {activeTab === "restaurants" && (
          <RestaurantManager initialData={restaurants} locations={locations} />
        )}
      </div>
    </div>
  );
}
