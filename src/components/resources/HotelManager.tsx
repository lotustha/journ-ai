"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Building2,
  MapPin,
  X,
  Save,
  Phone,
  DollarSign,
  Camera,
  ZoomIn,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import {
  createHotel,
  updateHotel,
  deleteResource,
  deleteResourceImage,
} from "@/actions/resources";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface HotelManagerProps {
  initialData: any[];
  locations: any[];
}

export function HotelManager({ initialData, locations }: HotelManagerProps) {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // FILTER / SORT / PAGINATION STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Local state for Room Rates Form
  const [rateRows, setRateRows] = useState<any[]>([]);

  // --- HELPER: GROUP LOCATIONS BY COUNTRY ---
  const groupedLocations = useMemo(() => {
    const groups: Record<string, any[]> = {};

    // 1. Group
    locations.forEach((loc) => {
      const countryName = loc.country?.name || "Other";
      if (!groups[countryName]) groups[countryName] = [];
      groups[countryName].push(loc);
    });

    // 2. Sort Countries and Locations inside them
    return Object.keys(groups)
      .sort()
      .map((country) => ({
        country,
        locations: groups[country].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [locations]);

  // --- DERIVED DATA ---
  const processedHotels = useMemo(() => {
    let result = [...initialData];

    // 1. Search
    if (searchQuery) {
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.contactInfo?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 2. Filter by Location
    if (filterLocation !== "all") {
      result = result.filter((h) => h.locationId === filterLocation);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
      if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
      if (sortOrder === "loc-asc")
        return (a.location?.name || "").localeCompare(b.location?.name || "");
      return 0;
    });

    return result;
  }, [initialData, searchQuery, filterLocation, sortOrder]);

  // 4. Pagination Slice
  const totalPages = Math.ceil(processedHotels.length / ITEMS_PER_PAGE);
  const paginatedHotels = processedHotels.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page on filter change
  useMemo(() => setCurrentPage(1), [searchQuery, filterLocation]);

  // --- HANDLERS ---

  function handleCreate() {
    setEditingItem(null);
    setRateRows([
      {
        roomType: "Standard",
        mealPlan: "BB",
        costPrice: 0,
        salesPrice: 0, // 👈 Init Sales Price
        inclusions: "",
      },
    ]);
    setIsModalOpen(true);
  }

  function handleEdit(item: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditingItem(item);
    // Populate rates for the editor
    setRateRows(
      item.rates && item.rates.length > 0
        ? item.rates
        : [
            {
              roomType: "Standard",
              mealPlan: "BB",
              costPrice: 0,
              salesPrice: 0,
              inclusions: "",
            },
          ],
    );
    setIsModalOpen(true);
  }

  function handleDeleteRequest(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setItemToDelete(id);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    const result = await deleteResource(itemToDelete, "hotel");
    if (result?.success) toast.success("Hotel deleted");
    else toast.error(result?.error);
    setItemToDelete(null);
  }

  async function handleDeleteGalleryImage(imageId: string) {
    const result = await deleteResourceImage(imageId, "hotel");
    if (result.success) {
      toast.success("Image removed");
      setEditingItem((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images
            ? prev.images.filter((img: any) => img.id !== imageId)
            : [],
        };
      });
    } else {
      toast.error("Failed to delete image");
    }
  }

  // --- RATE EDITOR HANDLERS ---
  const updateRateRow = (index: number, field: string, value: any) => {
    const newRows = [...rateRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRateRows(newRows);
  };

  const addRateRow = () => {
    setRateRows([
      ...rateRows,
      {
        roomType: "Standard",
        mealPlan: "BB",
        costPrice: 0,
        salesPrice: 0,
        inclusions: "",
      },
    ]);
  };

  const removeRateRow = (index: number) => {
    setRateRows(rateRows.filter((_, i) => i !== index));
  };

  // --- SUBMIT ---
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingItem) formData.append("id", editingItem.id);
    formData.append("rates", JSON.stringify(rateRows));

    const action = editingItem ? updateHotel : createHotel;
    const result = await action(null, formData);

    if (result?.success) {
      toast.success(result.message);
      setIsModalOpen(false);
    } else {
      toast.error(result?.error || "Error saving hotel");
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={16}
            />
            <input
              type="text"
              placeholder="Search hotels..."
              className="input input-bordered input-sm w-full pl-9 bg-base-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Location (Grouped Dropdown) */}
          <div className="relative w-full md:w-48">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={14}
            />
            <select
              className="select select-bordered select-sm w-full pl-9 bg-base-50"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {groupedLocations.map((group) => (
                <optgroup key={group.country} label={group.country}>
                  {group.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative w-full md:w-48">
            <ArrowUpDown
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={14}
            />
            <select
              className="select select-bordered select-sm w-full pl-9 bg-base-50"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="loc-asc">Location (A-Z)</option>
            </select>
          </div>
        </div>

        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={16} /> Add Hotel
        </button>
      </div>

      {/* 2. GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedHotels.map((hotel: any) => {
          const carouselImages = [
            hotel.imageUrl,
            ...(hotel.images?.map((i: any) => i.url) || []),
          ].filter(Boolean);

          return (
            <div
              key={hotel.id}
              onClick={() => setViewingItem(hotel)}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
            >
              <div className="relative h-48">
                <ImageCarousel
                  images={carouselImages}
                  alt={hotel.name}
                  aspectRatio="h-full"
                />

                {/* Badge: Location */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  <MapPin size={10} /> {hotel.location?.name}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => handleEdit(hotel, e)}
                    className="btn btn-xs btn-circle btn-ghost bg-white/90 shadow text-primary"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteRequest(hotel.id, e)}
                    className="btn btn-xs btn-circle btn-ghost bg-white/90 shadow text-error"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold truncate text-base">{hotel.name}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-base-content/60 mb-3">
                  <Phone size={12} /> {hotel.contactInfo || "No contact info"}
                </div>

                {/* Rates Preview */}
                <div className="bg-base-50 rounded-lg p-2 text-xs space-y-1 border border-base-200">
                  {hotel.rates && hotel.rates.length > 0 ? (
                    hotel.rates.slice(0, 2).map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="opacity-70">
                          {r.roomType} ({r.mealPlan})
                        </span>
                        <span className="font-bold text-success">
                          {formatCurrency(r.salesPrice)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="italic opacity-50">No rates added</span>
                  )}
                  {hotel.rates && hotel.rates.length > 2 && (
                    <div className="text-[10px] text-center opacity-40 pt-1">
                      +{hotel.rates.length - 2} more types
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {paginatedHotels.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <Building2 size={48} className="mx-auto mb-4 opacity-20" />
          <p>No hotels found. Change filters or create a new one.</p>
        </div>
      )}

      {/* 3. PAGINATION */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={processedHotels.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* 4. DETAIL VIEW MODAL */}
      {viewingItem && (
        <dialog className="modal modal-open backdrop-blur-md">
          <div className="modal-box w-11/12 max-w-6xl p-0 bg-base-100 shadow-2xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {/* HERO */}
              <div className="relative h-64 w-full shrink-0">
                <div className="absolute inset-0">
                  <ImageCarousel
                    images={[
                      viewingItem.imageUrl,
                      ...(viewingItem.images?.map((i: any) => i.url) || []),
                    ].filter(Boolean)}
                    alt={viewingItem.name}
                    aspectRatio="h-full"
                  />
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="fixed top-6 right-6 btn btn-circle btn-sm bg-black/50 text-white border-none hover:bg-black/70 z-50"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/80 to-transparent p-6 pt-20">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                        <MapPin size={12} /> {viewingItem.location?.name}
                      </div>
                      <h1 className="text-3xl md:text-4xl font-black text-white">
                        {viewingItem.name}
                      </h1>
                      <div className="flex items-center gap-2 text-white/70 text-sm mt-2">
                        <Phone size={14} /> {viewingItem.contactInfo || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Room Rates Table */}
                  <section>
                    <h3 className="font-bold text-sm uppercase text-base-content/40 mb-3 flex items-center gap-2">
                      <DollarSign size={16} /> Room Rates & Plans
                    </h3>
                    <div className="overflow-x-auto border border-base-200 rounded-xl">
                      <table className="table table-sm w-full">
                        <thead className="bg-base-50">
                          <tr>
                            <th>Room Type</th>
                            <th>Plan</th>
                            <th>Inclusions</th>
                            <th className="text-right text-error">
                              Cost (Net)
                            </th>
                            <th className="text-right text-success">
                              Sell (Gross)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingItem.rates?.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-base-50">
                              <td className="font-bold">{r.roomType}</td>
                              <td>
                                <div className="badge badge-sm badge-ghost">
                                  {r.mealPlan}
                                </div>
                              </td>
                              <td
                                className="text-xs max-w-[200px] truncate"
                                title={r.inclusions}
                              >
                                {r.inclusions || "-"}
                              </td>
                              <td className="text-right font-mono text-error/70">
                                {formatCurrency(r.costPrice)}
                              </td>
                              <td className="text-right font-mono text-success font-bold">
                                {formatCurrency(r.salesPrice)}
                              </td>
                            </tr>
                          ))}
                          {(!viewingItem.rates ||
                            viewingItem.rates.length === 0) && (
                            <tr>
                              <td
                                colSpan={5}
                                className="text-center opacity-50 py-4"
                              >
                                No rates configured.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <div className="divider"></div>

                  {/* Gallery */}
                  {viewingItem.images && viewingItem.images.length > 0 && (
                    <section>
                      <h3 className="font-bold text-sm uppercase text-base-content/40 mb-3 flex items-center gap-2">
                        <Camera size={16} /> Gallery
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {viewingItem.images.map((img: any) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-lg overflow-hidden group cursor-zoom-in border border-base-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              alt="Gallery"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn
                                className="text-white drop-shadow-md"
                                size={16}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <div className="bg-base-50 p-4 rounded-xl border border-base-200 sticky top-4">
                    <h4 className="font-bold text-[10px] uppercase text-base-content/40 mb-3 tracking-widest">
                      Manage
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleEdit(viewingItem);
                        }}
                        className="btn btn-sm w-full gap-2 bg-white border-base-200 shadow-sm hover:border-primary hover:text-primary"
                      >
                        <Pencil size={14} /> Edit Hotel
                      </button>
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleDeleteRequest(viewingItem.id);
                        }}
                        className="btn btn-sm w-full gap-2 btn-ghost text-error hover:bg-error/10"
                      >
                        <Trash2 size={14} /> Delete Hotel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* 5. EDIT/CREATE MODAL */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden bg-base-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100">
              <h3 className="font-bold text-lg">
                {editingItem ? "Edit Hotel" : "New Hotel"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <form
              key={editingItem?.id || "new"}
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row h-[75vh]"
            >
              {/* LEFT: INFO & RATES */}
              <div className="md:w-3/5 bg-base-50 p-6 space-y-6 border-r border-base-200 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control col-span-2">
                    <label className="label text-xs font-bold">
                      Hotel Name <span className="text-error">*</span>
                    </label>
                    <input
                      name="name"
                      defaultValue={editingItem?.name}
                      className="input input-bordered w-full input-sm"
                      required
                      placeholder="e.g. Hotel Shanker"
                    />
                  </div>

                  {/* UPDATED LOCATION SELECTOR */}
                  <div className="form-control">
                    <label className="label text-xs font-bold">
                      Location <span className="text-error">*</span>
                    </label>
                    <select
                      name="locationId"
                      defaultValue={editingItem?.locationId || ""}
                      className="select select-bordered w-full select-sm"
                      required
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {groupedLocations.map((group) => (
                        <optgroup key={group.country} label={group.country}>
                          {group.locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-bold">
                      Contact Info
                    </label>
                    <input
                      name="contactInfo"
                      defaultValue={editingItem?.contactInfo}
                      className="input input-bordered w-full input-sm"
                      placeholder="Phone or Email"
                    />
                  </div>
                </div>

                <div className="divider text-xs">ROOM RATES</div>

                {/* Rate Editor */}
                <div className="space-y-3">
                  {rateRows.map((row, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-start bg-white p-2 rounded-lg border border-base-200 shadow-sm"
                    >
                      <div className="grid grid-cols-12 gap-2 flex-1 items-end">
                        {/* Type & Plan */}
                        <div className="col-span-3">
                          <label className="text-[10px] uppercase font-bold text-base-content/50">
                            Type
                          </label>
                          <input
                            className="input input-bordered input-xs w-full"
                            value={row.roomType}
                            onChange={(e) =>
                              updateRateRow(index, "roomType", e.target.value)
                            }
                            placeholder="e.g. Deluxe"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase font-bold text-base-content/50">
                            Plan
                          </label>
                          <select
                            className="select select-bordered select-xs w-full"
                            value={row.mealPlan}
                            onChange={(e) =>
                              updateRateRow(index, "mealPlan", e.target.value)
                            }
                          >
                            <option value="EP">EP</option>
                            <option value="BB">BB</option>
                            <option value="MAP">MAP</option>
                            <option value="AP">AP</option>
                          </select>
                        </div>

                        {/* COST PRICE (Net) */}
                        <div className="col-span-2 relative">
                          <label className="text-[10px] uppercase font-bold text-error">
                            Cost (CP)
                          </label>
                          <input
                            type="number"
                            className="input input-bordered input-xs w-full text-error font-mono"
                            value={row.costPrice}
                            onChange={(e) =>
                              updateRateRow(
                                index,
                                "costPrice",
                                Number(e.target.value),
                              )
                            }
                            required
                          />
                        </div>

                        {/* SALES PRICE (Gross) */}
                        <div className="col-span-2 relative">
                          <label className="text-[10px] uppercase font-bold text-success">
                            Sell (SP)
                          </label>
                          <input
                            type="number"
                            className="input input-bordered input-xs w-full text-success font-bold font-mono"
                            value={row.salesPrice}
                            onChange={(e) =>
                              updateRateRow(
                                index,
                                "salesPrice",
                                Number(e.target.value),
                              )
                            }
                            required
                          />
                        </div>

                        {/* Inclusions */}
                        <div className="col-span-3">
                          <label className="text-[10px] uppercase font-bold text-base-content/50">
                            Inclusions
                          </label>
                          <input
                            className="input input-bordered input-xs w-full"
                            value={row.inclusions || ""}
                            onChange={(e) =>
                              updateRateRow(index, "inclusions", e.target.value)
                            }
                            placeholder="Wifi, AC..."
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRateRow(index)}
                        className="btn btn-xs btn-square btn-ghost text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRateRow}
                    className="btn btn-xs btn-ghost w-full border-dashed border-base-300"
                  >
                    <Plus size={12} /> Add Rate Plan
                  </button>
                </div>
              </div>

              {/* RIGHT: IMAGES */}
              <div className="w-full md:w-2/5 p-6 flex flex-col overflow-hidden">
                <div className="mb-6">
                  <label className="label text-xs font-bold mb-1">
                    Cover Image
                  </label>
                  <div className="h-40 rounded-xl border-2 border-dashed border-base-200 bg-base-100 overflow-hidden">
                    <ImageUpload
                      name="image"
                      defaultValue={editingItem?.imageUrl}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="label text-xs font-bold mb-1 flex items-center gap-2">
                    <Camera size={14} /> Photo Gallery
                  </label>
                  <div className="bg-base-50 rounded-xl border border-base-200 p-4">
                    <MultiImageUpload
                      name="galleryImages"
                      defaultImages={editingItem?.images}
                      onRemoveExisting={handleDeleteGalleryImage}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-base-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-6 gap-2">
                    <Save size={16} /> Save Hotel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* CONFIRMATION */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Hotel?"
        message="This will delete the hotel and all its rates. It may affect existing itineraries."
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
