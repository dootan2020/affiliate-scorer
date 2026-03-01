"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2, Download, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormatTemplateForm } from "./format-template-form";

interface FormatTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  goal: string | null;
  hookTemplate: string | null;
  bodyTemplate: string | null;
  proofTemplate: string | null;
  ctaTemplate: string | null;
  exampleScript: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  channelId: string;
}

export function FormatBankList({ channelId }: Props): React.ReactElement {
  const [templates, setTemplates] = useState<FormatTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/format-templates`);
      const json = (await res.json()) as { data: FormatTemplate[] };
      setTemplates(json.data || []);
    } catch {
      toast.error("Lỗi tải format templates");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => { void fetchTemplates(); }, [fetchTemplates]);

  async function handleSeed(): Promise<void> {
    setSeeding(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/format-templates/seed`, { method: "POST" });
      const json = (await res.json()) as { data?: { created: number }; message?: string; error?: string };
      if (!res.ok) throw new Error(json.error || "Lỗi");
      toast.success(json.message || `Đã tạo ${json.data?.created} formats`);
      void fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm("Xoá format template này?")) return;
    try {
      await fetch(`/api/channels/${channelId}/format-templates/${id}`, { method: "DELETE" });
      toast.success("Đã xoá");
      void fetchTemplates();
    } catch {
      toast.error("Lỗi xoá");
    }
  }

  function toggleExpand(id: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  if (creating || editingId) {
    return (
      <FormatTemplateForm
        channelId={channelId}
        templateId={editingId}
        onSaved={() => { setCreating(false); setEditingId(null); void fetchTemplates(); }}
        onCancel={() => { setCreating(false); setEditingId(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        {templates.length === 0 && (
          <Button onClick={() => void handleSeed()} disabled={seeding} size="sm" variant="secondary"
            className="bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400">
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Tải 10 format mặc định
          </Button>
        )}
        <Button onClick={() => setCreating(true)} size="sm" variant="secondary">
          <Plus className="w-3.5 h-3.5" /> Thêm format
        </Button>
        {templates.length > 0 && templates.length < 10 && (
          <Button onClick={() => void handleSeed()} disabled={seeding} size="sm" variant="ghost" className="text-xs">
            {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Bổ sung format mặc định
          </Button>
        )}
      </div>

      {/* Format grid */}
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Chưa có format nào</p>
          <p className="text-xs text-gray-400">Nhấn "Tải 10 format mặc định" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(t.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">{t.slug}</span>
                    {t.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">Mặc định</span>}
                  </div>
                  {t.goal && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.goal}</p>}
                </div>
                {expanded.has(t.id) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>

              {expanded.has(t.id) && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2">
                  {t.description && <p className="text-xs text-gray-600 dark:text-gray-300">{t.description}</p>}
                  {t.hookTemplate && <TemplateRow label="Hook" value={t.hookTemplate} />}
                  {t.bodyTemplate && <TemplateRow label="Body" value={t.bodyTemplate} />}
                  {t.proofTemplate && <TemplateRow label="Proof" value={t.proofTemplate} />}
                  {t.ctaTemplate && <TemplateRow label="CTA" value={t.ctaTemplate} />}
                  {t.exampleScript && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 mt-2">
                      <span className="text-[10px] text-gray-400 uppercase">Ví dụ script</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{t.exampleScript}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => setEditingId(t.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Sửa
                    </button>
                    <button onClick={() => void handleDelete(t.id)} className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Xoá
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <span className="text-[10px] text-gray-400 uppercase">{label}</span>
      <p className="text-xs text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}
