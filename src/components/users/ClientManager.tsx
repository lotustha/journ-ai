"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  User,
  Phone,
  Globe,
  FileText,
  Heart,
  Shield,
  X,
  Save,
  Mail,
  MapPin,
  Calendar,
  MoreHorizontal,
  Eye,
  UploadCloud,
  Paperclip,
  ExternalLink,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  createClient,
  updateClient,
  deleteClient,
  uploadClientDocument,
  deleteClientDocument,
} from "@/actions/clients";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

interface ClientManagerProps {
  initialData: any[];
}

export function ClientManager({ initialData = [] }: ClientManagerProps) {
  const router = useRouter();

  // STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">(
    "view",
  );
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "identity" | "docs" | "safety" | "files"
  >("identity");

  // FILTERS & PAGINATION STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Doc Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // --- DERIVED LIST ---

  // 1. Get Unique Countries
  const uniqueCountries = useMemo(() => {
    if (!initialData) return ["All"];
    const countries = new Set(
      initialData.map((c) => c.clientProfile?.nationality).filter(Boolean),
    );
    return ["All", ...Array.from(countries).sort()];
  }, [initialData]);

  // 2. Filter & Search
  const filteredClients = useMemo(() => {
    let result = initialData ? [...initialData] : [];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.name?.toLowerCase().includes(q) ||
          client.email?.toLowerCase().includes(q) ||
          client.clientProfile?.phone?.includes(q),
      );
    }

    // Filter Country
    if (filterCountry !== "All") {
      result = result.filter(
        (c) => c.clientProfile?.nationality === filterCountry,
      );
    }

    // Sort by Newest
    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [initialData, searchQuery, filterCountry]);

  // 3. Paginate
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // --- DROPZONE ---
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      toast.error("File too large or invalid type. Max 10MB.");
      return;
    }
    if (acceptedFiles?.length > 0) {
      setFileToUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  // --- ACTIONS HANDLERS ---
  const handleOpenView = (client: any) => {
    setSelectedClient(client);
    setModalMode("view");
    setActiveTab("identity");
    setIsModalOpen(true);
    setFileToUpload(null);
  };

  const handleOpenEdit = (client: any) => {
    setSelectedClient(client);
    setModalMode("edit");
    setActiveTab("identity");
    setIsModalOpen(true);
    setFileToUpload(null);
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setModalMode("create");
    setActiveTab("identity");
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const res = await deleteClient(itemToDelete);
    if (res.success) {
      toast.success("Client deleted");
      router.refresh();
    } else toast.error(res.error);
    setItemToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (modalMode === "edit" && selectedClient)
      formData.append("id", selectedClient.id);

    const action = modalMode === "edit" ? updateClient : createClient;
    try {
      const res = await action(null, formData);
      if (res?.success) {
        toast.success(res.message);
        setIsModalOpen(false);

        // 🚀 FIX: Reset pagination so new/updated user is visible at the top
        setCurrentPage(1);
        setFilterCountry("All");
        setSearchQuery("");

        router.refresh();
      } else {
        toast.error(res?.error || "Error saving client");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleDocUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient || !fileToUpload) return;
    setIsUploadingDoc(true);

    const formData = new FormData(e.currentTarget);
    formData.append("clientId", selectedClient.id);
    formData.append("file", fileToUpload);

    try {
      const res = await uploadClientDocument(formData);
      if (res.success) {
        toast.success("Document uploaded");

        // Optimistic UI Update
        const newDocMock = {
          id: Math.random().toString(),
          name: fileToUpload.name,
          type: formData.get("type"),
          url: URL.createObjectURL(fileToUpload),
          isTemp: true,
        };

        const updatedDocs = [
          ...(selectedClient.clientProfile?.documents || []),
          newDocMock,
        ];

        setSelectedClient((prev: any) => ({
          ...prev,
          clientProfile: {
            ...prev.clientProfile,
            documents: updatedDocs,
          },
        }));

        setFileToUpload(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (error: any) {
      if (error.message?.includes("Body exceeded")) {
        toast.error("File is too large. Max 10MB.");
      } else {
        toast.error("Upload failed.");
      }
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    // Optimistic Update
    const previousDocs = selectedClient.clientProfile?.documents || [];
    const updatedDocs = previousDocs.filter((d: any) => d.id !== docId);

    setSelectedClient((prev: any) => ({
      ...prev,
      clientProfile: {
        ...prev.clientProfile,
        documents: updatedDocs,
      },
    }));

    const res = await deleteClientDocument(docId);
    if (res.success) {
      toast.success("Document removed");
      router.refresh();
    } else {
      toast.error("Failed to remove");
      // Revert on failure
      setSelectedClient((prev: any) => ({
        ...prev,
        clientProfile: { ...prev.clientProfile, documents: previousDocs },
      }));
    }
  };

  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const Label = ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <label className="label py-1">
      <span className="label-text text-xs font-bold text-base-content/60 uppercase tracking-wide">
        {children} {required && <span className="text-error">*</span>}
      </span>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={16}
            />
            <input
              className="input input-sm w-full pl-9 bg-base-50 focus:bg-white transition-colors border-base-200"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
            />
          </div>

          {/* Country Filter */}
          <div className="relative w-full md:w-48">
            <Globe
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              size={14}
            />
            <select
              className="select select-sm w-full pl-9 bg-base-50 border-base-200 focus:bg-white"
              value={filterCountry}
              onChange={(e) => {
                setFilterCountry(e.target.value);
                setCurrentPage(1);
              }}
            >
              {uniqueCountries.map((c: any) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Countries" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary btn-sm gap-2 px-6 rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-base-100 border border-base-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-50 text-base-content/50 uppercase text-xs font-bold border-b border-base-200">
                <th className="py-4 pl-6">Client Name</th>
                <th>Contact</th>
                <th>Nationality</th>
                <th>Status</th>
                <th className="pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 opacity-50">
                    No clients found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-base-50 transition-colors border-b border-base-100 last:border-none group cursor-pointer"
                    onClick={() => handleOpenView(client)}
                  >
                    {/* Name & Avatar */}
                    <td className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="w-10 h-10 rounded-full bg-base-200 text-base-content/60 ring-1 ring-base-300">
                            {client.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={client.image} alt={client.name} />
                            ) : (
                              <span className="text-sm font-bold">
                                {client.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-base-content">
                            {client.name}
                          </div>
                          <div className="text-xs text-base-content/50 flex items-center gap-1">
                            Created{" "}
                            {new Date(client.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-xs font-medium">
                          <Mail size={12} className="opacity-50" />{" "}
                          {client.email}
                        </span>
                        {client.clientProfile?.phone && (
                          <span className="flex items-center gap-2 text-xs opacity-70">
                            <Phone size={12} className="opacity-50" />{" "}
                            {client.clientProfile.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nationality */}
                    <td>
                      {client.clientProfile?.nationality ? (
                        <div className="badge badge-sm badge-ghost gap-1">
                          <Globe size={10} className="opacity-50" />
                          {client.clientProfile.nationality}
                        </div>
                      ) : (
                        <span className="text-xs opacity-30 italic">-</span>
                      )}
                    </td>

                    {/* Status / Documents */}
                    <td>
                      {client.clientProfile?.passportNumber ? (
                        <div className="badge badge-xs badge-success gap-1 bg-success/10 text-success border-none py-2 px-2">
                          <Shield size={10} /> Verified
                        </div>
                      ) : (
                        <div className="badge badge-xs badge-warning gap-1 bg-warning/10 text-warning border-none py-2 px-2">
                          Missing Docs
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="pr-6 text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenView(client)}
                          className="btn btn-square btn-xs btn-ghost text-base-content/60 tooltip"
                          data-tip="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="btn btn-square btn-xs btn-ghost text-primary tooltip"
                          data-tip="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setItemToDelete(client.id)}
                          className="btn btn-square btn-xs btn-ghost text-error tooltip"
                          data-tip="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-base-200 flex justify-between items-center bg-base-50/50">
          <span className="text-xs text-base-content/50">
            Showing{" "}
            {paginatedClients.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of{" "}
            {filteredClients.length} clients
          </span>

          <div className="join">
            <button
              className="join-item btn btn-xs btn-ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <button className="join-item btn btn-xs btn-ghost pointer-events-none">
              Page {currentPage} of {totalPages || 1}
            </button>
            <button
              className="join-item btn btn-xs btn-ghost"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-md">
          <div className="modal-box w-11/12 max-w-5xl p-0 bg-base-100 shadow-2xl h-[90vh] flex flex-col overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-50/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    modalMode === "view"
                      ? "bg-base-200 text-base-content"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-base-content leading-tight">
                    {modalMode === "create" && "Register New Client"}
                    {modalMode === "edit" && "Edit Client Profile"}
                    {modalMode === "view" && selectedClient?.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {modalMode === "view" && (
                  <button
                    onClick={() => setModalMode("edit")}
                    className="btn btn-sm btn-ghost gap-2 border border-base-200"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-circle btn-ghost hover:bg-base-200 text-base-content/60"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* FORM WRAPPER */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-base-100 relative">
                {/* SIDEBAR NAVIGATION */}
                <div className="w-full md:w-64 bg-base-50 border-r border-base-200 p-4 space-y-1 overflow-y-auto shrink-0">
                  {[
                    { id: "identity", label: "Identity & Contact", icon: User },
                    { id: "docs", label: "Passport & Docs", icon: FileText },
                    { id: "safety", label: "Health & Safety", icon: Heart },
                    {
                      id: "files",
                      label: "Documents / Uploads",
                      icon: Paperclip,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
                        activeTab === tab.id
                          ? "bg-white shadow-sm ring-1 ring-base-200 text-primary"
                          : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                      }`}
                    >
                      <tab.icon size={16} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 p-8 overflow-y-auto relative bg-base-100">
                  {/* FILE UPLOAD TAB */}
                  {activeTab === "files" ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-3xl mx-auto">
                      {selectedClient ? (
                        <div className="card border-2 border-dashed border-base-300 bg-base-50/50 p-6">
                          <h3 className="font-bold text-sm uppercase text-base-content/50 mb-4 flex items-center gap-2">
                            <UploadCloud size={16} /> Upload New Document
                          </h3>
                          <form
                            onSubmit={handleDocUpload}
                            className="space-y-4"
                          >
                            <div className="flex gap-4 items-start">
                              <div className="form-control w-full max-w-xs shrink-0">
                                <Label>Document Type</Label>
                                <select
                                  name="type"
                                  className="select select-bordered w-full select-sm"
                                >
                                  <option value="PASSPORT">
                                    Passport Image
                                  </option>
                                  <option value="VISA">Visa</option>
                                  <option value="TICKET">Flight Ticket</option>
                                  <option value="INSURANCE">Insurance</option>
                                  <option value="OTHER">Other</option>
                                </select>
                              </div>

                              {/* REACT DROPZONE AREA */}
                              <div className="w-full">
                                <Label>File Selection</Label>
                                {!fileToUpload ? (
                                  <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                                      isDragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-base-300 hover:border-primary/50 hover:bg-white"
                                    }`}
                                  >
                                    <input {...getInputProps()} />
                                    <div className="p-3 bg-base-200 rounded-full mb-2">
                                      <UploadCloud
                                        size={20}
                                        className="text-base-content/60"
                                      />
                                    </div>
                                    <p className="text-sm font-medium">
                                      Click to upload or drag & drop
                                    </p>
                                    <p className="text-xs text-base-content/40 mt-1">
                                      Images (PNG, JPG) or PDF (Max 10MB)
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        {fileToUpload.type.includes("pdf") ? (
                                          <FileText size={20} />
                                        ) : (
                                          <FileIcon size={20} />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold">
                                          {fileToUpload.name}
                                        </p>
                                        <p className="text-xs text-base-content/50">
                                          {(
                                            fileToUpload.size /
                                            1024 /
                                            1024
                                          ).toFixed(2)}{" "}
                                          MB
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setFileToUpload(null)}
                                      className="btn btn-sm btn-ghost btn-circle text-error"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {fileToUpload && (
                              <div className="flex justify-end pt-2">
                                <button
                                  type="submit"
                                  disabled={isUploadingDoc}
                                  className="btn btn-primary btn-sm px-6"
                                >
                                  {isUploadingDoc
                                    ? "Uploading..."
                                    : "Upload Document"}
                                </button>
                              </div>
                            )}
                          </form>
                        </div>
                      ) : (
                        <div className="alert alert-warning text-sm">
                          Create the client first to upload documents.
                        </div>
                      )}

                      {/* DOCUMENT LIST */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedClient?.clientProfile?.documents?.map(
                          (doc: any) => {
                            const isPdf = doc.url
                              .toLowerCase()
                              .endsWith(".pdf");
                            return (
                              <div
                                key={doc.id}
                                className="flex items-center gap-3 p-3 border border-base-200 rounded-xl hover:bg-base-50 transition-colors group"
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-base-300 flex items-center justify-center bg-base-100">
                                  {isPdf ? (
                                    <FileText
                                      className="text-error"
                                      size={24}
                                    />
                                  ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={doc.url}
                                      alt="doc"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`badge badge-xs font-bold ${
                                        isPdf
                                          ? "badge-error badge-outline"
                                          : "badge-neutral"
                                      }`}
                                    >
                                      {isPdf ? "PDF" : "IMG"}
                                    </span>
                                    <span className="text-[10px] text-base-content/40 uppercase tracking-wide">
                                      {doc.type}
                                    </span>
                                  </div>
                                  <p
                                    className="text-xs truncate text-base-content/70 mt-1 font-medium"
                                    title={doc.name}
                                  >
                                    {doc.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-circle btn-ghost btn-xs tooltip tooltip-left"
                                    data-tip="Open File"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="btn btn-circle btn-ghost btn-xs text-error tooltip tooltip-left"
                                    data-tip="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          },
                        )}
                        {(!selectedClient?.clientProfile?.documents ||
                          selectedClient.clientProfile.documents.length ===
                            0) && (
                          <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed border-base-200 rounded-xl bg-base-50/50">
                            <FileText size={32} className="mb-2" />
                            <p className="text-sm">
                              No documents uploaded yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form id="main-form" onSubmit={handleSubmit}>
                      <fieldset
                        disabled={modalMode === "view"}
                        className="group space-y-8 max-w-3xl mx-auto pb-10"
                      >
                        {activeTab === "identity" && (
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                              <div className="shrink-0 flex flex-col items-center gap-3">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-base-300 bg-base-50 relative group-disabled:border-base-200 group-disabled:bg-base-100">
                                  {modalMode === "view" ? (
                                    selectedClient?.image ? (
                                      <img
                                        src={selectedClient.image}
                                        className="w-full h-full object-cover"
                                        alt="Profile"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold opacity-20">
                                        {selectedClient?.name?.charAt(0)}
                                      </div>
                                    )
                                  ) : (
                                    <ImageUpload
                                      name="image"
                                      defaultValue={selectedClient?.image}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 w-full grid grid-cols-1 gap-5">
                                <div className="form-control">
                                  <Label required>Full Name</Label>
                                  <input
                                    name="name"
                                    defaultValue={selectedClient?.name}
                                    className="input input-bordered w-full disabled:bg-transparent disabled:border-base-200 disabled:text-base-content"
                                    required
                                  />
                                </div>
                                <div className="form-control">
                                  <Label required>Email Address</Label>
                                  <input
                                    name="email"
                                    type="email"
                                    defaultValue={selectedClient?.email}
                                    className="input input-bordered w-full disabled:bg-transparent disabled:border-base-200 disabled:text-base-content"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="divider"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="form-control">
                                <Label>Phone / WhatsApp</Label>
                                <input
                                  name="phone"
                                  defaultValue={
                                    selectedClient?.clientProfile?.phone
                                  }
                                  className="input input-bordered w-full disabled:bg-transparent disabled:border-base-200 disabled:text-base-content"
                                  placeholder="+1 234..."
                                />
                              </div>
                              <div className="form-control">
                                <Label>Nationality</Label>
                                <input
                                  name="nationality"
                                  defaultValue={
                                    selectedClient?.clientProfile?.nationality
                                  }
                                  className="input input-bordered w-full disabled:bg-transparent disabled:border-base-200 disabled:text-base-content"
                                  placeholder="e.g. USA"
                                />
                              </div>
                              <div className="form-control md:col-span-2">
                                <Label>Address</Label>
                                <textarea
                                  name="address"
                                  defaultValue={
                                    selectedClient?.clientProfile?.address
                                  }
                                  className="textarea textarea-bordered w-full h-24 disabled:bg-transparent disabled:border-base-200 disabled:text-base-content disabled:resize-none"
                                  placeholder="Full address..."
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {activeTab === "docs" && (
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="form-control">
                                <Label>Date of Birth</Label>
                                <div className="relative">
                                  <Calendar
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30"
                                  />
                                  <input
                                    type="date"
                                    name="dateOfBirth"
                                    defaultValue={formatDateForInput(
                                      selectedClient?.clientProfile
                                        ?.dateOfBirth,
                                    )}
                                    className="input input-bordered w-full pl-10 disabled:bg-transparent disabled:border-base-200"
                                  />
                                </div>
                              </div>
                              <div className="form-control">
                                <Label>Gender</Label>
                                <select
                                  name="gender"
                                  defaultValue={
                                    selectedClient?.clientProfile?.gender || ""
                                  }
                                  className="select select-bordered w-full disabled:bg-transparent disabled:border-base-200"
                                >
                                  <option value="">Select...</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                            <div className="p-6 border border-base-200 rounded-xl bg-base-50/50 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Shield size={100} />
                              </div>
                              <h4 className="text-xs font-bold uppercase text-base-content/40 mb-4 tracking-widest">
                                Passport Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="form-control">
                                  <Label>Passport Number</Label>
                                  <input
                                    name="passportNumber"
                                    defaultValue={
                                      selectedClient?.clientProfile
                                        ?.passportNumber
                                    }
                                    className="input input-bordered w-full font-mono uppercase disabled:bg-white/50"
                                    placeholder="A1234567"
                                  />
                                </div>
                                <div className="form-control">
                                  <Label>Expiry Date</Label>
                                  <input
                                    type="date"
                                    name="passportExpiry"
                                    defaultValue={formatDateForInput(
                                      selectedClient?.clientProfile
                                        ?.passportExpiry,
                                    )}
                                    className="input input-bordered w-full disabled:bg-white/50"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {activeTab === "safety" && (
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 gap-6">
                              <div className="form-control">
                                <Label>Medical Conditions</Label>
                                <textarea
                                  name="medicalInfo"
                                  defaultValue={
                                    selectedClient?.clientProfile?.medicalInfo
                                  }
                                  className="textarea textarea-bordered h-24 disabled:bg-transparent disabled:border-base-200"
                                  placeholder="Allergies, conditions..."
                                />
                              </div>
                              <div className="form-control">
                                <Label>Dietary Requirements</Label>
                                <input
                                  name="dietaryInfo"
                                  defaultValue={
                                    selectedClient?.clientProfile?.dietaryInfo
                                  }
                                  className="input input-bordered w-full disabled:bg-transparent disabled:border-base-200"
                                  placeholder="e.g. Vegetarian"
                                />
                              </div>
                            </div>
                            <div className="p-6 border border-error/20 bg-error/5 rounded-xl">
                              <h4 className="text-xs font-bold uppercase text-error/60 mb-4 tracking-widest flex items-center gap-2">
                                <Heart size={14} /> Emergency Contact
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                  <Label>Name</Label>
                                  <input
                                    name="emergencyContactName"
                                    defaultValue={
                                      selectedClient?.clientProfile
                                        ?.emergencyContactName
                                    }
                                    className="input input-bordered w-full bg-white disabled:bg-white/50"
                                  />
                                </div>
                                <div className="form-control">
                                  <Label>Phone</Label>
                                  <input
                                    name="emergencyContactPhone"
                                    defaultValue={
                                      selectedClient?.clientProfile
                                        ?.emergencyContactPhone
                                    }
                                    className="input input-bordered w-full bg-white disabled:bg-white/50"
                                  />
                                </div>
                              </div>
                            </div>
                            {modalMode !== "view" && (
                              <div className="form-control">
                                <Label>Internal Notes</Label>
                                <textarea
                                  name="notes"
                                  defaultValue={
                                    selectedClient?.clientProfile?.notes
                                  }
                                  className="textarea textarea-bordered h-20 text-sm"
                                  placeholder="Staff only notes..."
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </fieldset>
                    </form>
                  )}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              {modalMode !== "view" && activeTab !== "files" && (
                <div className="px-8 py-5 bg-base-50 border-t border-base-200 flex justify-end gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost hover:bg-base-200"
                  >
                    Cancel
                  </button>
                  <button
                    form="main-form"
                    type="submit"
                    className="btn btn-primary px-8 gap-2 shadow-lg shadow-primary/20"
                  >
                    <Save size={18} />{" "}
                    {modalMode === "edit" ? "Save Changes" : "Create Profile"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Client?"
        message="This will remove the user account, profile data, and all uploaded documents."
        isDanger
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
