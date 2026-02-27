"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
const PREVIEW_GAP = 8;

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
  const [previewPos, setPreviewPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    let top = rect.top - PREVIEW_SIZE - PREVIEW_GAP;
    let left = centerX - PREVIEW_SIZE / 2;

    // If preview would go above viewport, show below instead
    if (top < PREVIEW_GAP) {
      top = rect.bottom + PREVIEW_GAP;
    }
    // Clamp horizontally
    left = Math.max(PREVIEW_GAP, Math.min(left, window.innerWidth - PREVIEW_SIZE - PREVIEW_GAP));

    setPreviewPos({ top, left });
  }, []);

  function handleMouseEnter(): void {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updatePosition();
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
      ref={containerRef}
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

      {/* Hover preview — portaled to body to escape overflow containers */}
      {canPreview && showPreview && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{ top: previewPos.top, left: previewPos.left }}
          >
            <div
              className="rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900"
              style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            >
              <Image
                src={imageUrl}
                alt={alt}
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE * 2}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
