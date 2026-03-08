"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Loader2,
  Trash2,
  Send,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───

interface TelegramStatus {
  connected: boolean;
  lastChars: string | null;
}

interface TelegramIntegrationCardProps {
  status: TelegramStatus | undefined;
  onRefresh: () => Promise<void>;
}

// ─── Component ───

export function TelegramIntegrationCard({ status, onRefresh }: TelegramIntegrationCardProps): React.ReactElement {
  const [tokenInput, setTokenInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [botName, setBotName] = useState<string | null>(null);

  // Fetch bot info on mount if connected
  const fetchBotInfo = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const res = await fetch("/api/settings/api-keys/telegram-info");
      const data = await res.json();
      if (data.botUsername) setBotName(data.botUsername);
    } catch { /* non-critical */ }
  }, [status?.connected]);

  useEffect(() => { void fetchBotInfo(); }, [fetchBotInfo]);

  async function handleSave(): Promise<void> {
    if (!tokenInput.trim()) {
      toast.error("Nhập token trước");
      return;
    }
    setTesting(true);
    try {
      const testRes = await fetch("/api/settings/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "telegram", apiKey: tokenInput.trim() }),
      });
      const testData = await testRes.json();
      if (!testData.success) {
        toast.error(testData.error ?? "Token không hợp lệ");
        return;
      }
      if (testData.botUsername) setBotName(testData.botUsername);

      const saveRes = await fetch("/api/settings/api-keys/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "telegram", apiKey: tokenInput.trim() }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) {
        toast.error(saveData.error ?? "Lỗi khi lưu token");
        return;
      }
      if (saveData.webhookWarning) {
        toast.warning(`Webhook: ${saveData.webhookWarning}`);
      }
      toast.success("Đã kết nối Telegram Bot");
      setTokenInput("");
      await onRefresh();
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect(): Promise<void> {
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/api-keys/save?provider=telegram", { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Lỗi khi ngắt kết nối");
        return;
      }
      setBotName(null);
      toast.success("Đã ngắt kết nối Telegram Bot");
      await onRefresh();
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setDeleting(false);
    }
  }

  async function handleTestConnection(): Promise<void> {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/api-keys/telegram-info");
      const data = await res.json();
      if (data.botUsername) {
        setBotName(data.botUsername);
        toast.success(`Bot hoạt động: @${data.botUsername}`);
      } else {
        toast.error("Không thể kết nối tới bot");
      }
    } catch {
      toast.error("Lỗi kiểm tra kết nối");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <Link2 className="w-5 h-5 text-orange-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Tích hợp
        </h2>
      </div>

      <div className="space-y-4">
        {/* Telegram header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            <Send className="w-5 h-5 text-sky-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Telegram Bot</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Capture link TikTok qua Telegram</p>
          </div>
          {status?.connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Đã kết nối
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
              Chưa kết nối
            </span>
          )}
        </div>

        {status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1">
                {botName && (
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    @{botName}
                  </p>
                )}
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono mt-0.5">
                  {status.lastChars}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => void handleTestConnection()}
                  disabled={testing}
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Kiểm tra"}
                </Button>
                <Button
                  onClick={() => void handleDisconnect()}
                  disabled={deleting}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Ngắt kết nối"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Usage guide */}
            <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl">
              <p className="text-xs font-medium text-sky-700 dark:text-sky-300 mb-1.5">Cách sử dụng</p>
              <p className="text-xs text-sky-600/80 dark:text-sky-400/70 leading-relaxed">
                Mở Telegram → tìm <span className="font-medium">@{botName ?? "bot_name"}</span> → gửi{" "}
                <code className="bg-sky-100 dark:bg-sky-900/40 px-1 py-0.5 rounded text-[11px]">/start</code> → dùng{" "}
                <code className="bg-sky-100 dark:bg-sky-900/40 px-1 py-0.5 rounded text-[11px]">/channel</code> để chọn kênh → share link TikTok để capture
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Instructions */}
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">Hướng dẫn lấy token</p>
              <ol className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">1</span>
                  Mở Telegram, tìm <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">@BotFather</a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">2</span>
                  Gửi lệnh <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/newbot</code>, đặt tên bot
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">3</span>
                  Copy token dạng <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">123456:ABC-DEF...</code> dán vào đây
                </li>
              </ol>
            </div>

            {/* Token input */}
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Dán token từ @BotFather vào đây"
                className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none font-mono"
              />
              <Button
                onClick={() => void handleSave()}
                disabled={testing || !tokenInput.trim()}
                className="bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 shrink-0"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Lưu & Kết nối
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
