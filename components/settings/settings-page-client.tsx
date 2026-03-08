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
import { Button } from "@/components/ui/button";
import { TelegramIntegrationCard } from "./telegram-integration-card";

// ─── Types ───

type ProviderName = "anthropic" | "openai" | "google" | "telegram";

interface ProviderStatus {
  provider: ProviderName;
  connected: boolean;
  lastChars: string | null;
}

interface ClassifiedModel {
  id: string;
  name: string;
  tier: "fast" | "balanced" | "powerful";
  tierLabel: string;
  provider: ProviderName;
}

// ─── Constants ───

const AI_PROVIDERS: { id: ProviderName; label: string; consoleUrl: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", consoleUrl: "https://console.anthropic.com/settings/keys" },
  { id: "openai", label: "OpenAI (GPT)", consoleUrl: "https://platform.openai.com/api-keys" },
  { id: "google", label: "Google (Gemini)", consoleUrl: "https://aistudio.google.com/apikey" },
];

const TASK_LABELS: Record<string, { label: string; description: string }> = {
  scoring: { label: "Chấm điểm sản phẩm", description: "Phân tích và xếp hạng sản phẩm affiliate" },
  content_brief: { label: "Tạo Brief nội dung", description: "Tạo kịch bản, câu mở đầu, prompts cho video" },
  channel_profile: { label: "Hồ sơ kênh", description: "Tạo character bible và video bible cho kênh" },
  morning_brief: { label: "Bản tin sáng", description: "Tóm tắt tình hình hàng ngày" },
  weekly_report: { label: "Báo cáo tuần", description: "Phân tích hiệu suất hàng tuần" },
  niche_intelligence: { label: "Phân tích ngách", description: "AI tư vấn ngách phù hợp cho người mới" },
  advisor: { label: "Cố vấn AI", description: "Phân tích CMO/CFO/CTO và quyết định CEO — nên dùng model mạnh" },
};

type TaskKey = keyof typeof TASK_LABELS;

interface TaskGroup {
  title: string;
  description: string;
  tasks: TaskKey[];
}

const TASK_GROUPS: TaskGroup[] = [
  {
    title: "Sản xuất nội dung",
    description: "Chấm điểm, tạo brief, xây dựng kênh",
    tasks: ["scoring", "content_brief", "channel_profile"],
  },
  {
    title: "Phân tích & Quyết định",
    description: "Báo cáo, phân tích xu hướng, cố vấn chiến lược",
    tasks: ["morning_brief", "weekly_report", "niche_intelligence", "advisor"],
  },
];

const DEFAULT_MODELS: Record<string, string> = {
  scoring: "claude-haiku-4-5-20251001",
  content_brief: "claude-sonnet-4-6",
  morning_brief: "claude-haiku-4-5-20251001",
  weekly_report: "claude-haiku-4-5-20251001",
  channel_profile: "claude-sonnet-4-6",
  niche_intelligence: "claude-sonnet-4-6",
  advisor: "claude-sonnet-4-6",
};

const TIER_ORDER: Record<string, number> = { powerful: 0, balanced: 1, fast: 2 };

// ─── Helpers ───

