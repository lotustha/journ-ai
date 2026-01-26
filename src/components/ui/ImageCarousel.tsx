"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

interface ImageCarouselProps {
  images: string[]; // Array of Image URLs
  alt: string;
  aspectRatio?: string; // CSS class for height/ratio (default: h-48)
}

export function ImageCarousel({
  images = [],
  alt,
  aspectRatio = "h-48",
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Fallback if no images
  if (!images || images.length === 0) {
    return (
      <div
        className={`w-full ${aspectRatio} bg-base-200 flex items-center justify-center text-base-content/10`}
      >
        <ImageIcon size={48} />
      </div>
    );
  }

  // 2. Navigation Handlers
  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering card click
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering card click
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className={`relative w-full ${aspectRatio} group overflow-hidden bg-base-200`}
    >
      {/* Current Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[currentIndex]}
        alt={`${alt} ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-500"
      />

      {/* Controls (Only if > 1 image) */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-circle btn-xs btn-ghost bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 border-none z-10"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-circle btn-xs btn-ghost bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 border-none z-10"
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${
                  idx === currentIndex ? "bg-white scale-125" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Overlay Gradient for Text readability if needed (Optional) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_-30px_60px_-15px_rgba(0,0,0,0.3)]" />
    </div>
  );
}
