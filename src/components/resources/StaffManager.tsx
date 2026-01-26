"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  User,
  Languages,
  X,
  Save,
  Phone,
  Banknote,
  Camera,
  ZoomIn,
  AlignLeft,
  Briefcase,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import {
  createStaff,
  updateStaff,
  deleteStaff,
  deleteStaffImage,
} from "@/actions/staff";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface StaffManagerProps {
  initialData: any[];
}

export function StaffManager({ initialData }: StaffManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // FILTER & PAGINATION
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Get unique roles for filter
  const uniqueRoles = useMemo(
    () => Array.from(new Set(initialData.map((s) => s.role))),
    [initialData],
  );

  // --- PROCESSED DATA ---
  const processedStaff = useMemo(() => {
    let result = [...initialData];

    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.languages?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (filterRole !== "all") {
      result = result.filter((s) => s.role === filterRole);
    }

    result.sort((a, b) => {
      if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
      if (sortOrder === "salary-asc")
        return Number(a.dailySalary) - Number(b.dailySalary);
      if (sortOrder === "salary-desc")
        return Number(b.dailySalary) - Number(a.dailySalary);
      return 0;
    });

    return result;
  }, [initialData, searchQuery, filterRole, sortOrder]);

  const paginatedStaff = processedStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  useMemo(() => setCurrentPage(1), [searchQuery, filterRole]);

  // --- HANDLERS ---
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
    const res = await deleteStaff(itemToDelete);
    if (res.success) toast.success("Staff deleted");
    else toast.error(res.error);
    setItemToDelete(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingItem) formData.append("id", editingItem.id);
    const action = editingItem ? updateStaff : createStaff;
    const res = await action(null, formData);
    if (res?.success) {
      toast.success(res.message);
      setIsModalOpen(false);
    } else toast.error(res?.error);
  }

  async function handleDeleteGalleryImage(imageId: string) {
    const result = await deleteStaffImage(imageId);
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
              placeholder="Search staff..."
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
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
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
              <option value="salary-asc">Salary (Low-High)</option>
              <option value="salary-desc">Salary (High-Low)</option>
            </select>
          </div>
        </div>
        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedStaff.map((staff) => (
          <div
            key={staff.id}
            onClick={() => setViewingItem(staff)}
            className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl cursor-pointer group overflow-hidden"
          >
            <div className="relative h-48">
              <ImageCarousel
                images={[
                  staff.imageUrl,
                  ...(staff.images?.map((i: any) => i.url) || []),
                ].filter(Boolean)}
                alt={staff.name}
                aspectRatio="h-full"
              />
              <div className="absolute top-2 left-2 badge badge-neutral text-xs font-bold shadow-sm">
                {staff.role}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  onClick={(e) => handleEdit(staff, e)}
                  className="btn btn-xs btn-square bg-white shadow hover:bg-primary hover:text-white"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => handleDeleteRequest(staff.id, e)}
                  className="btn btn-xs btn-square bg-white shadow hover:bg-error hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-base truncate">{staff.name}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1 mb-2">
                <Languages size={12} />{" "}
                <span className="truncate">{staff.languages || "N/A"}</span>
              </div>
              <div className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded inline-block">
                {formatCurrency(staff.dailySalary)} / day
              </div>
            </div>
          </div>
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={Math.ceil(processedStaff.length / ITEMS_PER_PAGE)}
        onPageChange={setCurrentPage}
        totalItems={processedStaff.length}
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
                    <Briefcase size={14} /> {viewingItem.role}
                  </div>
                  <h1 className="text-4xl font-black text-white">
                    {viewingItem.name}
                  </h1>
                  <div className="flex gap-4 mt-2 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <Phone size={14} /> {viewingItem.contactInfo || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Languages size={14} /> {viewingItem.languages}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <section>
                    <h3 className="font-bold text-xs uppercase text-base-content/40 mb-3 tracking-widest">
                      Profile
                    </h3>
                    <p className="text-base-content/80 leading-relaxed text-sm whitespace-pre-wrap">
                      {viewingItem.details || "No profile details available."}
                    </p>
                  </section>
                  {viewingItem.images && viewingItem.images.length > 0 && (
                    <section>
                      <h3 className="font-bold text-xs uppercase text-base-content/40 mb-3 tracking-widest">
                        Gallery
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
                      Costing
                    </h4>
                    <div className="text-3xl font-mono font-bold text-primary mb-1">
                      {formatCurrency(viewingItem.dailySalary)}
                    </div>
                    <div className="text-xs text-base-content/50 mb-4">
                      Daily Wage / Allowance
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setViewingItem(null);
                          handleEdit(viewingItem);
                        }}
                        className="btn btn-sm w-full gap-2 bg-white shadow-sm border-base-200"
                      >
                        <Pencil size={14} /> Edit Profile
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
            <div className="px-5 py-5 border-b border-base-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xl">
                {editingItem ? "Edit Staff" : "Add Staff"}
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
              <div className="md:w-3/5 bg-white p-4 space-y-6 border-r border-base-200 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control col-span-2">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Full Name *
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
                      Role *
                    </label>
                    <select
                      name="role"
                      defaultValue={editingItem?.role || "Guide"}
                      className="select w-full h-11 bg-base-50 border-base-300 rounded-xl"
                    >
                      <option value="Senior Guide">Senior Guide</option>
                      <option value="Assistant Guide">Assistant Guide</option>
                      <option value="Driver">Driver</option>
                      <option value="Porter">Porter</option>
                      <option value="Tour Leader">Tour Leader</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Daily Salary (NPR)
                    </label>
                    <input
                      name="dailySalary"
                      type="number"
                      defaultValue={editingItem?.dailySalary}
                      className="input w-full h-11 bg-base-50 border-base-300 rounded-xl"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Contact Info
                    </label>
                    <input
                      name="contactInfo"
                      defaultValue={editingItem?.contactInfo}
                      className="input w-full h-11 bg-base-50 border-base-300 rounded-xl"
                    />
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                      Languages
                    </label>
                    <input
                      name="languages"
                      defaultValue={editingItem?.languages}
                      className="input w-full h-11 bg-base-50 border-base-300 rounded-xl"
                      placeholder="English, French..."
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label className="text-xs font-bold text-base-content/50 uppercase ml-1">
                    Profile Details
                  </label>
                  <textarea
                    name="details"
                    defaultValue={editingItem?.details}
                    className="textarea w-full h-32 bg-base-50 border-base-300 rounded-xl leading-relaxed"
                    placeholder="Experience, certifications, bio..."
                  />
                </div>
              </div>
              <div className="md:w-2/5 px-4 py-2 flex flex-col bg-base-50/50 overflow-y-auto">
                <div className="mb-2">
                  <label className="text-xs font-bold text-base-content/50 uppercase mb-2 block">
                    Profile Photo
                  </label>
                  <div className="h-38 rounded-2xl border border-base-200 bg-white shadow-sm overflow-hidden">
                    <ImageUpload
                      name="image"
                      defaultValue={editingItem?.imageUrl}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-base-content/50 uppercase mb-2 block">
                    Documents / Gallery
                  </label>
                  <div className="bg-white rounded-2xl border border-base-200 p-5 shadow-sm">
                    <MultiImageUpload
                      name="galleryImages"
                      defaultImages={editingItem?.images}
                      onRemoveExisting={handleDeleteGalleryImage}
                    />
                  </div>
                </div>
                <div className="mt-2 pt-4 border-t border-base-200 flex justify-end gap-3">
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
        title="Delete Staff?"
        message="Permanently remove this staff member?"
        isDanger
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
