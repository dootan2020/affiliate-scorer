"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Key, Brain, Loader2 } from "lucide-react";

interface ApiStatus {
  hasKey: boolean;
  maskedKey: string | null;
}

const TASK_LABELS: Record<string, { label: string; description: string }> = {
  scoring: {
    label: "Chấm điểm sản phẩm",
    description: "Phân tích và xếp hạng sản phẩm affiliate",
  },
  content_brief: {
    label: "Tạo Content Brief",
    description: "Tạo script, hooks, prompts cho video",
  },
  morning_brief: {
    label: "Morning Brief",
    description: "Tóm tắt tình hình hàng ngày",
  },
  weekly_report: {
    label: "Báo cáo tuần",
    description: "Phân tích hiệu suất hàng tuần",
  },
};

interface ModelOption {
  id: string;
  label: string;
  description: string;
  provider: "Anthropic" | "OpenAI" | "Google";
  supported: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    description: "Nhanh, tiết kiệm",
    provider: "Anthropic",
    supported: true,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    description: "Cân bằng chất lượng/giá",
    provider: "Anthropic",
    supported: true,
  },
  {
    id: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    description: "Mạnh nhất, sáng tạo",
    provider: "Anthropic",
    supported: true,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    description: "Mạnh, đa năng (OpenAI)",
    provider: "OpenAI",
    supported: false,
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o-mini",
    description: "Nhanh, rẻ (OpenAI)",
    provider: "OpenAI",
    supported: false,
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Nhanh (Google)",
    provider: "Google",
    supported: false,
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Mạnh (Google)",
    provider: "Google",
    supported: false,
  },
];

const PROVIDERS = ["Anthropic", "OpenAI", "Google"] as const;

const DEFAULT_MODELS: Record<string, string> = {
  scoring: "claude-haiku-4-5-20251001",
  content_brief: "claude-sonnet-4-6",
  morning_brief: "claude-haiku-4-5-20251001",
  weekly_report: "claude-haiku-4-5-20251001",
};

export function SettingsPageClient(): React.ReactElement {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [models, setModels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/status").then((r) => r.json()),
      fetch("/api/settings/ai-models").then((r) => r.json()),
    ])
      .then(([statusRes, modelsRes]) => {
        setStatus(statusRes.data ?? null);
        setModels(modelsRes.data ?? {});
      })
      .catch(() => toast.error("Không thể tải cài đặt"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(models),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã lưu cấu hình AI");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi lưu cấu hình"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Key Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
            API Key
          </h2>
        </div>

        {status?.hasKey ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Đã kết nối
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono mt-0.5">
                {status.maskedKey}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Chưa có API key
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Thêm API key qua Vercel CLI:
              </p>
              <code className="block text-xs bg-gray-900 dark:bg-slate-950 text-emerald-400 rounded-lg px-3 py-2 font-mono">
                vercel env add ANTHROPIC_API_KEY production
              </code>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Hoặc thêm vào file .env.local:{" "}
                <code className="font-mono">ANTHROPIC_API_KEY=sk-ant-...</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Model Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
            AI Model theo tác vụ
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Chọn model cho từng loại tác vụ. Model mạnh hơn cho kết quả tốt hơn
          nhưng chi phí cao hơn.
        </p>

        <div className="space-y-4">
          {Object.entries(TASK_LABELS).map(([taskType, meta]) => (
            <div
              key={taskType}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {meta.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {meta.description}
                </p>
              </div>
              <select
                value={models[taskType] ?? DEFAULT_MODELS[taskType] ?? "claude-haiku-4-5-20251001"}
                onChange={(e) => {
                  const selected = MODEL_OPTIONS.find((m) => m.id === e.target.value);
                  if (selected && !selected.supported) {
                    toast.info("Sắp hỗ trợ! Hiện tại chỉ Claude hoạt động.");
                  }
                  setModels((prev) => ({
                    ...prev,
                    [taskType]: e.target.value,
                  }));
                }}
                className="w-full sm:w-56 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              >
                {PROVIDERS.map((provider) => (
                  <optgroup key={provider} label={provider}>
                    {MODEL_OPTIONS.filter((m) => m.provider === provider).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} — {m.description}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Mặc định: Haiku 4.5 (nhanh) · Content Brief: Sonnet 4.6
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
