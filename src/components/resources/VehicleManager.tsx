"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Car,
  X,
  Save,
  User,
  Phone,
  Coins,
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
} from "lucide-react";
import {
  createVehicle,
  updateVehicle,
  deleteResource,
  deleteResourceImage,
} from "@/actions/resources";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface VehicleManagerProps {
  initialData: any[];
}

export function VehicleManager({ initialData }: VehicleManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- FILTER ---
  const filteredVehicles = useMemo(() => {
    return initialData.filter(
      (v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driverName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [initialData, searchQuery]);

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
    const result = await deleteResource(itemToDelete, "vehicle");
    if (result?.success) toast.success("Vehicle deleted");
    else toast.error(result?.error);
    setItemToDelete(null);
  }

  async function handleDeleteGalleryImage(imageId: string) {
    const result = await deleteResourceImage(imageId, "vehicle");
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

    const action = editingItem ? updateVehicle : createVehicle;
    const result = await action(null, formData);

    if (result?.success) {
      toast.success(result.message);
      setIsModalOpen(false);
    } else {
      toast.error(result?.error || "Error saving vehicle");
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
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
            size={16}
          />
          <input
            type="text"
            placeholder="Search vehicles..."
            className="input input-sm h-10 w-full pl-10 bg-base-50 border-base-300 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary btn-sm h-10 px-6 gap-2 rounded-lg shadow-primary/20 shadow-lg"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVehicles.map((vehicle: any) => {
          const carouselImages = [
            vehicle.imageUrl,
            ...(vehicle.images?.map((i: any) => i.url) || []),
          ].filter(Boolean);
          return (
            <div
              key={vehicle.id}
              onClick={() => setViewingItem(vehicle)}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group overflow-hidden cursor-pointer"
            >
              <div className="relative h-48">
                <ImageCarousel
                  images={carouselImages}
                  alt={vehicle.name}
                  aspectRatio="h-full"
                />

                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-base-content text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
                  {vehicle.type}
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => handleEdit(vehicle, e)}
                    className="btn btn-xs btn-square bg-white text-base-content shadow-md border-none hover:bg-primary hover:text-white"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteRequest(vehicle.id, e)}
                    className="btn btn-xs btn-square bg-white text-error shadow-md border-none hover:bg-error hover:text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold truncate text-base text-base-content/90">
                    {vehicle.name}
                  </h3>
                  <span className="text-xs font-mono bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">
                    {vehicle.plateNumber || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-base-content/60 mb-3">
                  <User size={12} /> {vehicle.driverName || "Unassigned"}
                </div>

                {/* Grid showing Sales Price */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-base-50 p-2 rounded-lg border border-base-200">
                  <div>
                    <span className="block opacity-50">Day (Sell)</span>
                    <span className="font-bold text-success">
                      {formatCurrency(vehicle.salesPerDay)}
                    </span>
                  </div>
                  <div>
                    <span className="block opacity-50">Km (Sell)</span>
                    <span className="font-bold text-success">
                      {formatCurrency(vehicle.salesPerKm)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL VIEW MODAL */}
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
                        <Car size={14} /> {viewingItem.type}
                      </div>
                      <h1 className="text-4xl font-black text-white tracking-tight">
                        {viewingItem.name}
                      </h1>
                      <div className="flex gap-6 mt-3">
                        <span className="flex items-center gap-2 text-white/90 text-sm font-medium">
                          <User size={16} /> {viewingItem.driverName}
                        </span>
                        <span className="flex items-center gap-2 text-white/90 text-sm font-medium">
                          <Phone size={16} />{" "}
                          {viewingItem.contactNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-mono text-white font-bold tracking-tight bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-2xl">
                      {viewingItem.plateNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left */}
                <div className="lg:col-span-2 space-y-10">
                  {/* Description / Details */}
                  <section>
                    <h3 className="font-bold text-xs uppercase text-base-content/40 mb-4 flex items-center gap-2 tracking-widest">
                      <AlignLeft size={14} /> Vehicle Details
                    </h3>
                    <div className="prose prose-sm max-w-none text-base-content/80 bg-base-50 p-6 rounded-2xl border border-base-200">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {viewingItem.details ||
                          "No specific details provided for this vehicle."}
                      </p>
                    </div>
                  </section>

                  {/* Pricing Table (Cost vs Sales) */}
                  <section>
                    <h3 className="font-bold text-xs uppercase text-base-content/40 mb-4 flex items-center gap-2 tracking-widest">
                      <Coins size={14} /> Pricing Structure (NPR)
                    </h3>
                    <div className="overflow-x-auto border border-base-200 rounded-2xl shadow-sm">
                      <table className="table w-full">
                        <thead className="bg-base-50 text-xs uppercase text-base-content/50">
                          <tr>
                            <th>Rate Type</th>
                            <th className="text-right text-error">
                              Cost (Net)
                            </th>
                            <th className="text-right text-success">
                              Sell (Gross)
                            </th>
                            <th className="text-right">Allowance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-base-50">
                            <td className="font-bold">Daily Rate</td>
                            <td className="text-right font-mono opacity-80">
                              {formatCurrency(viewingItem.costPerDay)}
                            </td>
                            <td className="text-right font-mono font-bold text-success">
                              {formatCurrency(viewingItem.salesPerDay)}
                            </td>
                            <td className="text-right font-mono text-xs opacity-50">
                              -
                            </td>
                          </tr>
                          <tr className="hover:bg-base-50">
                            <td className="font-bold">Per Kilometer</td>
                            <td className="text-right font-mono opacity-80">
                              {formatCurrency(viewingItem.costPerKm)}
                            </td>
                            <td className="text-right font-mono font-bold text-success">
                              {formatCurrency(viewingItem.salesPerKm)}
                            </td>
                            <td className="text-right font-mono text-xs opacity-50">
                              -
                            </td>
                          </tr>
                          <tr className="hover:bg-base-50">
                            <td className="font-bold">Driver Allowance</td>
                            <td className="text-right font-mono text-xs opacity-50">
                              -
                            </td>
                            <td className="text-right font-mono text-xs opacity-50">
                              -
                            </td>
                            <td className="text-right font-mono font-bold">
                              {formatCurrency(viewingItem.driverAllowance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Gallery */}
                  {viewingItem.images && viewingItem.images.length > 0 && (
                    <section>
                      <h3 className="font-bold text-xs uppercase text-base-content/40 mb-4 flex items-center gap-2 tracking-widest">
                        <Camera size={14} /> Vehicle Gallery
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

                {/* Right: Actions */}
                <div>
                  <div className="bg-base-50 p-5 rounded-2xl border border-base-200 sticky top-4 space-y-4">
                    <h4 className="font-bold text-[10px] uppercase text-base-content/40 tracking-widest">
                      Quick Actions
                    </h4>
                    <button
                      onClick={() => {
                        setViewingItem(null);
                        handleEdit(viewingItem);
                      }}
                      className="btn btn-sm h-10 w-full gap-2 bg-white border-base-200 shadow-sm hover:border-primary hover:text-primary font-medium"
                    >
                      <Pencil size={14} /> Edit Vehicle
                    </button>
                    <button
                      onClick={() => {
                        setViewingItem(null);
                        handleDeleteRequest(viewingItem.id);
                      }}
                      className="btn btn-sm h-10 w-full gap-2 btn-ghost text-error hover:bg-error/10 font-medium"
                    >
                      <Trash2 size={14} /> Delete Vehicle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* EDIT/CREATE MODAL */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl">
            <div className="px-8 py-5 border-b border-base-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xl text-base-content/80">
                {editingItem ? "Edit Vehicle" : "New Vehicle"}
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
                    Vehicle Name <span className="text-error">*</span>
                  </label>
                  <input
                    name="name"
                    defaultValue={editingItem?.name}
                    className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                    required
                    placeholder="e.g. Mahindra Scorpio"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                      Type
                    </label>
                    <select
                      name="type"
                      defaultValue={editingItem?.type || "SUV"}
                      className="select w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                    >
                      <option value="SUV">SUV</option>
                      <option value="Bus">Bus</option>
                      <option value="Van">Van</option>
                      <option value="Car">Car</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                      Plate Number
                    </label>
                    <input
                      name="plateNumber"
                      defaultValue={editingItem?.plateNumber}
                      className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                      placeholder="Ba 12 Cha..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                      Driver Name
                    </label>
                    <input
                      name="driverName"
                      defaultValue={editingItem?.driverName}
                      className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                      Contact Number
                    </label>
                    <input
                      name="contactNumber"
                      defaultValue={editingItem?.contactNumber}
                      className="input w-full h-11 bg-base-50 border-base-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="divider text-xs font-bold text-base-content/40 tracking-widest uppercase">
                  Pricing (NPR)
                </div>

                {/* DAILY RATES */}
                <div className="grid grid-cols-2 gap-4 mb-4 bg-base-50 p-3 rounded-xl border border-base-200">
                  <div className="form-control">
                    <label className="text-xs font-bold text-error uppercase">
                      Cost / Day (Net)
                    </label>
                    <input
                      name="costPerDay"
                      type="number"
                      defaultValue={editingItem?.costPerDay}
                      className="input input-sm border-error/30 focus:border-error text-error font-mono"
                    />
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-success uppercase">
                      Sell / Day (Gross)
                    </label>
                    <input
                      name="salesPerDay"
                      type="number"
                      defaultValue={editingItem?.salesPerDay}
                      className="input input-sm border-success/30 focus:border-success text-success font-mono font-bold"
                    />
                  </div>
                </div>

                {/* KM RATES */}
                <div className="grid grid-cols-2 gap-4 mb-4 bg-base-50 p-3 rounded-xl border border-base-200">
                  <div className="form-control">
                    <label className="text-xs font-bold text-error uppercase">
                      Cost / Km
                    </label>
                    <input
                      name="costPerKm"
                      type="number"
                      defaultValue={editingItem?.costPerKm}
                      className="input input-sm border-error/30 focus:border-error text-error font-mono"
                    />
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-success uppercase">
                      Sell / Km
                    </label>
                    <input
                      name="salesPerKm"
                      type="number"
                      defaultValue={editingItem?.salesPerKm}
                      className="input input-sm border-success/30 focus:border-success text-success font-mono font-bold"
                    />
                  </div>
                </div>

                {/* ALLOWANCE */}
                <div className="form-control">
                  <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                    Driver Allowance (Cost)
                  </label>
                  <input
                    name="driverAllowance"
                    type="number"
                    defaultValue={editingItem?.driverAllowance}
                    className="input w-full input-sm"
                  />
                  <span className="text-[10px] text-base-content/40 ml-1">
                    Usually a direct cost (no markup)
                  </span>
                </div>

                {/* Modern Editor for Details */}
                <div className="space-y-1 pt-4">
                  <label className="text-xs font-bold text-base-content/50 uppercase tracking-wide ml-1">
                    Vehicle Details / Notes
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
                      className="textarea w-full h-32 resize-none border-none focus:outline-none bg-transparent text-base p-4 leading-relaxed"
                      placeholder="Condition, facilities (AC, Music), seating capacity..."
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: IMAGES */}
              <div className="w-full md:w-2/5 px-8 py-4 flex flex-col bg-base-50/50 overflow-hidden">
                <div className="mb-2">
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
                  <div className="bg-white rounded-2xl border border-base-200 pb-4 shadow-sm">
                    <MultiImageUpload
                      name="galleryImages"
                      defaultImages={editingItem?.images}
                      onRemoveExisting={handleDeleteGalleryImage}
                    />
                  </div>
                </div>
                <div className="mt-2 pt-6 border-t border-base-200 flex justify-end gap-3">
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
                    <Save size={18} /> Save Vehicle
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
        title="Delete Vehicle?"
        message="This will remove the vehicle from your fleet."
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
