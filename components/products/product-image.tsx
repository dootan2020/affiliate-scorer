"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
  /** Disable hover preview (default: enabled when src exists) */
  noPreview?: boolean;
}

const PREVIEW_SIZE = 240;

function getProxiedUrl(url: string): string {
  if (url.includes("500fd.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function ProductImage({
  src,
  alt,
  size = 48,
  className = "",
  noPreview = false,
}: ProductImageProps): React.ReactElement {
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter(): void {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowPreview(true);
  }

  function handleMouseLeave(): void {
    hideTimer.current = setTimeout(() => setShowPreview(false), 100);
  }

  if (!src || error) {
    return (
      <div
        className={`rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Package className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  const imageUrl = useFallback ? getProxiedUrl(src) : src;
  const canPreview = !noPreview && size < PREVIEW_SIZE;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      onMouseEnter={canPreview ? handleMouseEnter : undefined}
      onMouseLeave={canPreview ? handleMouseLeave : undefined}
    >
      <Image
        src={imageUrl}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-lg object-cover bg-gray-100 dark:bg-slate-800 ${className}`}
        style={{ width: size, height: size }}
        unoptimized
        onError={() => {
          if (!useFallback) {
            setUseFallback(true);
          } else {
            setError(true);
          }
        }}
      />

      {/* Hover preview */}
      {canPreview && showPreview && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ bottom: size + 8, left: "50%", transform: "translateX(-50%)" }}
        >
          <Image
            src={imageUrl}
            alt={alt}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            className="rounded-xl object-cover shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
