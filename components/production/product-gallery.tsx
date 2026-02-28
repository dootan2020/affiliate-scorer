"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  ImageIcon,
  PackageOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface GalleryImageMeta {
  id: string;
  filename: string;
  mimeType: string;
  sortOrder: number;
}

interface Props {
  productIdentityId: string;
  mainImageUrl: string | null;
}

export function ProductGallery({ productIdentityId, mainImageUrl }: Props): React.ReactElement {
  const [images, setImages] = useState<GalleryImageMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productIdentityId}/gallery`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: GalleryImageMeta[] };
      setImages(json.data ?? []);
    } catch {
      // Gallery load is non-critical, no toast needed
    } finally {
      setLoading(false);
    }
  }, [productIdentityId]);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  async function handleUpload(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of fileArray) {
        formData.append("files", file);
      }
      const res = await fetch(`/api/products/${productIdentityId}/gallery`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Đã tải ảnh lên");
        await fetchImages();
      } else {
        toast.error("Không thể tải ảnh lên");
      }
    } catch {
      toast.error("Lỗi kết nối khi tải ảnh");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string): Promise<void> {
    try {
      const res = await fetch(`/api/products/${productIdentityId}/gallery`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        toast.error("Không thể xoá ảnh");
      }
    } catch {
      toast.error("Lỗi kết nối khi xoá ảnh");
    }
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void handleUpload(e.dataTransfer.files);
    }
  }

  const hasImages = images.length > 0 || mainImageUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          Ảnh sản phẩm ({images.length + (mainImageUrl ? 1 : 0)})
        </span>
        {hasImages && (
          <a
            href={`/api/products/${productIdentityId}/gallery/zip`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <PackageOpen className="w-3 h-3" />
            Tải tất cả (.zip)
          </a>
        )}
      </div>

      {/* Thumbnail grid */}
      <div className="flex flex-wrap gap-2">
        {/* Main image */}
        {mainImageUrl && (
          <div className="group relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 ring-1 ring-gray-200 dark:ring-slate-700">
            <img
              src={mainImageUrl}
              alt="Main"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <a
                href={mainImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded bg-white/80 text-gray-700"
              >
                <Download className="w-3 h-3" />
              </a>
            </div>
            <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-black/50 text-white py-0.5">
              Chính
            </span>
          </div>
        )}

        {/* Gallery images */}
        {loading && images.length === 0 && (
          <div className="w-[72px] h-[72px] rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}

        {images.map((img) => (
          <div
            key={img.id}
            className="group relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 ring-1 ring-gray-200 dark:ring-slate-700"
          >
            <img
              src={`/api/products/${productIdentityId}/gallery/${img.id}`}
              alt={img.filename}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <a
                href={`/api/products/${productIdentityId}/gallery/${img.id}`}
                download={img.filename}
                className="p-1 rounded bg-white/80 text-gray-700 hover:bg-white"
              >
                <Download className="w-3 h-3" />
              </a>
              <button
                onClick={() => void handleDelete(img.id)}
                className="p-1 rounded bg-white/80 text-rose-600 hover:bg-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload zone */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`w-[72px] h-[72px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
              : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-gray-50 dark:bg-slate-800/50"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[9px] text-gray-400">Thêm</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
