"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  PartyPopper,
  MapPin,
  X,
  Save,
  Camera,
  ZoomIn,
  AlignLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  ArrowUpDown,
  Filter,
  Coins,
} from "lucide-react";
import {
  createActivity,
  updateActivity,
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

interface ActivityManagerProps {
  initialData: any[];
  locations: any[];
}

export function ActivityManager({
  initialData,
  locations,
}: ActivityManagerProps) {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // FILTER / SORT / PAGINATION
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");

  // --- HELPER: GROUP LOCATIONS BY COUNTRY ---
  const groupedLocations = useMemo(() => {
    const groups: Record<string, any[]> = {};

    // 1. Group by Country Name
    locations.forEach((loc) => {
      const countryName = loc.country?.name || "Other";
      if (!groups[countryName]) groups[countryName] = [];
      groups[countryName].push(loc);
    });

    // 2. Sort Countries and Locations within them
    return Object.keys(groups)
      .sort()
      .map((country) => ({
        country,
        locations: groups[country].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [locations]);

  // --- DERIVED DATA ---
  const processedActivities = useMemo(() => {
    let result = [...initialData];

    // 1. Search
    if (searchQuery) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 2. Filter Location
    if (filterLocation !== "all") {
      result = result.filter((a) => a.locationId === filterLocation);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
      // Sort by Sales Price (Gross)
      if (sortOrder === "price-asc")
        return Number(a.salesPrice) - Number(b.salesPrice);
      if (sortOrder === "price-desc")
        return Number(b.salesPrice) - Number(a.salesPrice);
      return 0;
    });
    return result;
  }, [initialData, searchQuery, filterLocation, sortOrder]);

  // 4. Pagination
  const totalPages = Math.ceil(processedActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = processedActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page on filter change
  useMemo(() => setCurrentPage(1), [searchQuery, filterLocation]);

  // --- HANDLERS ---
  function handleCreate() {
    setEditingItem(null);
    setIsModalOpen(true);
  }

  function handleEdit(item: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditingItem(item);
    setIsModalOpen(true);
  }

  function handleDeleteRequest(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setItemToDelete(id);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    const result = await deleteResource(itemToDelete, "activity");
    if (result?.success) toast.success("Activity deleted");
    else toast.error(result?.error);
    setItemToDelete(null);
  }

  async function handleDeleteGalleryImage(imageId: string) {
    const result = await deleteResourceImage(imageId, "activity");
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingItem) formData.append("id", editingItem.id);

    const action = editingItem ? updateActivity : createActivity;
    const result = await action(null, formData);

    if (result?.success) {
      toast.success(result.message);
      setIsModalOpen(false);
    } else {
      toast.error(result?.error || "Error saving activity");
    }
  }

  // Visual Toolbar for Editor
  const ToolbarBtn = ({ icon: Icon }: { icon: any }) => (
    <button
      type="button"
      className="p-1.5 text-base-content/50 hover:text-primary hover:bg-base-200 rounded transition-colors"
    >
      <Icon size={14} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* 1. TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={16}
            />
            <input
              type="text"
              className="input input-sm h-10 w-full pl-10 bg-base-50"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Location (Grouped) */}
          <div className="relative w-full md:w-48">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={14}
            />
            <select
              className="select select-sm h-10 w-full pl-9 bg-base-50"
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
              className="select select-sm h-10 w-full pl-9 bg-base-50"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="btn btn-primary btn-sm h-10 px-6 gap-2"
        >
          <Plus size={16} /> Add Activity
        </button>
      </div>

      {/* 2. GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedActivities.map((activity: any) => {
          const carouselImages = [
            activity.imageUrl,
            ...(activity.images?.map((i: any) => i.url) || []),
          ].filter(Boolean);
          return (
            <div
              key={activity.id}
              onClick={() => setViewingItem(activity)}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
            >
              <div className="relative h-48">
                <ImageCarousel
                  images={carouselImages}
                  alt={activity.name}
                  aspectRatio="h-full"
                />

                {activity.location && (
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                    <MapPin size={10} /> {activity.location.name}
                  </div>
                )}

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => handleEdit(activity, e)}
                    className="btn btn-xs btn-circle btn-ghost bg-white/90 shadow text-primary"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteRequest(activity.id, e)}
                    className="btn btn-xs btn-circle btn-ghost bg-white/90 shadow text-error"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold truncate text-base">
                    {activity.name}
                  </h3>
                </div>

                {/* Updated Pricing Badge */}
                <div className="text-sm font-mono text-primary font-bold bg-base-50 p-2 rounded-lg border border-base-200 text-center flex justify-center items-center gap-2">
                  <span className="text-success">
                    {formatCurrency(activity.salesPrice)}
                  </span>
                  <span className="text-[10px] opacity-40 line-through font-sans text-base-content">
                    {formatCurrency(activity.costPrice)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {paginatedActivities.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <PartyPopper size={48} className="mx-auto mb-4 opacity-20" />
          <p>No activities found. Try adjusting filters.</p>
        </div>
      )}

      {/* 3. PAGINATION */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={processedActivities.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* 4. DETAIL VIEW MODAL */}
      {viewingItem && (
        <dialog className="modal modal-open backdrop-blur-md">
          <div className="modal-box w-11/12 max-w-5xl p-0 bg-base-100 shadow-2xl h-[90vh] flex flex-col overflow-hidden rounded-2xl">
            <div className="flex-1 overflow-y-auto">
              {/* Hero */}
              <div className="relative h-72 w-full shrink-0">
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
                  className="fixed top-6 right-6 btn btn-circle btn-sm bg-black/50 text-white border-none hover:bg-black/70 z-50 backdrop-blur-sm"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/90 via-black/50 to-transparent p-8 pt-24">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-primary-content/80 text-xs font-bold uppercase tracking-wider mb-2">
                        <PartyPopper size={14} /> Experience
                      </div>
                      <h1 className="text-4xl font-black text-white tracking-tight">
                        {viewingItem.name}
                      </h1>
                      {viewingItem.location && (
                        <div className="flex items-center gap-2 text-white/90 text-sm mt-3 font-medium">
                          <MapPin size={16} /> {viewingItem.location.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  {/* Details Description */}
                  <section>
                    <h3 className="font-bold text-xs uppercase text-base-content/40 mb-4 flex items-center gap-2 tracking-widest">
                      <AlignLeft size={14} /> Activity Details
                    </h3>
                    <div className="prose prose-sm max-w-none text-base-content/80 bg-base-50 p-6 rounded-2xl border border-base-200">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {viewingItem.details ||
                          "No detailed description added for this activity."}
                      </p>
                    </div>
                  </section>

                  {/* Gallery */}
                  {viewingItem.images && viewingItem.images.length > 0 && (
                    <section>
                      <h3 className="font-bold text-xs uppercase text-base-content/40 mb-4 flex items-center gap-2 tracking-widest">
                        <Camera size={14} /> Visual Gallery
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {viewingItem.images.map((img: any) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-xl overflow-hidden group cursor-zoom-in border border-base-200 shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              alt="Gallery"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn
                                className="text-white drop-shadow-md"
                                size={20}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Right: Actions & Pricing */}
                <div>
                  <div className="bg-base-50 p-5 rounded-2xl border border-base-200 sticky top-4 space-y-6">
                    {/* Pricing Box */}
                    <div>
                      <h4 className="font-bold text-[10px] uppercase text-base-content/40 mb-3 tracking-widest flex items-center gap-2">
                        <Coins size={12} /> Pricing
                      </h4>
                      <div className="flex justify-between items-center mb-2 border-b border-base-200 pb-2">
                        <span className="text-xs text-base-content/60">
                          Cost (Net)
                        </span>
                        <span className="font-mono font-bold text-error">
                          {formatCurrency(viewingItem.costPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-base-content/60">
                          Sales (Gross)
                        </span>
                        <span className="font-mono font-bold text-success text-lg">
                          {formatCurrency(viewingItem.salesPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] uppercase text-base-content/40 tracking-widest">
                        Manage
                      </h4>
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleEdit(viewingItem);
                        }}
                        className="btn btn-sm h-10 w-full gap-2 bg-white border-base-200 shadow-sm hover:border-primary hover:text-primary font-medium"
                      >
                        <Pencil size={14} /> Edit Activity
                      </button>
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleDeleteRequest(viewingItem.id);
                        }}
                        className="btn btn-sm h-10 w-full gap-2 btn-ghost text-error hover:bg-error/10 font-medium"
                      >
                        <Trash2 size={14} /> Delete Activity
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* 5. EDIT/CREATE FORM MODAL */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl">
            <div className="px-8 py-5 border-b border-base-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xl text-base-content/80">
                {editingItem ? "Edit Activity" : "New Activity"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost hover:bg-base-200"
              >
                <X size={20} />
              </button>
            </div>

            <form
              key={editingItem?.id || "new"}
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row h-[75vh]"
            >
              {/* LEFT: INFO */}
              <div className="md:w-3/5 bg-white p-8 space-y-6 border-r border-base-200 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Activity Name <span className="text-error">*</span>
                  </label>
                  <input
                    name="name"
                    defaultValue={editingItem?.name}
                    className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                    required
                    placeholder="e.g. Paragliding"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* GROUPED LOCATION DROPDOWN */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                      Location
                    </label>
                    <select
                      name="locationId"
                      defaultValue={editingItem?.locationId || ""}
                      className="select w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                    >
                      <option value="">Select Location...</option>
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
                </div>

                {/* PRICING ROW (UPDATED) */}
                <div className="grid grid-cols-2 gap-6 bg-base-50 p-4 rounded-xl border border-base-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-error uppercase tracking-wide ml-1">
                      Cost Price (Net)
                    </label>
                    <input
                      name="costPrice"
                      type="number"
                      defaultValue={editingItem?.costPrice}
                      className="input w-full h-11 bg-white border-error/30 focus:outline-none focus:border-error focus:text-error text-error font-mono font-bold rounded-xl"
                      placeholder="0.00"
                    />
                    <div className="text-[10px] text-base-content/40 ml-1">
                      Pay to Vendor
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-success uppercase tracking-wide ml-1">
                      Selling Price (Gross)
                    </label>
                    <input
                      name="salesPrice"
                      type="number"
                      defaultValue={editingItem?.salesPrice}
                      className="input w-full h-11 bg-white border-success/30 focus:outline-none focus:border-success focus:text-success text-success font-mono font-bold rounded-xl"
                      placeholder="0.00"
                    />
                    <div className="text-[10px] text-base-content/40 ml-1">
                      Charge to Client
                    </div>
                  </div>
                </div>

                {/* Modern Editor */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Activity Details / Description
                  </label>
                  <div className="border border-base-300 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all bg-base-50">
                    <div className="flex items-center gap-1 p-2 border-b border-base-200 bg-white/50 backdrop-blur-sm">
                      <ToolbarBtn icon={Bold} />
                      <ToolbarBtn icon={Italic} />
                      <ToolbarBtn icon={Underline} />
                      <div className="w-px h-4 bg-base-300 mx-1"></div>
                      <ToolbarBtn icon={List} />
                      <ToolbarBtn icon={ListOrdered} />
                      <div className="w-px h-4 bg-base-300 mx-1"></div>
                      <ToolbarBtn icon={LinkIcon} />
                      <ToolbarBtn icon={Quote} />
                    </div>
                    <textarea
                      name="details"
                      defaultValue={editingItem?.details}
                      className="textarea w-full h-40 resize-none border-none focus:outline-none bg-transparent text-base p-4 leading-relaxed"
                      placeholder="What is included? What should they bring?..."
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: IMAGES */}
              <div className="w-full md:w-2/5 p-8 flex flex-col bg-base-50/50 overflow-y-auto">
                <div className="mb-8">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2 block">
                    Cover Image
                  </label>
                  <div className="h-48 rounded-2xl border border-base-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost hover:bg-base-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-8 gap-2 rounded-xl shadow-lg shadow-primary/20"
                  >
                    <Save size={18} /> Save Activity
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* 6. CONFIRMATION */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Activity?"
        message="This will permanently delete the activity."
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
