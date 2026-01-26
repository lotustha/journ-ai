"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MapPin,
  X,
  Save,
  Settings2,
  Camera,
  Coffee,
  Map,
  Globe,
  BedDouble,
  PartyPopper,
  UtensilsCrossed,
  AlignLeft,
  Filter,
  ArrowUpDown,
  ZoomIn,
} from "lucide-react";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  deleteLocationImage,
} from "@/actions/locations";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { CountryManager } from "./CountryManager";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { toast } from "sonner";

interface LocationManagerProps {
  initialData: any[];
  countries: any[];
  hotels: any[];
  activities: any[];
  staff: any[];
  restaurants: any[];
}

export function LocationManager({
  initialData,
  countries,
  hotels,
  activities,
  restaurants,
}: LocationManagerProps) {
  // --- STATE ---
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // --- FILTERS & SORT ---
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // --- DERIVED DATA ---
  const processedLocations = useMemo(() => {
    let result = [...initialData];

    if (searchQuery)
      result = result.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    if (filterCountry !== "all")
      result = result.filter((loc) => loc.countryId === filterCountry);
    if (filterType !== "all")
      result = result.filter((loc) => loc.type === filterType);

    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "country") {
        aValue = a.country?.name || "";
        bValue = b.country?.name || "";
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [initialData, searchQuery, filterCountry, filterType, sortConfig]);

  const totalPages = Math.ceil(processedLocations.length / ITEMS_PER_PAGE);
  const paginatedLocations = processedLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // --- RELATED RESOURCES FOR DETAIL VIEW ---
  const locationHotels = useMemo(() => {
    if (!viewingItem) return [];
    return hotels.filter((h) => h.locationId === viewingItem.id);
  }, [viewingItem, hotels]);

  const locationActivities = useMemo(() => {
    if (!viewingItem) return [];
    return activities.filter((a) => a.locationId === viewingItem.id);
  }, [viewingItem, activities]);

  const locationRestaurants = useMemo(() => {
    if (!viewingItem) return [];
    return restaurants.filter((r) => r.locationId === viewingItem.id);
  }, [viewingItem, restaurants]);

  // --- HANDLERS ---
  const handleEdit = (item: any, e?: any) => {
    e?.stopPropagation();
    setEditingItem(item);
    setIsLocationModalOpen(true);
  };
  const handleDeleteRequest = (id: string, e?: any) => {
    e?.stopPropagation();
    setItemToDelete(id);
  };
  const handleCreate = () => {
    setEditingItem(null);
    setIsLocationModalOpen(true);
  };

  async function confirmDeleteLocation() {
    if (!itemToDelete) return;
    const result = await deleteLocation(itemToDelete);
    if (result?.success) toast.success("Location deleted");
    else toast.error(result?.error);
    setItemToDelete(null);
  }

  async function handleDeleteGalleryImage(imageId: string) {
    const result = await deleteLocationImage(imageId);
    if (result.success) {
      toast.success("Image removed");
      setEditingItem((prev: any) => ({
        ...prev,
        images: prev.images
          ? prev.images.filter((img: any) => img.id !== imageId)
          : [],
      }));
    } else {
      toast.error("Failed to delete image");
    }
  }

  async function handleSubmitLocation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingItem) formData.append("id", editingItem.id);
    const action = editingItem ? updateLocation : createLocation;
    const result = await action(null, formData);
    if (result?.success) {
      toast.success(result.message);
      setIsLocationModalOpen(false);
    } else {
      toast.error(result?.error || "Error saving");
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          <div className="relative w-full md:w-56">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered input-sm w-full pl-9 bg-base-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered select-sm bg-base-50 w-full md:w-40"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm bg-base-50 w-full md:w-40"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="DESTINATION">Destinations</option>
            <option value="STOPOVER">Highway Stops</option>
          </select>
          <select
            className="select select-bordered select-sm bg-base-50 w-full md:w-40"
            onChange={(e) => {
              const [key, dir] = e.target.value.split("-");
              setSortConfig({ key, direction: dir as "asc" | "desc" });
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="country-asc">Country (A-Z)</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end w-full xl:w-auto">
          <button
            onClick={() => setIsCountryModalOpen(true)}
            className="btn btn-ghost btn-sm gap-2 border border-base-300"
          >
            <Settings2 size={16} /> Countries
          </button>
          <button
            onClick={handleCreate}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus size={16} /> Add Location
          </button>
        </div>
      </div>

      {/* 2. GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedLocations.map((loc: any) => {
          const carouselImages = [
            loc.imageUrl,
            ...(loc.images?.map((i: any) => i.url) || []),
          ].filter(Boolean);
          const isStopover = loc.type === "STOPOVER";

          return (
            <div
              key={loc.id}
              onClick={() => setViewingItem(loc)}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
            >
              <div className="relative h-40">
                <ImageCarousel
                  images={carouselImages}
                  alt={loc.name}
                  aspectRatio="h-full"
                />
                <div
                  className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm backdrop-blur-md ${isStopover ? "bg-orange-100 text-orange-700" : "bg-white/90 text-primary"}`}
                >
                  {isStopover ? <Coffee size={10} /> : <MapPin size={10} />}
                  {isStopover ? "Highway Stop" : "Destination"}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => handleEdit(loc, e)}
                    className="btn btn-xs btn-square bg-white shadow hover:bg-primary hover:text-white"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteRequest(loc.id, e)}
                    className="btn btn-xs btn-square bg-white shadow hover:bg-error hover:text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold truncate">{loc.name}</h3>
                  <div className="text-[10px] flex items-center gap-1 opacity-50 bg-base-200 px-1.5 py-0.5 rounded">
                    <Globe size={10} /> {loc.country?.name}
                  </div>
                </div>
                {isStopover && (
                  <p className="text-[10px] text-orange-600 font-medium mt-1">
                    Transit / Meal Stop
                  </p>
                )}
                {!isStopover && (
                  <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                    {loc.description || "No description."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={processedLocations.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* 4. DETAIL MODAL (UPDATED WITH THUMBNAILS) */}
      {viewingItem && (
        <dialog className="modal modal-open backdrop-blur-md">
          <div className="modal-box w-11/12 max-w-6xl p-0 bg-base-100 shadow-2xl h-[90vh] flex flex-col overflow-hidden rounded-2xl">
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-72 w-full shrink-0">
                <ImageCarousel
                  images={[
                    viewingItem.imageUrl,
                    ...(viewingItem.images?.map((i: any) => i.url) || []),
                  ].filter(Boolean)}
                  alt={viewingItem.name}
                  aspectRatio="h-full"
                />
                <button
                  onClick={() => setViewingItem(null)}
                  className="fixed top-6 right-6 btn btn-circle btn-sm bg-black/50 text-white border-none hover:bg-black/70 z-50"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/90 to-transparent p-8 pt-24">
                  <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider mb-2">
                    {viewingItem.type === "STOPOVER" ? (
                      <>
                        <Coffee size={14} /> Highway Stop
                      </>
                    ) : (
                      <>
                        <Map size={14} /> Destination
                      </>
                    )}
                  </div>
                  <h1 className="text-4xl font-black text-white">
                    {viewingItem.name}
                  </h1>
                  <div className="flex items-center gap-2 text-white/70 text-sm mt-2">
                    <Globe size={14} /> {viewingItem.country?.name}
                    {viewingItem.altitude && (
                      <span className="opacity-60 text-xs ml-2">
                        • {viewingItem.altitude}m elevation
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <h3 className="font-bold text-xs uppercase text-base-content/40 mb-3 tracking-widest flex items-center gap-2">
                      <AlignLeft size={14} /> About
                    </h3>
                    <p className="text-base-content/80 leading-relaxed text-sm whitespace-pre-wrap">
                      {viewingItem.description || "No description available."}
                    </p>
                  </section>

                  {/* LINKED RESOURCES LIST (WITH IMAGES) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hotels */}
                    {locationHotels.length > 0 && (
                      <section className="bg-base-50 p-4 rounded-xl border border-base-200">
                        <h4 className="font-bold text-xs uppercase text-base-content/50 mb-3 flex items-center gap-2">
                          <BedDouble size={14} /> Accommodations
                        </h4>
                        <ul className="space-y-3">
                          {locationHotels.map((h: any) => (
                            <li
                              key={h.id}
                              className="flex items-center gap-3 p-2 bg-white rounded-lg border border-base-200 shadow-sm"
                            >
                              <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-base-200">
                                {h.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={h.imageUrl}
                                    alt={h.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-base-content/20">
                                    <BedDouble size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">
                                  {h.name}
                                </p>
                                <p className="text-[10px] text-base-content/50 truncate">
                                  {h.contactInfo || "No contact info"}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Activities */}
                    {locationActivities.length > 0 && (
                      <section className="bg-base-50 p-4 rounded-xl border border-base-200">
                        <h4 className="font-bold text-xs uppercase text-base-content/50 mb-3 flex items-center gap-2">
                          <PartyPopper size={14} /> Things To Do
                        </h4>
                        <ul className="space-y-3">
                          {locationActivities.map((a: any) => (
                            <li
                              key={a.id}
                              className="flex items-center gap-3 p-2 bg-white rounded-lg border border-base-200 shadow-sm"
                            >
                              <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-base-200">
                                {a.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={a.imageUrl}
                                    alt={a.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-base-content/20">
                                    <PartyPopper size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">
                                  {a.name}
                                </p>
                                <p className="text-[10px] text-base-content/50 truncate">
                                  Activity
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Restaurants */}
                    {locationRestaurants.length > 0 && (
                      <section className="bg-base-50 p-4 rounded-xl border border-base-200">
                        <h4 className="font-bold text-xs uppercase text-base-content/50 mb-3 flex items-center gap-2">
                          <UtensilsCrossed size={14} /> Dining
                        </h4>
                        <ul className="space-y-3">
                          {locationRestaurants.map((r: any) => (
                            <li
                              key={r.id}
                              className="flex items-center gap-3 p-2 bg-white rounded-lg border border-base-200 shadow-sm"
                            >
                              <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-base-200">
                                {r.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={r.imageUrl}
                                    alt={r.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-base-content/20">
                                    <UtensilsCrossed size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">
                                  {r.name}
                                </p>
                                <p className="text-[10px] text-base-content/50 truncate">
                                  {r.cuisine || "Cuisine"}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>

                  {viewingItem.images && viewingItem.images.length > 0 && (
                    <section>
                      <h3 className="font-bold text-xs uppercase text-base-content/40 mb-3 tracking-widest flex items-center gap-2">
                        <Camera size={14} /> Photo Gallery
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {viewingItem.images.map((img: any) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-lg overflow-hidden border border-base-200 group cursor-zoom-in"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              alt="Location"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="text-white" size={16} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div>
                  <div className="bg-base-50 p-5 rounded-2xl border border-base-200 sticky top-4 space-y-4">
                    <h4 className="font-bold text-[10px] uppercase text-base-content/40 tracking-widest">
                      Manage Location
                    </h4>
                    <button
                      onClick={() => {
                        setViewingItem(null);
                        handleEdit(viewingItem);
                      }}
                      className="btn btn-sm w-full gap-2 bg-white border-base-200 shadow-sm hover:border-primary hover:text-primary"
                    >
                      <Pencil size={14} /> Edit Details
                    </button>
                    <button
                      onClick={() => {
                        setViewingItem(null);
                        handleDeleteRequest(viewingItem.id);
                      }}
                      className="btn btn-sm w-full gap-2 btn-ghost text-error hover:bg-error/10"
                    >
                      <Trash2 size={14} /> Delete Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* 5. EDIT FORM */}
      {isLocationModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl">
            <div className="px-8 py-5 border-b border-base-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xl">
                {editingItem ? "Edit Location" : "New Location"}
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <form
              key={editingItem?.id || "new"}
              onSubmit={handleSubmitLocation}
              className="flex flex-col md:flex-row h-[70vh]"
            >
              <div className="md:w-1/3 bg-white p-8 space-y-6 border-r border-base-200 overflow-y-auto">
                <div className="form-control">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1 mb-1">
                    Location Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer label border border-base-300 rounded-lg has-checked:border-primary has-checked:bg-primary/5 hover:bg-base-50 transition-all p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="type"
                          value="DESTINATION"
                          defaultChecked={editingItem?.type !== "STOPOVER"}
                          className="radio radio-primary radio-sm"
                        />
                        <span className="label-text font-bold text-xs">
                          Destination
                        </span>
                      </div>
                    </label>
                    <label className="cursor-pointer label border border-base-300 rounded-lg has-checked:border-orange-500 has-checked:bg-orange-50 hover:bg-base-50 transition-all p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="type"
                          value="STOPOVER"
                          defaultChecked={editingItem?.type === "STOPOVER"}
                          className="radio radio-warning radio-sm"
                        />
                        <span className="label-text font-bold text-xs">
                          Highway Stop
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Location Name <span className="text-error">*</span>
                  </label>
                  <input
                    name="name"
                    defaultValue={editingItem?.name}
                    className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl font-medium"
                    required
                    placeholder="e.g. Malekhu"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Country
                  </label>
                  <select
                    name="countryId"
                    defaultValue={editingItem?.countryId || ""}
                    className="select w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl font-medium"
                    required
                  >
                    <option value="" disabled>
                      Select...
                    </option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Altitude (m)
                  </label>
                  <input
                    name="altitude"
                    type="number"
                    defaultValue={editingItem?.altitude}
                    className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingItem?.description}
                    className="textarea w-full h-32 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl font-medium leading-relaxed"
                    placeholder="Transit point famous for fish..."
                  />
                </div>
              </div>

              <div className="w-full md:w-2/3 p-8 flex flex-col bg-base-50/50 overflow-y-auto">
                <div className="mb-8">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2 block">
                    Cover Image
                  </label>
                  <div className="h-48 rounded-2xl border border-base-200 bg-white shadow-sm overflow-hidden">
                    <ImageUpload
                      name="image"
                      defaultValue={editingItem?.imageUrl}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Camera size={14} /> Photo Gallery
                  </label>
                  <div className="bg-white rounded-2xl border border-base-200 p-5 shadow-sm">
                    <MultiImageUpload
                      name="galleryImages"
                      defaultImages={editingItem?.images}
                      onRemoveExisting={handleDeleteGalleryImage}
                    />
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-base-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(false)}
                    className="btn btn-ghost hover:bg-base-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-8 gap-2 rounded-xl shadow-lg shadow-primary/20"
                  >
                    <Save size={18} /> Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Location?"
        message="This will delete the location. Cannot be undone."
        isDanger={true}
        onConfirm={confirmDeleteLocation}
        onCancel={() => setItemToDelete(null)}
      />
      {isCountryModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-7xl p-0 overflow-hidden bg-base-100 shadow-2xl h-[90vh]">
            <CountryManager
              countries={countries}
              onClose={() => setIsCountryModalOpen(false)}
            />
          </div>
        </dialog>
      )}
    </div>
  );
}
