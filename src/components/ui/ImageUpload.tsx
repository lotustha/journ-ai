"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  name: string;
  defaultValue?: string | null;
}

export function ImageUpload({ name, defaultValue }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
  });

  // Clear handler
  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
  };

  return (
    <div className="w-full">
      {/* Hidden input for Form submission to pick up the file */}
      {/* Note: React Dropzone manages the file, but standard HTML forms need an input. 
          We use the dropzone input for the file itself. */}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden h-40 flex items-center justify-center
          ${isDragActive ? "border-primary bg-primary/5" : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"}
        `}
      >
        <input {...getInputProps({ name: name })} />

        {preview ? (
          <div className="absolute inset-0 w-full h-full">
            <Image src={preview} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-medium text-sm">Click to change</p>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 btn btn-circle btn-xs btn-error text-white z-10"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-base-content/50">
            <div className="flex justify-center">
              <UploadCloud size={32} />
            </div>
            <p className="text-xs font-medium">
              {isDragActive ? "Drop image here" : "Click or Drag image"}
            </p>
            <p className="text-[10px] opacity-60">JPG, PNG (Max 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
