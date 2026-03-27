"use client";

import { useState } from "react";
import { Target, Pencil, Check } from "lucide-react";
import type { UserProfile } from "@/lib/niche-scoring/types";

const STORAGE_KEY = "niche-profile";

interface Props {
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
}

const CONTENT_LABELS: Record<string, string> = {
  ai_video: "Video AI",
  manual: "Quay tay",
  both: "Cả hai",
};

const TARGET_LABELS: Record<number, string> = {
  10_000_000: "10M/th",
  30_000_000: "30M/th",
  50_000_000: "50M+/th",
};

const EXP_LABELS: Record<string, string> = {
  new: "Mới",
  experienced: "Có KN",
};

export function loadProfileFromStorage(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function NicheProfileForm({ profile, onSave }: Props): React.ReactElement {
  const [editing, setEditing] = useState(!profile);
  const [contentType, setContentType] = useState<UserProfile["contentType"]>(
    profile?.contentType ?? "both"
  );
  const [buyProduct, setBuyProduct] = useState(profile?.buyProduct ?? true);
  const [targetIncome, setTargetIncome] = useState(
    profile?.targetIncome ?? 30_000_000
  );
  const [experience, setExperience] = useState<UserProfile["experience"]>(
    profile?.experience ?? "new"
  );

  function handleSave(): void {
    const p: UserProfile = { contentType, buyProduct, targetIncome, experience };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // Silently continue — profile still works for this session
    }
    onSave(p);
    setEditing(false);
  }

  // Compact summary when profile exists and not editing
  if (profile && !editing) {
    return (
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm px-4 py-2.5 text-sm">
        <Target className="w-4 h-4 text-orange-500 shrink-0" />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {CONTENT_LABELS[profile.contentType]}
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{profile.buyProduct ? "Mua SP" : "Không mua SP"}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{TARGET_LABELS[profile.targetIncome] ?? "30M/th"}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{EXP_LABELS[profile.experience]}</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Sửa
        </button>
      </div>
    );
  }

  // Full form
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-50">
        <Target className="w-4 h-4 text-orange-500" />
        Cho tôi biết về bạn để gợi ý ngách phù hợp
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Content type */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Loại nội dung
          </label>
          <select
            value={contentType}
            onChange={(e) =>
              setContentType(e.target.value as UserProfile["contentType"])
            }
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          >
            <option value="ai_video">Video AI</option>
            <option value="manual">Quay tay</option>
            <option value="both">Cả hai</option>
          </select>
        </div>

        {/* Buy product */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Mua sản phẩm
          </label>
          <select
            value={buyProduct ? "yes" : "no"}
            onChange={(e) => setBuyProduct(e.target.value === "yes")}
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          >
            <option value="yes">Có</option>
            <option value="no">Không</option>
          </select>
        </div>

        {/* Target income */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Mục tiêu thu nhập
          </label>
          <select
            value={targetIncome}
            onChange={(e) => setTargetIncome(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          >
            <option value={10_000_000}>10M/tháng</option>
            <option value={30_000_000}>30M/tháng</option>
            <option value={50_000_000}>50M+/tháng</option>
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Kinh nghiệm
          </label>
          <select
            value={experience}
            onChange={(e) =>
              setExperience(e.target.value as UserProfile["experience"])
            }
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          >
            <option value="new">Mới bắt đầu</option>
            <option value="experienced">Có kinh nghiệm</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          Lưu & Chấm điểm
        </button>
      </div>
    </div>
  );
}
