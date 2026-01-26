"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  name: string;
  defaultValue?: string | null;
}

export function ImageUpload({ name, defaultValue }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = ""; // Clear the actual input
    }
  };

  // Trigger the hidden file input when the container is clicked
  const handleContainerClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full h-full relative group">
      {/* THE REAL INPUT
         - Hidden visually but functionally active.
         - We put it here so it is definitely part of the form.
      */}
      <input
        type="file"
        name={name}
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {/* CLICKABLE CONTAINER */}
      <div
        onClick={handleContainerClick}
        className={`w-full h-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center relative bg-base-100
          ${preview ? "border-none" : "border-base-300 hover:border-primary/50 hover:bg-base-200"}
        `}
      >
        {preview ? (
          <>
            {/* PREVIEW IMAGE */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* HOVER OVERLAY */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-bold flex items-center gap-2">
                <ImageIcon size={16} /> Change Image
              </p>
            </div>

            {/* REMOVE BUTTON */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 btn btn-xs btn-circle btn-error text-white shadow-md z-20"
              title="Remove Image"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center text-base-content/40 p-4 text-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center mb-2">
              <UploadCloud size={20} />
            </div>
            <p className="text-xs font-bold">Click to Upload Cover</p>
            <p className="text-[10px] opacity-60">JPG, PNG, WebP</p>
          </div>
        )}
      </div>
    </div>
  );
}
