"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2, ImagePlus, Eye } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

interface MultiImageUploadProps {
  name: string;
  defaultImages?: { id?: string; url: string }[];
  onRemoveExisting?: (id: string) => Promise<void>; // 👈 Async to wait for server
}

export function MultiImageUpload({
  name,
  defaultImages = [],
  onRemoveExisting,
}: MultiImageUploadProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // State for delete confirmation
  const [imageToDelete, setImageToDelete] = useState<{
    id?: string;
    index?: number;
    isExisting: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const interactionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      newFiles.forEach((file) => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
    }
  }, [newFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...selected]);
      const urls = selected.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...urls]);
    }
    if (interactionRef.current) interactionRef.current.value = "";
  };

  // --- DELETE HANDLERS ---
  const requestDelete = (data: {
    id?: string;
    index?: number;
    isExisting: boolean;
  }) => {
    setImageToDelete(data);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    if (imageToDelete.isExisting && imageToDelete.id && onRemoveExisting) {
      // Call Server Action passed from parent
      await onRemoveExisting(imageToDelete.id);
    } else if (
      !imageToDelete.isExisting &&
      typeof imageToDelete.index === "number"
    ) {
      // Remove local file
      URL.revokeObjectURL(previews[imageToDelete.index]);
      setPreviews((prev) => prev.filter((_, i) => i !== imageToDelete.index));
      setNewFiles((prev) => prev.filter((_, i) => i !== imageToDelete.index));
    }
    setImageToDelete(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Hidden Input for Form Submission */}
        <input
          type="file"
          name={name}
          multiple
          className="hidden"
          ref={inputRef}
        />

        {/* Upload Box */}
        <div
          onClick={() => interactionRef.current?.click()}
          className="border-2 border-dashed border-base-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-base-200 transition-colors flex flex-col items-center justify-center min-h-[120px] bg-base-100"
        >
          <input
            type="file"
            multiple
            className="hidden"
            ref={interactionRef}
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/jpg, image/webp"
          />
          <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mb-3 text-primary">
            <ImagePlus size={24} />
          </div>
          <p className="text-sm font-bold">Click to Add Photos</p>
          <p className="text-xs text-base-content/50 mt-1">
            Max 10MB total payload
          </p>
        </div>

        {/* Gallery Grid */}
        {(defaultImages.length > 0 || previews.length > 0) && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {/* A. EXISTING IMAGES */}
            {defaultImages.map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative aspect-square rounded-lg overflow-hidden group border border-base-200 bg-base-100 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  className="w-full h-full object-cover"
                  alt="Gallery Item"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDelete({ id: img.id, isExisting: true });
                  }}
                  className="absolute top-1 right-1 btn btn-xs btn-circle btn-error text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* B. NEW PREVIEWS */}
            {previews.map((url, idx) => (
              <div
                key={`new-${idx}`}
                className="relative aspect-square rounded-lg overflow-hidden group border-2 border-primary bg-base-100 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  className="w-full h-full object-cover opacity-90"
                  alt="New Upload"
                />
                <div className="absolute bottom-0 inset-x-0 bg-primary text-primary-content text-[9px] font-bold text-center py-0.5 uppercase">
                  New
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDelete({ index: idx, isExisting: false });
                  }}
                  className="absolute top-1 right-1 btn btn-xs btn-circle btn-neutral text-white shadow-md"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!imageToDelete}
        title="Delete Image?"
        message="This will permanently remove the image from the gallery."
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setImageToDelete(null)}
      />
    </>
  );
}
