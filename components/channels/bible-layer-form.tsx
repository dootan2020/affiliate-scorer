"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface StringListProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function StringListEditor({ label, values, onChange, placeholder }: StringListProps): React.ReactElement {
  const [draft, setDraft] = useState("");

  function handleAdd(): void {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  }

  function handleRemove(index: number): void {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <div className="space-y-1.5 mb-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{v}</span>
            <button onClick={() => handleRemove(i)} className="text-gray-400 hover:text-rose-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          placeholder={placeholder || "Thêm mới..."}
          className="flex-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-gray-100 dark:bg-slate-700 px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}

export function TextField({ label, value, onChange, multiline, placeholder }: TextFieldProps): React.ReactElement {
  const cls = "w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500";

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  );
}
