"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface UploadResult {
  batchId: string;
  format: string;
  totalParsed: number;
  afterDedup: number;
  saved: number;
}

interface UploadProgressProps {
  fileName: string | null;
  isUploading: boolean;
  result: UploadResult | null;
  error: string | null;
}

export function UploadProgress({
  fileName,
  isUploading,
  result,
  error,
}: UploadProgressProps): React.ReactElement | null {
  if (!fileName && !result && !error) return null;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      {fileName && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {result?.format === "fastmoss"
              ? "FastMoss"
              : result?.format === "kalodata"
                ? "KaloData"
                : "Đang xác định..."}
          </Badge>
          <span className="text-sm">{fileName}</span>
        </div>
      )}

      {isUploading && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Đang xử lý...</p>
          <Progress value={undefined} className="h-2" />
        </div>
      )}

      {result && (
        <div className="space-y-1 text-sm">
          <p className="text-green-600">
            Đã import {result.saved} sản phẩm thành công
          </p>
          <p className="text-muted-foreground">
            Tổng parse: {result.totalParsed} | Sau dedup: {result.afterDedup} |
            Đã lưu: {result.saved}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
