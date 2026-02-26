"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Key,
  Brain,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react";

// ─── Types ───

type ProviderName = "anthropic" | "openai" | "google";

interface ProviderStatus {
  provider: ProviderName;
  connected: boolean;
  lastChars: string | null;
}

interface AvailableModel {
  id: string;
  name: string;
  description: string;
  provider: ProviderName;
}

// ─── Constants ───

const PROVIDERS: { id: ProviderName; label: string; consoleUrl: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", consoleUrl: "https://console.anthropic.com/settings/keys" },
  { id: "openai", label: "OpenAI (GPT)", consoleUrl: "https://platform.openai.com/api-keys" },
  { id: "google", label: "Google (Gemini)", consoleUrl: "https://aistudio.google.com/apikey" },
];

const TASK_LABELS: Record<string, { label: string; description: string }> = {
  scoring: { label: "Chấm điểm sản phẩm", description: "Phân tích và xếp hạng sản phẩm affiliate" },
  content_brief: { label: "Tạo Content Brief", description: "Tạo script, hooks, prompts cho video" },
  morning_brief: { label: "Morning Brief", description: "Tóm tắt tình hình hàng ngày" },
  weekly_report: { label: "Báo cáo tuần", description: "Phân tích hiệu suất hàng tuần" },
};

const DEFAULT_MODELS: Record<string, string> = {
  scoring: "claude-haiku-4-5-20251001",
  content_brief: "claude-sonnet-4-6",
  morning_brief: "claude-haiku-4-5-20251001",
  weekly_report: "claude-haiku-4-5-20251001",
};

// ─── Component ───

export function SettingsPageClient(): React.ReactElement {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [models, setModels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // API Keys card state
  const [selectedProvider, setSelectedProvider] = useState<ProviderName>("anthropic");
  const [keyInput, setKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, modelsRes, availableRes] = await Promise.all([
        fetch("/api/settings/api-keys/status").then((r) => r.json()),
        fetch("/api/settings/ai-models").then((r) => r.json()),
        fetch("/api/settings/available-models").then((r) => r.json()),
      ]);
      setProviders(statusRes.providers ?? []);
      setModels(modelsRes.data ?? {});
      setAvailableModels(availableRes.models ?? []);
    } catch {
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const currentStatus = providers.find((p) => p.provider === selectedProvider);
  const currentProviderConfig = PROVIDERS.find((p) => p.id === selectedProvider)!;

  async function handleTestAndSave(): Promise<void> {
    if (!keyInput.trim()) {
      toast.error("Nhập API key trước");
      return;
    }

    setTesting(true);
    try {
      // Test the key
      const testRes = await fetch("/api/settings/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, apiKey: keyInput.trim() }),
      });
      const testData = await testRes.json();

      if (!testData.success) {
        toast.error(testData.error ?? "API key không hợp lệ");
        return;
      }

      // Save the key
      const saveRes = await fetch("/api/settings/api-keys/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, apiKey: keyInput.trim() }),
      });
      const saveData = await saveRes.json();

      if (!saveData.success) {
        toast.error(saveData.error ?? "Lỗi khi lưu API key");
        return;
      }

      toast.success(`Đã kết nối ${currentProviderConfig.label}`);
      setKeyInput("");
      await fetchAll();
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteKey(): Promise<void> {
    setDeleting(true);
    try {
      const res = await fetch(`/api/settings/api-keys/save?provider=${selectedProvider}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Lỗi khi xoá API key");
        return;
      }
      toast.success(`Đã xoá API key ${currentProviderConfig.label}`);
      await fetchAll();
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveModels(): Promise<void> {
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
      toast.error(err instanceof Error ? err.message : "Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const connectedProviders = providers.filter((p) => p.connected);
  const connectedModels = availableModels.filter((m) =>
    connectedProviders.some((p) => p.provider === m.provider)
  );

  return (
    <div className="space-y-6">
      {/* Card 1: API Keys */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          <Key className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            API Keys
          </h2>
        </div>

        {/* Provider selector */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 mb-1.5 block">
              Chọn nhà cung cấp AI
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value as ProviderName);
                setKeyInput("");
              }}
              className="w-full sm:w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            >
              {PROVIDERS.map((p) => {
                const status = providers.find((s) => s.provider === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.label} {status?.connected ? "✓" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Connection status + input */}
          {currentStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Đã kết nối
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono mt-0.5">
                    {currentStatus.lastChars}
                  </p>
                </div>
                <button
                    onClick={() => void handleDeleteKey()}
                    disabled={deleting}
                    className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    title="Xoá API key"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Chưa kết nối
                  </p>
                  <a
                    href={currentProviderConfig.consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600/70 dark:text-amber-400/70 hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    Lấy key tại {currentProviderConfig.consoleUrl.replace("https://", "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Nhập ${currentProviderConfig.label} API key`}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-mono"
                />
                <button
                  onClick={() => void handleTestAndSave()}
                  disabled={testing || !keyInput.trim()}
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Kiểm tra
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Model Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          <Brain className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            AI Model theo tác vụ
          </h2>
        </div>

        {connectedModels.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Kết nối ít nhất 1 provider ở phần API Keys để chọn model
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Chọn model cho từng loại tác vụ. Chỉ hiện models từ providers đã kết nối.
            </p>

            <div className="space-y-3">
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
                    onChange={(e) => setModels((prev) => ({ ...prev, [taskType]: e.target.value }))}
                    className="w-full sm:w-56 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  >
                    {connectedProviders.map((cp) => {
                      const providerModels = connectedModels.filter((m) => m.provider === cp.provider);
                      if (providerModels.length === 0) return null;
                      const label = PROVIDERS.find((p) => p.id === cp.provider)?.label ?? cp.provider;
                      return (
                        <optgroup key={cp.provider} label={label}>
                          {providerModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.description}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Mặc định: Haiku 4.5 (nhanh) · Content Brief: Sonnet 4.6
              </p>
              <button
                onClick={() => void handleSaveModels()}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu cấu hình
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
