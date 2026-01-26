"use client";

import { useState } from "react";
import {
  Building2,
  Car,
  PartyPopper,
  Plus,
  Trash2,
  MapPin,
  User,
  Pencil,
  X,
  Save,
  FileText,
  BedDouble,
  Utensils,
  Coffee,
  Calendar,
  Gauge,
  Wallet,
  Search,
  Mountain,
  ImageIcon,
  Link as LinkIcon,
  Phone,
  Hash,
} from "lucide-react";
import {
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/actions/locations";
import {
  createHotel,
  createVehicle,
  createActivity,
  updateHotel,
  updateVehicle,
  updateActivity,
  deleteResource,
} from "@/actions/resources";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function ResourceManager({
  hotels,
  vehicles,
  activities,
  locations,
}: any) {
  const [activeTab, setActiveTab] = useState<
    "locations" | "hotels" | "vehicles" | "activities"
  >("locations");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const [tempRates, setTempRates] = useState<any[]>([
    {
      roomType: "Standard",
      mealPlan: "EP",
      inclusions: "",
      costPrice: 0,
      currency: "NPR",
    },
  ]);

  // --- HANDLERS ---
  function handleEdit(resource: any) {
    setEditingResource(resource);
    if (activeTab === "hotels" && resource.rates) {
      setTempRates(resource.rates);
    } else {
      setTempRates([
        {
          roomType: "Standard",
          mealPlan: "EP",
          inclusions: "",
          costPrice: 0,
          currency: "NPR",
        },
      ]);
    }
    setIsModalOpen(true);
  }

  function handleCreate() {
    setEditingResource(null);
    setTempRates([
      {
        roomType: "Standard",
        mealPlan: "EP",
        inclusions: "",
        costPrice: 0,
        currency: "NPR",
      },
    ]);
    setIsModalOpen(true);
  }

  function addRateRow() {
    setTempRates([
      ...tempRates,
      {
        roomType: "",
        mealPlan: "BB",
        inclusions: "",
        costPrice: 0,
        currency: "NPR",
      },
    ]);
  }
  function removeRateRow(index: number) {
    if (tempRates.length > 1)
      setTempRates(tempRates.filter((_, i) => i !== index));
  }
  function updateRateRow(index: number, field: string, value: any) {
    const newRates = [...tempRates];
    newRates[index][field] = value;
    setTempRates(newRates);
  }

  // --- SUBMIT ---
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingResource) formData.append("id", editingResource.id);
    if (activeTab === "hotels")
      formData.append("rates", JSON.stringify(tempRates));

    let action;
    if (activeTab === "locations")
      action = editingResource ? updateLocation : createLocation;
    else if (activeTab === "hotels")
      action = editingResource ? updateHotel : createHotel;
    else if (activeTab === "vehicles")
      action = editingResource ? updateVehicle : createVehicle;
    else action = editingResource ? updateActivity : createActivity;

    const result = await action(null, formData);

    if (result?.success) {
      toast.success(result.message);
      setIsModalOpen(false);
      setEditingResource(null);
    } else {
      toast.error(result?.error || "Error saving resource");
    }
  }

  // --- DELETE ---
  async function handleLocationDelete(id: string) {
    if (!confirm("Delete this location? This cannot be undone.")) return;
    const result = await deleteLocation(id);
    if (result?.success) toast.success("Deleted");
    else toast.error(result?.error);
  }
  async function handleDelete(
    id: string,
    type: "hotel" | "vehicle" | "activity",
  ) {
    if (!confirm("Delete resource?")) return;
    const result = await deleteResource(id, type);
    if (result?.success) toast.success("Deleted");
    else toast.error(result?.error);
  }

  // --- HELPERS ---
  const ResourceImage = ({ url, type }: { url?: string; type: string }) => {
    if (url) {
      return (
        <div className="w-full h-36 relative overflow-hidden bg-base-200 group-hover:scale-105 transition-transform duration-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Resource"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
        </div>
      );
    }
    const colors: any = {
      locations: "bg-blue-600",
      hotels: "bg-emerald-600",
      vehicles: "bg-orange-600",
      activities: "bg-violet-600",
    };
    const icons: any = {
      locations: <Mountain size={40} />,
      hotels: <Building2 size={40} />,
      vehicles: <Car size={40} />,
      activities: <PartyPopper size={40} />,
    };
    return (
      <div
        className={`w-full h-36 ${colors[activeTab] || "bg-base-300"} flex items-center justify-center text-white/20`}
      >
        {icons[activeTab]}
      </div>
    );
  };

  const InputGroup = ({ icon: Icon, children }: any) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
        <Icon size={14} />
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 1. TABS */}
      <div className="flex justify-between items-end border-b border-base-200 pb-2">
        <div className="flex gap-2 overflow-x-auto">
          {["locations", "hotels", "vehicles", "activities"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`btn btn-sm capitalize ${activeTab === tab ? "btn-primary" : "btn-ghost"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* 2. GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* --- LOCATIONS --- */}
        {activeTab === "locations" &&
          locations.map((loc: any) => (
            <div
              key={loc.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <ResourceImage url={loc.imageUrl} type="locations" />
              <div className="card-body p-4 relative">
                <div className="absolute top-[-24px] right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEdit(loc)}
                    className="btn btn-circle btn-sm btn-ghost bg-base-100 shadow text-primary"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleLocationDelete(loc.id)}
                    className="btn btn-circle btn-sm btn-ghost bg-base-100 shadow text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-bold text-lg">{loc.name}</h3>
                {loc.altitude && (
                  <div className="text-xs text-base-content/60">
                    {loc.altitude}m Elevation
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* --- HOTELS --- */}
        {activeTab === "hotels" &&
          hotels.map((h: any) => (
            <div
              key={h.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <ResourceImage url={h.imageUrl} type="hotels" />
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{h.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-base-content/60">
                      <MapPin size={12} /> {h.location?.name || "Unknown"}
                    </div>
                    {h.contactInfo && (
                      <div className="flex items-center gap-1 text-xs text-base-content/60 mt-1">
                        <Phone size={12} /> {h.contactInfo}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(h)}
                      className="btn btn-square btn-ghost btn-xs"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(h.id, "hotel")}
                      className="btn btn-square btn-ghost btn-xs text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs bg-base-200/50 p-2 rounded">
                  {h.rates.slice(0, 2).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="opacity-70">{r.roomType}</span>
                      <span className="font-mono font-bold text-primary">
                        {formatCurrency(r.costPrice, r.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

        {/* --- VEHICLES --- */}
        {activeTab === "vehicles" &&
          vehicles.map((v: any) => (
            <div
              key={v.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <ResourceImage url={v.imageUrl} type="vehicles" />
              <div className="card-body p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="badge badge-outline text-[10px] mb-1">
                      {v.type}
                    </div>
                    <h3 className="font-bold leading-tight">{v.name}</h3>
                    {v.contactNumber && (
                      <div className="flex items-center gap-1 text-xs text-base-content/60 mt-1">
                        <Phone size={12} /> {v.contactNumber}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(v)}
                      className="btn btn-square btn-ghost btn-xs"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, "vehicle")}
                      className="btn btn-square btn-ghost btn-xs text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t border-base-200 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-base-content/40 mb-1">
                      Day
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {formatCurrency(v.ratePerDay, v.currency).replace(
                        ".00",
                        "",
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-base-200">
                    <span className="text-[9px] uppercase font-bold text-base-content/40 mb-1">
                      Km
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {formatCurrency(v.ratePerKm, v.currency).replace(
                        ".00",
                        "",
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-base-200">
                    <span className="text-[9px] uppercase font-bold text-base-content/40 mb-1">
                      Driver
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {formatCurrency(v.driverAllowance, v.currency).replace(
                        ".00",
                        "",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {/* --- ACTIVITIES --- */}
        {activeTab === "activities" &&
          activities.map((a: any) => (
            <div
              key={a.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <ResourceImage url={a.imageUrl} type="activities" />
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{a.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-base-content/60">
                      <MapPin size={12} /> {a.location?.name}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(a)}
                      className="btn btn-square btn-ghost btn-xs"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id, "activity")}
                      className="btn btn-square btn-ghost btn-xs text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-base-200 flex justify-between items-end">
                  <span className="text-xs text-base-content/50">Per Pax</span>
                  <span className="font-mono font-bold text-primary">
                    {formatCurrency(a.costPerHead, a.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* 3. MODAL */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100">
              <h3 className="font-bold text-lg capitalize">
                {editingResource ? "Edit" : "Add"} {activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
              {/* --- LEFT SIDE: INFO & IMAGES --- */}
              <div className="md:w-1/3 bg-base-200/50 p-6 space-y-4 border-r border-base-200">
                <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider">
                  Details & Image
                </div>

                {/* 1. IMAGE UPLOAD (First thing on Left Column) */}
                <div className="form-control w-full">
                  <ImageUpload
                    name="image"
                    defaultValue={editingResource?.imageUrl}
                  />
                </div>

                {/* --- LOCATION FIELDS --- */}
                {activeTab === "locations" && (
                  <>
                    <div className="form-control w-full mt-4">
                      <label className="label label-text text-xs font-semibold">
                        Name
                      </label>
                      <InputGroup icon={Mountain}>
                        <input
                          name="name"
                          defaultValue={editingResource?.name}
                          className="input input-bordered input-sm w-full pl-9"
                          required
                        />
                      </InputGroup>
                    </div>
                    <div className="form-control w-full">
                      <label className="label label-text text-xs font-semibold">
                        Altitude (m)
                      </label>
                      <InputGroup icon={Gauge}>
                        <input
                          name="altitude"
                          type="number"
                          defaultValue={editingResource?.altitude}
                          className="input input-bordered input-sm w-full pl-9"
                        />
                      </InputGroup>
                    </div>
                    <div className="form-control w-full">
                      <label className="label label-text text-xs font-semibold">
                        Description
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingResource?.description}
                        className="textarea textarea-bordered text-sm w-full h-20"
                        placeholder="About this place..."
                      />
                    </div>
                  </>
                )}

                {/* --- OTHER FIELDS --- */}
                {activeTab !== "locations" && (
                  <>
                    <div className="form-control w-full mt-4">
                      <label className="label label-text text-xs font-semibold">
                        Name
                      </label>
                      <InputGroup icon={FileText}>
                        <input
                          name="name"
                          defaultValue={editingResource?.name}
                          className="input input-bordered input-sm w-full pl-9"
                          required
                        />
                      </InputGroup>
                    </div>

                    {/* LOCATION SELECTOR (For Hotels/Activities) */}
                    {(activeTab === "hotels" || activeTab === "activities") && (
                      <div className="form-control w-full">
                        <label className="label label-text text-xs font-semibold">
                          Location
                        </label>
                        <InputGroup icon={MapPin}>
                          <select
                            name="locationId"
                            defaultValue={editingResource?.locationId || ""}
                            className="select select-bordered select-sm w-full pl-9"
                            required={activeTab === "hotels"}
                          >
                            <option value="">Select...</option>
                            {locations.map((l: any) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </InputGroup>
                      </div>
                    )}

                    {/* HOTEL CONTACT */}
                    {activeTab === "hotels" && (
                      <div className="form-control w-full">
                        <label className="label label-text text-xs font-semibold">
                          Contact Info
                        </label>
                        <InputGroup icon={Phone}>
                          <input
                            name="contactInfo"
                            defaultValue={editingResource?.contactInfo}
                            className="input input-bordered input-sm w-full pl-9"
                            placeholder="Phone or Email"
                          />
                        </InputGroup>
                      </div>
                    )}

                    {/* VEHICLE FIELDS */}
                    {activeTab === "vehicles" && (
                      <>
                        <div className="form-control w-full">
                          <label className="label label-text text-xs font-semibold">
                            Type
                          </label>
                          <select
                            name="type"
                            defaultValue={editingResource?.type}
                            className="select select-bordered select-sm w-full"
                          >
                            <option>SUV (Scorpio/Jeep)</option>
                            <option>Car</option>
                            <option>Van</option>
                            <option>Bus</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="form-control">
                            <label className="label text-[10px]">Plate</label>
                            <input
                              name="plateNumber"
                              defaultValue={editingResource?.plateNumber}
                              className="input input-bordered input-sm"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[10px]">Driver</label>
                            <input
                              name="driverName"
                              defaultValue={editingResource?.driverName}
                              className="input input-bordered input-sm"
                            />
                          </div>
                        </div>
                        <div className="form-control w-full">
                          <label className="label label-text text-xs font-semibold">
                            Driver Contact
                          </label>
                          <InputGroup icon={Phone}>
                            <input
                              name="contactNumber"
                              defaultValue={editingResource?.contactNumber}
                              className="input input-bordered input-sm w-full pl-9"
                              placeholder="Phone"
                            />
                          </InputGroup>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* --- RIGHT SIDE: PRICING --- */}
              <div className="md:w-2/3 p-6 flex flex-col">
                {activeTab === "locations" ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-base-content/30 border border-dashed rounded-xl m-4">
                    <ImageIcon size={48} className="mb-2" />
                    <p className="text-sm">Location Preview</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* HOTEL RATES TABLE */}
                    {activeTab === "hotels" && (
                      <div className="border border-base-200 rounded-lg overflow-hidden">
                        <div className="bg-base-200 px-4 py-2 flex justify-between items-center">
                          <span className="text-xs font-bold uppercase opacity-50">
                            Room Rates
                          </span>
                          <button
                            type="button"
                            onClick={addRateRow}
                            className="btn btn-xs btn-ghost text-primary"
                          >
                            + Add Row
                          </button>
                        </div>
                        <table className="table table-xs w-full">
                          <thead className="bg-base-100">
                            <tr>
                              <th className="pl-4">Room</th>
                              <th>Plan</th>
                              <th>Inclusions</th>
                              <th>Cost (NPR)</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tempRates.map((rate, idx) => (
                              <tr
                                key={idx}
                                className="group border-t border-base-100"
                              >
                                <td className="pl-2">
                                  <input
                                    value={rate.roomType}
                                    onChange={(e) =>
                                      updateRateRow(
                                        idx,
                                        "roomType",
                                        e.target.value,
                                      )
                                    }
                                    className="input input-ghost input-xs w-full"
                                    placeholder="Standard"
                                  />
                                </td>
                                <td className="p-1">
                                  {/* ⚡️ FIXED: DROPDOWN RESTORED */}
                                  <select
                                    value={rate.mealPlan}
                                    onChange={(e) =>
                                      updateRateRow(
                                        idx,
                                        "mealPlan",
                                        e.target.value,
                                      )
                                    }
                                    className="select select-ghost select-xs w-full"
                                  >
                                    <option value="EP">EP (Room Only)</option>
                                    <option value="BB">BB (Breakfast)</option>
                                    <option value="MAP">
                                      MAP (Dinner+Brk)
                                    </option>
                                    <option value="AP">AP (All Meals)</option>
                                  </select>
                                </td>
                                <td className="p-1">
                                  <input
                                    value={rate.inclusions}
                                    onChange={(e) =>
                                      updateRateRow(
                                        idx,
                                        "inclusions",
                                        e.target.value,
                                      )
                                    }
                                    className="input input-ghost input-xs w-full"
                                    placeholder="e.g. 2 Eggs"
                                  />
                                </td>
                                <td className="p-1 w-24">
                                  <input
                                    type="number"
                                    value={rate.costPrice}
                                    onChange={(e) =>
                                      updateRateRow(
                                        idx,
                                        "costPrice",
                                        e.target.value,
                                      )
                                    }
                                    className="input input-ghost input-xs w-full text-right font-mono"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="p-1 w-8 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeRateRow(idx)}
                                    className="btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === "vehicles" && (
                      <div className="grid grid-cols-2 gap-4 border border-base-200 p-4 rounded-xl">
                        <div className="form-control">
                          <label className="label text-xs font-bold">
                            Day Rate (NPR)
                          </label>
                          <input
                            name="ratePerDay"
                            defaultValue={editingResource?.ratePerDay}
                            type="number"
                            className="input input-bordered input-sm font-mono"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-xs font-bold">
                            Km Rate (NPR)
                          </label>
                          <input
                            name="ratePerKm"
                            defaultValue={editingResource?.ratePerKm}
                            type="number"
                            className="input input-bordered input-sm font-mono"
                          />
                        </div>
                        <div className="form-control col-span-2">
                          <label className="label text-xs font-bold">
                            Driver Allowance (Per Night)
                          </label>
                          <input
                            name="driverAllowance"
                            defaultValue={editingResource?.driverAllowance}
                            type="number"
                            className="input input-bordered input-sm font-mono"
                          />
                        </div>
                        <input type="hidden" name="currency" value="NPR" />
                      </div>
                    )}

                    {activeTab === "activities" && (
                      <div className="form-control border border-base-200 p-4 rounded-xl">
                        <label className="label text-xs font-bold">
                          Cost Per Head (NPR)
                        </label>
                        <input
                          name="costPerHead"
                          defaultValue={editingResource?.costPerHead}
                          type="number"
                          className="input input-bordered input-sm font-mono"
                        />
                        <input type="hidden" name="currency" value="NPR" />
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-action mt-auto pt-4 border-t border-base-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-6 gap-2">
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
