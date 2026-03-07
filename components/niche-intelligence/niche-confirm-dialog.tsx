"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { NicheRecommendation } from "@/lib/niche-intelligence/types";

interface NicheConfirmDialogProps {
  recommendation: NicheRecommendation | null;
  onConfirm: (rec: NicheRecommendation) => void;
  onCancel: () => void;
}

export function NicheConfirmDialog({
  recommendation,
  onConfirm,
  onCancel,
}: NicheConfirmDialogProps): React.ReactElement {
  const [loading, setLoading] = useState(false);

  const handleConfirm = (): void => {
    if (!recommendation) return;
    setLoading(true);
    onConfirm(recommendation);
  };

  return (
    <Dialog
      open={recommendation !== null}
      onOpenChange={(open) => { if (!open && !loading) onCancel(); }}
    >
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Xác nhận chọn ngách</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ tạo kênh TikTok mới cho bạn với ngách này.
          </DialogDescription>
        </DialogHeader>

        {recommendation && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4">
              <Sparkles className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {recommendation.nicheLabel}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Độ phù hợp: {recommendation.score}/100
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {recommendation.reasoning.split(/[.!。]/)[0].trim()}.
            </p>
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo kênh...
              </>
            ) : (
              "Xác nhận tạo kênh"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
