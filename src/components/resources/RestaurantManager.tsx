"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  UtensilsCrossed,
  MapPin,
  X,
  Save,
  Phone,
  Camera,
  ZoomIn,
  AlignLeft,
  ArrowUpDown,
  Filter,
  DollarSign,
} from "lucide-react";
// 👈 FIXED IMPORT: Pointing to the separated actions file
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  deleteRestaurantImage,
} from "@/actions/restaurants";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface RestaurantManagerProps {
  initialData: any[];
  locations: any[];
}

export function RestaurantManager({
  initialData,
  locations,
}: RestaurantManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // FILTER & SORT
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // HELPER: Group Locations
  const groupedLocations = useMemo(() => {
    const groups: Record<string, any[]> = {};
    locations.forEach((loc) => {
      const countryName = loc.country?.name || "Other";
      if (!groups[countryName]) groups[countryName] = [];
      groups[countryName].push(loc);
    });
    return Object.keys(groups)
      .sort()
      .map((country) => ({
        country,
        locations: groups[country].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [locations]);

  // PROCESSED DATA
  const processedRestaurants = useMemo(() => {
    let result = [...initialData];

    if (searchQuery)
      result = result.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    if (filterLocation !== "all")
      result = result.filter((r) => r.locationId === filterLocation);

    result.sort((a, b) => {
      if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
      if (sortOrder === "price-asc")
        return Number(a.salesPrice) - Number(b.salesPrice);
      if (sortOrder === "price-desc")
        return Number(b.salesPrice) - Number(a.salesPrice);
      return 0;
    });
    return result;
  }, [initialData, searchQuery, filterLocation, sortOrder]);

  const paginatedRestaurants = processedRestaurants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  useMemo(() => setCurrentPage(1), [searchQuery, filterLocation]);

  // HANDLERS
  const handleEdit = (item: any, e?: any) => {
    e?.stopPropagation();
    setEditingItem(item);
    setIsModalOpen(true);
  };
  const handleDeleteRequest = (id: string, e?: any) => {
    e?.stopPropagation();
    setItemToDelete(id);
  };
  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  async function confirmDelete() {
    if (!itemToDelete) return;
    const res = await deleteRestaurant(itemToDelete);
    if (res.success) toast.success("Restaurant deleted");
    setItemToDelete(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingItem) formData.append("id", editingItem.id);
    const action = editingItem ? updateRestaurant : createRestaurant;
    const res = await action(null, formData);
    if (res?.success) {
      toast.success(res.message);
      setIsModalOpen(false);
    } else toast.error(res?.error);
  }

  async function handleDeleteGalleryImage(imageId: string) {
    const result = await deleteRestaurantImage(imageId);
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

  return (
    <div className="space-y-8">
      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={16}
            />
            <input
              className="input input-sm w-full pl-9 bg-base-50"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-48">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={14}
            />
            <select
              className="select select-sm w-full pl-9 bg-base-50"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {groupedLocations.map((g) => (
                <optgroup key={g.country} label={g.country}>
                  {g.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-48">
            <ArrowUpDown
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={14}
            />
            <select
              className="select select-sm w-full pl-9 bg-base-50"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
            </select>
          </div>
        </div>
        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedRestaurants.map((rest) => (
          <div
            key={rest.id}
            onClick={() => setViewingItem(rest)}
            className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl cursor-pointer group overflow-hidden"
          >
            <div className="relative h-48">
              <ImageCarousel
                images={[
                  rest.imageUrl,
                  ...(rest.images?.map((i: any) => i.url) || []),
                ].filter(Boolean)}
                alt={rest.name}
                aspectRatio="h-full"
              />
              {rest.location && (
                <div className="absolute top-2 left-2 badge badge-neutral text-xs font-bold shadow-sm flex items-center gap-1">
                  <MapPin size={10} /> {rest.location.name}
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  onClick={(e) => handleEdit(rest, e)}
                  className="btn btn-xs btn-square bg-white shadow hover:bg-primary hover:text-white"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => handleDeleteRequest(rest.id, e)}
                  className="btn btn-xs btn-square bg-white shadow hover:bg-error hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-base truncate">{rest.name}</h3>
              <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1 mb-2">
                <UtensilsCrossed size={12} />{" "}
                <span className="truncate">
                  {rest.cuisine || "Multi-cuisine"}
                </span>
              </div>

              {/* Pricing Badge */}
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">
                  {formatCurrency(rest.salesPrice)}
                </div>
                <div className="text-[10px] text-base-content/40 line-through">
                  {formatCurrency(rest.costPrice)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={Math.ceil(processedRestaurants.length / ITEMS_PER_PAGE)}
        onPageChange={setCurrentPage}
        totalItems={processedRestaurants.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* VIEW MODAL */}
      {viewingItem && (
        <dialog className="modal modal-open backdrop-blur-md">
          <div className="modal-box w-11/12 max-w-4xl p-0 bg-base-100 shadow-2xl h-[85vh] flex flex-col overflow-hidden rounded-2xl">
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-64 w-full shrink-0">
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
                    <UtensilsCrossed size={14} />{" "}
                    {viewingItem.cuisine || "Restaurant"}
                  </div>
                  <h1 className="text-4xl font-black text-white">
                    {viewingItem.name}
                  </h1>
                  <div className="flex gap-4 mt-2 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {viewingItem.location?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={14} /> {viewingItem.contactInfo || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <section>
                    <h3 className="font-bold text-xs uppercase text-base-content/40 mb-3 tracking-widest flex items-center gap-2">
                      <AlignLeft size={14} /> Details
                    </h3>
                    <p className="text-base-content/80 leading-relaxed text-sm whitespace-pre-wrap">
                      {viewingItem.details || "No details available."}
                    </p>
                  </section>
                  {viewingItem.images && viewingItem.images.length > 0 && (
                    <section>
                      <h3 className="font-bold text-xs uppercase text-base-content/40 mb-3 tracking-widest flex items-center gap-2">
                        <Camera size={14} /> Gallery
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {viewingItem.images.map((img: any) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-lg overflow-hidden border border-base-200"
                          >
                            <img
                              src={img.url}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
                <div>
                  <div className="bg-base-50 p-5 rounded-2xl border border-base-200 sticky top-4">
                    <h4 className="font-bold text-[10px] uppercase text-base-content/40 mb-3 tracking-widest">
                      Pricing (Per Meal)
                    </h4>

                    <div className="flex justify-between items-center mb-2 border-b border-base-200 pb-2">
                      <span className="text-xs text-base-content/60">
                        Cost (Net)
                      </span>
                      <span className="font-mono font-bold text-error">
                        {formatCurrency(viewingItem.costPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-base-content/60">
                        Sales (Gross)
                      </span>
                      <span className="font-mono font-bold text-success text-lg">
                        {formatCurrency(viewingItem.salesPrice)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleEdit(viewingItem);
                        }}
                        className="btn btn-sm w-full gap-2 bg-white shadow-sm border-base-200"
                      >
                        <Pencil size={14} /> Edit Info
                      </button>
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleDeleteRequest(viewingItem.id);
                        }}
                        className="btn btn-sm w-full gap-2 btn-ghost text-error"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* EDIT FORM */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl">
            <div className="px-8 py-5 border-b border-base-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xl">
                {editingItem ? "Edit Restaurant" : "Add Restaurant"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row h-[70vh]"
            >
              <div className="md:w-3/5 bg-white p-8 space-y-6 border-r border-base-200 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control col-span-2">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Restaurant Name *
                    </label>
                    <input
                      name="name"
                      defaultValue={editingItem?.name}
                      className="input w-full h-11 bg-base-50 border-base-300 rounded-xl"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Location *
                    </label>
                    <select
                      name="locationId"
                      defaultValue={editingItem?.locationId || ""}
                      className="select w-full h-11 bg-base-50 border-base-300 rounded-xl"
                      required
                    >
                      <option value="">Select Location...</option>
                      {groupedLocations.map((g) => (
                        <optgroup key={g.country} label={g.country}>
                          {g.locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Cuisine Type
                    </label>
                    <input
                      name="cuisine"
                      defaultValue={editingItem?.cuisine}
                      className="input w-full h-11 bg-base-50 border-base-300 rounded-xl"
                      placeholder="e.g. Thakali, Indian..."
                    />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Contact Info
                    </label>
                    <input
                      name="contactInfo"
                      defaultValue={editingItem?.contactInfo}
                      className="input w-full h-11 bg-base-50 border-base-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="divider text-xs font-bold text-base-content/40 tracking-widest uppercase">
                  Pricing (Avg Per Meal)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="text-xs font-bold text-error uppercase ml-1">
                      Cost Price (Net)
                    </label>
                    <input
                      name="costPrice"
                      type="number"
                      defaultValue={editingItem?.costPrice}
                      className="input w-full h-11 bg-base-50 border-error/30 focus:border-error text-error font-mono font-bold"
                      required
                    />
                    <span className="text-[10px] text-base-content/50 mt-1 ml-1">
                      Pay to Restaurant
                    </span>
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-success uppercase ml-1">
                      Selling Price (Gross)
                    </label>
                    <input
                      name="salesPrice"
                      type="number"
                      defaultValue={editingItem?.salesPrice}
                      className="input w-full h-11 bg-base-50 border-success/30 focus:border-success text-success font-mono font-bold"
                      required
                    />
                    <span className="text-[10px] text-base-content/50 mt-1 ml-1">
                      Charge to Client
                    </span>
                  </div>
                </div>

                <div className="form-control mt-4">
                  <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                    Details / Specialties
                  </label>
                  <textarea
                    name="details"
                    defaultValue={editingItem?.details}
                    className="textarea w-full h-32 bg-base-50 border-base-300 rounded-xl leading-relaxed"
                    placeholder="Famous dishes, ambiance..."
                  />
                </div>
              </div>
              <div className="md:w-2/5 p-8 flex flex-col bg-base-50/50 overflow-y-auto">
                <div className="mb-6">
                  <label className="text-xs font-bold text-base-content/50 uppercase mb-2 block">
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
                  <label className="text-xs font-bold text-base-content/50 uppercase mb-2 block">
                    Gallery
                  </label>
                  <div className="bg-white rounded-2xl border border-base-200 p-5 shadow-sm">
                    <MultiImageUpload
                      name="galleryImages"
                      defaultImages={editingItem?.images}
                      onRemoveExisting={handleDeleteGalleryImage}
                    />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-base-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-8 rounded-xl"
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
        title="Delete Restaurant?"
        message="This will remove the restaurant from your list."
        isDanger
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
