"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TargetField {
  key: string;
  label: string;
}

interface ColumnMappingProps {
  headers: string[];
  sampleRows: Record<string, string>[];
  mapping: Record<string, string | null>;
  targetFields: TargetField[];
  format: string;
  aiDetected: boolean;
  totalRows: number;
  onConfirm: (mapping: Record<string, string | null>) => void;
  onCancel: () => void;
  isImporting: boolean;
}

export function ColumnMapping({
  headers,
  sampleRows,
  mapping: initialMapping,
  targetFields,
  format,
  aiDetected,
  totalRows,
  onConfirm,
  onCancel,
  isImporting,
}: ColumnMappingProps): React.ReactElement {
  const [mapping, setMapping] = useState<Record<string, string | null>>(
    initialMapping
  );

  function handleChange(targetKey: string, sourceCol: string): void {
    setMapping((prev) => ({
      ...prev,
      [targetKey]: sourceCol === "__skip__" ? null : sourceCol,
    }));
  }

  const mappedName = mapping.name;
  const hasValidName = mappedName && headers.includes(mappedName);

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
          {format === "fastmoss"
            ? "FastMoss"
            : format === "kalodata"
              ? "KaloData"
              : format === "ai_detected"
                ? "AI Detected"
                : "Custom"}
        </span>
        {aiDetected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3 h-3" />
            AI tự nhận diện
          </span>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {totalRows} dòng | {headers.length} cột
        </span>
      </div>

      {/* Mapping table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3 w-1/3">
                Trường hệ thống
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3 w-1/3">
                Cột nguồn
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-3 w-1/3">
                Giá trị mẫu
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {targetFields.map((field) => {
              const selectedCol = mapping[field.key] ?? "__skip__";
              const sampleValue =
                selectedCol !== "__skip__" && sampleRows[0]
                  ? sampleRows[0][selectedCol] ?? ""
                  : "";

              return (
                <tr
                  key={field.key}
                  className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <span className="text-gray-900 dark:text-gray-100">
                      {field.label}
                      {field.key === "name" && (
                        <span className="text-rose-500 ml-0.5">*</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="relative">
                      <select
                        value={selectedCol}
                        onChange={(e) =>
                          handleChange(field.key, e.target.value)
                        }
                        className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      >
                        <option value="__skip__">-- Bỏ qua --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-mono truncate block max-w-[200px]">
                      {sampleValue || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sample data preview */}
      {sampleRows.length > 0 && (
        <details className="group">
          <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Xem dữ liệu mẫu ({sampleRows.length} dòng đầu)
          </summary>
          <div className="mt-2 overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800">
                  {headers.slice(0, 8).map((h) => (
                    <th
                      key={h}
                      className="text-left font-medium text-gray-500 dark:text-gray-400 px-3 py-2 whitespace-nowrap"
                    >
                      {h.length > 20 ? h.slice(0, 20) + "…" : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {sampleRows.map((row, i) => (
                  <tr key={i}>
                    {headers.slice(0, 8).map((h) => (
                      <td
                        key={h}
                        className="px-3 py-1.5 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[150px] truncate"
                      >
                        {row[h] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => onConfirm(mapping)}
          disabled={!hasValidName || isImporting}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-600"
        >
          <Check className="w-4 h-4" />
          {isImporting ? "Đang import..." : `Xác nhận import ${totalRows} sản phẩm`}
        </Button>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isImporting}
        >
          <X className="w-4 h-4" />
          Hủy
        </Button>
        {!hasValidName && (
          <p className="text-sm text-rose-500">
            Phải chọn cột cho "Tên sản phẩm"
          </p>
        )}
      </div>
    </div>
  );
}
