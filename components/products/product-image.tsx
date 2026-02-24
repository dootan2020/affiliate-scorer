"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}

function getProxiedUrl(url: string): string {
  if (url.includes("500fd.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function ProductImage({
  src,
  alt,
  size = 40,
  className = "",
}: ProductImageProps): React.ReactElement {
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

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

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-slate-800 ${className}`}
      unoptimized
      onError={() => {
        if (!useFallback) {
          // First failure: try proxy
          setUseFallback(true);
        } else {
          // Proxy also failed: show placeholder
          setError(true);
        }
      }}
    />
  );
}
