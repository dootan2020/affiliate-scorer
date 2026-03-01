"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  channelId: string;
  templateId: string | null; // null = create new
  onSaved: () => void;
  onCancel: () => void;
}

const inputCls = "w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500";

export function FormatTemplateForm({ channelId, templateId, onSaved, onCancel }: Props): React.ReactElement {
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", goal: "",
    hookTemplate: "", bodyTemplate: "", proofTemplate: "", ctaTemplate: "",
    exampleScript: "",
  });

  useEffect(() => {
    if (!templateId) return;
    fetch(`/api/channels/${channelId}/format-templates`)
      .then((r) => r.json())
      .then((json: { data: Array<{ id: string; name: string; slug: string; description: string | null; goal: string | null; hookTemplate: string | null; bodyTemplate: string | null; proofTemplate: string | null; ctaTemplate: string | null; exampleScript: string | null }> }) => {
        const t = json.data.find((d) => d.id === templateId);
        if (t) {
          setForm({
            name: t.name, slug: t.slug,
            description: t.description || "", goal: t.goal || "",
            hookTemplate: t.hookTemplate || "", bodyTemplate: t.bodyTemplate || "",
            proofTemplate: t.proofTemplate || "", ctaTemplate: t.ctaTemplate || "",
            exampleScript: t.exampleScript || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [channelId, templateId]);

  async function handleSubmit(): Promise<void> {
    if (!form.name || !form.slug) {
      toast.error("Tên và slug là bắt buộc");
      return;
    }
    setSaving(true);
    try {
      const url = templateId
        ? `/api/channels/${channelId}/format-templates/${templateId}`
        : `/api/channels/${channelId}/format-templates`;
      const res = await fetch(url, {
        method: templateId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Lỗi lưu");
      toast.success(templateId ? "Đã cập nhật" : "Đã tạo format mới");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tên format *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Review" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Slug *</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className={inputCls} placeholder="review" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mô tả</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mục tiêu</label>
        <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className={inputCls} placeholder="Trust + soft sell" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hook Template</label>
          <textarea value={form.hookTemplate} onChange={(e) => setForm({ ...form, hookTemplate: e.target.value })} className={inputCls} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Body Template</label>
          <textarea value={form.bodyTemplate} onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })} className={inputCls} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Proof Template</label>
          <textarea value={form.proofTemplate} onChange={(e) => setForm({ ...form, proofTemplate: e.target.value })} className={inputCls} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">CTA Template</label>
          <textarea value={form.ctaTemplate} onChange={(e) => setForm({ ...form, ctaTemplate: e.target.value })} className={inputCls} rows={2} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Ví dụ script</label>
        <textarea value={form.exampleScript} onChange={(e) => setForm({ ...form, exampleScript: e.target.value })} className={inputCls} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel} variant="ghost" size="sm">Huỷ</Button>
        <Button onClick={() => void handleSubmit()} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {templateId ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </div>
  );
}
