"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Star, Plus, X, Pencil } from "lucide-react";

interface PersonalNotesSectionProps {
  productId: string;
  initialNotes?: string | null;
  initialRating?: number | null;
  initialTags?: string[];
  affiliateLink?: string | null;
  affiliateLinkStatus?: string | null;
}

export function PersonalNotesSection({
  productId,
  initialNotes,
  initialRating,
  initialTags,
}: PersonalNotesSectionProps): React.ReactElement {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || null,
          rating: rating || null,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastSaved(new Date());
      toast.success("Đã lưu ghi chú");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi lưu ghi chú"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleAddTag(): void {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
    setShowTagInput(false);
  }

  function handleRemoveTag(tag: string): void {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setNewTag("");
      setShowTagInput(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Pencil className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
          Ghi chú của tôi
        </h3>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="VD: Ship chậm 5 ngày, khách hay hỏi về size, shop trả lời nhanh..."
        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
      />

      {/* Star Rating */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Đánh giá cá nhân:
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value === rating ? 0 : value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${value} sao`}
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  value <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-gray-300 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {rating}/5
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="mt-4">
        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Tags:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-200 transition-colors"
                aria-label={`Xóa tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {showTagInput ? (
            <input
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag}
              placeholder="Nhap tag..."
              className="rounded-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-28"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 dark:border-slate-600 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Thêm tag
            </button>
          )}
        </div>
      </div>

      {/* Save + Timestamp */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        {lastSaved && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Cập nhật: {lastSaved.toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>
    </div>
  );
}
