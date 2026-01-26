"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  X,
  Save,
  Globe,
  Image as ImageIcon,
  MapPin,
  Search,
  ChevronRight,
  Loader2,
  LayoutGrid,
  Camera,
} from "lucide-react";
import {
  createCountry,
  updateCountry,
  deleteCountry,
  deleteCountryImage,
} from "@/actions/countries";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { toast } from "sonner";

export function CountryManager({
  countries,
  onClose,
}: {
  countries: any[];
  onClose: () => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState<any>(
    countries[0] || null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- FILTERED LIST ---
  const filteredCountries = useMemo(() => {
    return countries.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [countries, searchQuery]);

  // --- HANDLERS ---
  const handleSelect = (c: any) => {
    setSelectedCountry(c);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedCountry(null);
    setIsCreating(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    if (!isCreating && selectedCountry) {
      formData.append("id", selectedCountry.id);
    }

    const action = isCreating ? createCountry : updateCountry;
    const result = await action(null, formData);

    if (result?.success) {
      toast.success(result.message);
      if (isCreating) setIsCreating(false);
    } else {
      toast.error(result?.error);
    }
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this country?")) return;
    const result = await deleteCountry(id);
    if (result?.success) {
      toast.success("Country deleted");
      if (selectedCountry?.id === id) {
        const next = countries.find((c) => c.id !== id);
        setSelectedCountry(next || null);
      }
    } else {
      toast.error(result?.error);
    }
  }

  async function handleDeleteGalleryImage(imgId: string) {
    if (!confirm("Remove image?")) return;
    await deleteCountryImage(imgId);
    toast.success("Image removed");
  }

  return (
    <div className="flex h-[85vh] w-full bg-base-100 rounded-2xl overflow-hidden shadow-2xl border border-base-200">
      {/* ========================
          LEFT SIDEBAR: LIST
      ======================== */}
      <div className="w-72 shrink-0 border-r border-base-200 bg-white flex flex-col z-30">
        <div className="p-5 border-b border-base-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Globe className="text-primary" size={20} /> Destinations
          </h3>
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-primary transition-colors"
              size={14}
            />
            <input
              className="input input-sm bg-base-100 w-full pl-9 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all rounded-lg"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button
            onClick={handleCreateNew}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border border-dashed border-base-300 hover:border-primary hover:text-primary hover:bg-primary/5 group ${isCreating ? "border-primary bg-primary/5 text-primary" : "text-base-content/60"}`}
          >
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={16} />
            </div>
            <span className="font-semibold text-sm">Add New Country</span>
          </button>

          {filteredCountries.map((c) => {
            const isActive = !isCreating && selectedCountry?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-neutral text-neutral-content shadow-lg scale-[1.02]"
                    : "hover:bg-base-100 text-base-content/80"
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-base-100">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      className="w-full h-full object-cover"
                      alt={c.name}
                    />
                  ) : (
                    <Globe className="m-2 opacity-50 text-base-content" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{c.name}</div>
                  <div
                    className={`text-[10px] flex items-center gap-1 ${isActive ? "opacity-80" : "opacity-40"}`}
                  >
                    <ImageIcon size={10} /> {c.images?.length || 0} assets
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================
          RIGHT MAIN: EDITOR
      ======================== */}
      <div className="flex-1 flex flex-col bg-base-50 relative min-w-0 overflow-hidden">
        {/* Navbar Overlay */}
        <div className="absolute top-0 left-0 right-0 h-16 flex justify-between items-center px-6 z-40 pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-base-200 shadow-sm text-xs font-medium text-base-content/60 flex items-center gap-2">
            <span>Resources</span>
            <ChevronRight size={12} />
            <span className="text-base-content font-bold">
              {isCreating ? "New Entry" : selectedCountry?.name || "Overview"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="pointer-events-auto btn btn-sm btn-circle btn-ghost bg-white/50 backdrop-blur hover:bg-white shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedCountry || isCreating ? (
            <form
              key={selectedCountry?.id || "create"}
              onSubmit={handleSubmit}
              className="min-h-full pb-20"
            >
              {/* 1. IMMERSIVE HERO SECTION 
                  This container holds the Image, The Gradient, AND the Text.
                */}
              <div className="relative w-full h-80 group overflow-hidden bg-base-300">
                {/* A. BACKGROUND LAYER: The Image Upload */}
                <div className="absolute inset-0 z-0">
                  {/* We use a specific CSS override class here to force the 
                          ImageUpload component to strip its padding/borders 
                          and fill the available space.
                        */}
                  <div className="w-full h-full [&_div]:w-full [&_div]:h-full [&_div]:border-0 [&_div]:rounded-none [&_div]:bg-transparent">
                    <ImageUpload
                      name="coverImage"
                      defaultValue={selectedCountry?.imageUrl}
                    />
                  </div>
                </div>

                {/* B. MIDDLE LAYER: Gradient Overlay (For text readability) */}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent z-10 pointer-events-none" />

                {/* C. TOP LAYER: Text Content (Badge & Title) */}
                <div className="absolute bottom-0 left-0 w-full p-8 z-20 pointer-events-none">
                  <div className="flex items-center gap-2 text-white/80 mb-2 text-xs font-bold uppercase tracking-widest">
                    <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white flex items-center gap-1">
                      <MapPin size={10} /> Destination
                    </span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-2xl">
                    {selectedCountry?.name || "New Destination"}
                  </h1>
                </div>
              </div>

              {/* 2. MAIN CONTENT AREA */}
              <div className="px-8 mt-6">
                <div className="bg-white rounded-2xl shadow-sm border border-base-200 p-8 space-y-8">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Text Inputs */}
                    <div className="md:col-span-2 space-y-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/40">
                          Country Name
                        </label>
                        <input
                          name="name"
                          defaultValue={selectedCountry?.name}
                          className="input input-lg text-xl font-bold border-0 border-b-2 border-base-100 rounded-none px-0 focus:outline-none focus:border-primary bg-transparent transition-all"
                          placeholder="e.g. Switzerland"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/40">
                          Description
                        </label>
                        <textarea
                          name="description"
                          defaultValue={selectedCountry?.description}
                          className="textarea textarea-bordered h-32 text-base leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20"
                          placeholder="Write a compelling description..."
                        />
                      </div>
                    </div>

                    {/* Side Info */}
                    <div className="space-y-4">
                      <div className="bg-base-50 rounded-xl p-5 border border-base-200">
                        <div className="flex items-center gap-3 text-sm text-base-content/70 mb-3">
                          <LayoutGrid size={16} />
                          <span>
                            Linked Locations:{" "}
                            <span className="font-bold">
                              {selectedCountry?.locations?.length || 0}
                            </span>
                          </span>
                        </div>
                        <div className="text-[11px] text-base-content/50 leading-relaxed border-t border-base-200 pt-3">
                          The cover image above serves as the hero background
                          for all itinerary PDFs generated for this country.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  {/* Gallery */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Camera size={20} className="text-primary" />
                      <h3 className="font-bold text-lg">Photo Gallery</h3>
                    </div>
                    <div className="bg-base-50 rounded-xl border-2 border-dashed border-base-300 p-6">
                      <MultiImageUpload
                        name="galleryImages"
                        defaultImages={selectedCountry?.images}
                        onRemoveExisting={(id) => handleDeleteGalleryImage(id)}
                      />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center pt-4">
                    {!isCreating && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedCountry.id)}
                        className="btn btn-ghost text-error btn-sm gap-2 hover:bg-error/10"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}

                    <div className="flex gap-3 ml-auto">
                      <button
                        type="button"
                        onClick={() =>
                          isCreating ? setIsCreating(false) : onClose()
                        }
                        className="btn btn-ghost"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary px-8 shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Save size={18} />
                        )}
                        {isCreating ? "Create Country" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 select-none bg-base-50">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-base-200 flex items-center justify-center mb-6 transform rotate-3">
                <Globe size={40} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-base-content">
                Resource Manager
              </h3>
              <p className="text-base-content/50 max-w-sm mb-8">
                Select a country from the sidebar to manage its details or
                create a new destination.
              </p>
              <button
                onClick={handleCreateNew}
                className="btn btn-primary gap-2"
              >
                <Plus size={16} /> Create New Destination
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
