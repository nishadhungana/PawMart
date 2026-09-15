'use client';

import React, { useState } from 'react';

interface PlaceholderImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export default function PlaceholderImage({ src, alt, className = '', aspectRatio = 'aspect-square' }: PlaceholderImageProps) {
  const [error, setError] = useState(false);

  // If no src or error loading remote image, render SVG fallback
  if (!src || error) {
    return (
      <div className={`bg-gradient-to-br from-emerald-100 to-emerald-200 flex flex-col items-center justify-center text-emerald-800 p-4 select-none ${aspectRatio} ${className}`}>
        <span className="text-4xl mb-1">🐾</span>
        <span className="text-xs font-semibold text-center line-clamp-1 opacity-80">{alt}</span>
        <span className="text-[10px] text-emerald-600 font-mono mt-0.5">PawMart Pet Care</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`object-cover ${className}`}
    />
  );
}
