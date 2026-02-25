"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Heart,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface ContentPostData {
  id?: string;
  platform: string;
  url: string;
  postedAt?: string;
  views?: number;
  likes?: number;
  comments?: number;
}

interface CampaignContentListProps {
  campaignId: string;
  productId?: string;
  initialPosts: ContentPostData[];
}

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
];

function getPlatformBadge(platform: string): { bg: string; label: string } {
  const map: Record<string, { bg: string; label: string }> = {
    tiktok: { bg: "bg-gray-900 dark:bg-gray-700 text-white", label: "TikTok" },
    youtube: { bg: "bg-red-500 text-white", label: "YouTube" },
    facebook: { bg: "bg-blue-600 text-white", label: "Facebook" },
    instagram: {
      bg: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      label: "Instagram",
    },
  };
  return map[platform] ?? { bg: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300", label: platform };
}

export function CampaignContentList({
  campaignId,
  productId,
  initialPosts,
}: CampaignContentListProps): React.ReactElement {
  const [posts, setPosts] = useState<ContentPostData[]>(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [formPlatform, setFormPlatform] = useState("tiktok");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(): Promise<void> {
    if (!formUrl.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/content-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          productId,
          platform: formPlatform,
          url: formUrl.trim(),
        }),
      });

      if (!res.ok) throw new Error("Thêm bài viết thất bại");
      const data = (await res.json()) as ContentPostData;
      setPosts((prev) => [...prev, data]);
      setFormUrl("");
      setShowForm(false);
    } catch {
      // silent fail, keep form open
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStats(postId: string): Promise<void> {
    setUpdatingId(postId);
    try {
      const res = await fetch(`/api/content-posts?id=${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");
      const updated = (await res.json()) as ContentPostData;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
      );
    } catch {
      // silent fail
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(postId: string): Promise<void> {
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/content-posts?id=${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // silent fail
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {posts.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          Chưa có bài viết nào.
        </p>
      )}

      {posts.map((post) => {
        const badge = getPlatformBadge(post.platform);
        return (
          <div
            key={post.id ?? post.url}
            className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-3 py-2.5"
          >
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
            >
              {badge.label}
            </span>

            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1 min-w-0"
            >
              {post.url}
            </a>

            <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {post.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views.toLocaleString()}
                </span>
              )}
              {post.likes !== undefined && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {post.likes.toLocaleString()}
                </span>
              )}
              {post.comments !== undefined && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {post.comments.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {post.id && (
                <button
                  type="button"
                  onClick={() => handleUpdateStats(post.id!)}
                  disabled={updatingId === post.id}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  title="Cập nhật stats"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${updatingId === post.id ? "animate-spin" : ""}`}
                  />
                </button>
              )}
              {post.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(post.id!)}
                  disabled={deletingId === post.id}
                  className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  {deletingId === post.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
          <select
            value={formPlatform}
            onChange={(e) => setFormPlatform(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm shrink-0"
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            className="flex-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="URL bai viet..."
          />
          <button
            type="button"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 font-medium transition-all disabled:opacity-50"
            onClick={handleAdd}
            disabled={saving || !formUrl.trim()}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Them"}
          </button>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 px-3 py-1.5 font-medium transition-colors"
            onClick={() => setShowForm(false)}
          >
            Huy
          </button>
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          className="flex items-center justify-center gap-2 w-full text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 font-medium transition-colors"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4" />
          Them bai viet
        </button>
      )}
    </div>
  );
}