function detectDefaultProvider(
  savedModels: Record<string, string>,
  connectedProviders: ProviderName[]
): ProviderName {
  if (connectedProviders.length === 0) return "anthropic";
  if (connectedProviders.length === 1) return connectedProviders[0];

  // Count which provider is used most in saved model configs
  const counts: Record<string, number> = {};
  for (const modelId of Object.values(savedModels)) {
    if (modelId.startsWith("claude")) counts["anthropic"] = (counts["anthropic"] ?? 0) + 1;
    else if (modelId.startsWith("gpt") || modelId.startsWith("o1") || modelId.startsWith("o3") || modelId.startsWith("o4")) counts["openai"] = (counts["openai"] ?? 0) + 1;
    else if (modelId.startsWith("gemini")) counts["google"] = (counts["google"] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && connectedProviders.includes(sorted[0][0] as ProviderName)) {
    return sorted[0][0] as ProviderName;
  }

  return connectedProviders[0];
}

function findMatchingTierModel(
  models: ClassifiedModel[],
  currentModelId: string
): string | null {
  // Find what tier the current model is
  const currentModel = models.find((m) => m.id === currentModelId);
  const targetTier = currentModel?.tier;

  if (!targetTier) {
    // Guess tier from model name
    if (currentModelId.includes("haiku") || currentModelId.includes("mini") || currentModelId.includes("flash-lite") || currentModelId.includes("nano")) {
      return models.find((m) => m.tier === "fast")?.id ?? models[0]?.id ?? null;
    }
    if (currentModelId.includes("opus") || currentModelId.includes("pro") || currentModelId.startsWith("o1") || currentModelId.startsWith("o3") || currentModelId.startsWith("o4")) {
      return models.find((m) => m.tier === "powerful")?.id ?? models[0]?.id ?? null;
    }
    return models.find((m) => m.tier === "balanced")?.id ?? models[0]?.id ?? null;
  }

  return models.find((m) => m.tier === targetTier)?.id ?? models[0]?.id ?? null;
}

// ─── Component ───

export function SettingsPageClient(): React.ReactElement {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [models, setModels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dynamic models per provider
  const [allModels, setAllModels] = useState<Record<string, ClassifiedModel[]>>({});
  const [loadingModels, setLoadingModels] = useState(false);

  // API Keys card state
  const [selectedProvider, setSelectedProvider] = useState<ProviderName>("anthropic");
  const [keyInput, setKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Track if provider was manually changed (to trigger model auto-switch)
  const [providerManuallyChanged, setProviderManuallyChanged] = useState(false);

  // ─── Data loading ───

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, modelsRes] = await Promise.all([
        fetch("/api/settings/api-keys/status").then((r) => r.json()),
        fetch("/api/settings/ai-models").then((r) => r.json()),
      ]);
      const providerList: ProviderStatus[] = statusRes.providers ?? [];
      const savedModels: Record<string, string> = modelsRes.data ?? {};

      setProviders(providerList);
      setModels(savedModels);

      // Determine default provider from saved models (exclude telegram — not AI provider)
      const connected = providerList.filter((p: ProviderStatus) => p.connected && p.provider !== "telegram").map((p: ProviderStatus) => p.provider);
      const defaultProv = detectDefaultProvider(savedModels, connected);
      setSelectedProvider(defaultProv);

      // Fetch dynamic models for connected providers
      await loadModelsForProviders(providerList);
    } catch {
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadModelsForProviders(providerList: ProviderStatus[]): Promise<void> {
    const connected = providerList.filter((p) => p.connected && p.provider !== "telegram");
    if (connected.length === 0) return;

    setLoadingModels(true);
    const modelsByProvider: Record<string, ClassifiedModel[]> = {};

    const results = await Promise.allSettled(
      connected.map(async (p) => {
        const res = await fetch(`/api/settings/models?provider=${p.provider}`);
        const data = await res.json();
        return { provider: p.provider, models: (data.models ?? []) as ClassifiedModel[] };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        modelsByProvider[result.value.provider] = result.value.models;
      }
    }

    setAllModels(modelsByProvider);
    setLoadingModels(false);
  }

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // Auto-switch models when provider is manually changed
  useEffect(() => {
    if (!providerManuallyChanged) return;
    setProviderManuallyChanged(false);

    const providerModels = allModels[selectedProvider];
    if (!providerModels || providerModels.length === 0) return;

    setModels((prev) => {
      const updated = { ...prev };
      for (const taskType of Object.keys(TASK_LABELS)) {
        const currentModelId = prev[taskType] ?? DEFAULT_MODELS[taskType] ?? "";
        // Check if current model already belongs to selected provider
        const alreadyMatches = providerModels.some((m) => m.id === currentModelId);
        if (!alreadyMatches) {
          const replacement = findMatchingTierModel(providerModels, currentModelId);
          if (replacement) updated[taskType] = replacement;
        }
      }
      return updated;
    });
  }, [providerManuallyChanged, selectedProvider, allModels]);

  // ─── Derived state ───

  const currentStatus = providers.find((p) => p.provider === selectedProvider);
  const currentAiProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider)!;
  const connectedProviders = providers.filter((p) => p.connected && p.provider !== "telegram");
  const telegramStatus = providers.find((p) => p.provider === "telegram");
  const filteredModels = allModels[selectedProvider] ?? [];

  // For model dropdowns: show models of selected provider
  const sortedModels = [...filteredModels].sort(
    (a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)
  );

  // ─── Handlers ───

  async function handleTestAndSave(): Promise<void> {
    if (!keyInput.trim()) {
      toast.error("Nhập API key trước");
      return;
    }

    setTesting(true);
    try {
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

      toast.success(`Đã kết nối ${currentAiProvider.label}`);
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
      toast.success(`Đã xoá API key ${currentAiProvider.label}`);
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

  function handleProviderChange(newProvider: ProviderName): void {
    setSelectedProvider(newProvider);
    setKeyInput("");
    setProviderManuallyChanged(true);
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

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

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 mb-1.5 block">
              Chọn nhà cung cấp
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
              className="w-full sm:w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            >
              {AI_PROVIDERS.map((p) => {
                const status = providers.find((s) => s.provider === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.label} {status?.connected ? "✓" : ""}
                  </option>
                );
              })}
            </select>
          </div>

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
                <Button
                  onClick={() => void handleDeleteKey()}
                  disabled={deleting}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  title="Xoá API key"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </Button>
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
                    href={currentAiProvider.consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600/70 dark:text-amber-400/70 hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    {`Lấy key tại ${currentAiProvider.consoleUrl.replace("https://", "")}`}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Nhập ${currentAiProvider.label} API key`}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-mono"
                />
                <Button
                  onClick={() => void handleTestAndSave()}
                  disabled={testing || !keyInput.trim()}
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 shrink-0"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Kiểm tra
                </Button>
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

        {connectedProviders.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Kết nối ít nhất 1 provider ở phần API Keys để chọn model
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Chọn model cho từng loại tác vụ. Đang hiện models của{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {currentAiProvider.label}
              </span>
              . Đổi provider ở trên để xem models khác.
            </p>

            {loadingModels ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-36 bg-gray-200 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-56 bg-gray-100 dark:bg-slate-700/50 rounded" />
                    </div>
                    <div className="h-9 w-full sm:w-64 bg-gray-200 dark:bg-slate-700 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : sortedModels.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentStatus?.connected
                    ? "Không tìm thấy models cho provider này"
                    : "Provider chưa kết nối — kết nối API key trước"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {TASK_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {group.title}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {group.description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((taskType) => {
                        const meta = TASK_LABELS[taskType];
                        if (!meta) return null;
                        return (
                          <div
                            key={taskType}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3.5 bg-gray-50 dark:bg-slate-800 rounded-xl"
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
                              value={models[taskType] ?? DEFAULT_MODELS[taskType] ?? ""}
                              onChange={(e) => setModels((prev) => ({ ...prev, [taskType]: e.target.value }))}
                              className="w-full sm:w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            >
                              {sortedModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} — {m.tierLabel}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Models lấy trực tiếp từ API {currentAiProvider.label}
              </p>
              <Button
                onClick={() => void handleSaveModels()}
                disabled={saving || sortedModels.length === 0}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu cấu hình
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Card 3: Tích hợp — Telegram Bot */}
      <TelegramIntegrationCard
        status={telegramStatus}
        onRefresh={fetchAll}
      />
    </div>
  );
}
