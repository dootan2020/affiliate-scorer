"use client";

import { useState, useCallback } from "react";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MappingPreview {
  entryName: string;
  productName: string | null;
  confidence: number;
  autoMapped: boolean;
}

interface UploadResult {
  format: string;
  totalParsed: number;
  autoMapped: number;
  saved: number;
  mappings: MappingPreview[];
}

const FORMAT_LABELS: Record<string, string> = {
  fb_ads: "Facebook Ads Manager",
  tiktok_ads: "TikTok Ads",
  shopee_affiliate: "Shopee Affiliate",
};

export function FeedbackUpload(): React.ReactElement {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus("uploading");
    setResult(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/feedback", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as { data?: UploadResult; error?: string; message?: string };

      if (!res.ok) {
        setErrorMsg(json.error ?? "Lỗi không xác định");
        setStatus("error");
        return;
      }

      setResult(json.data ?? null);
      setStatus("done");
    } catch {
      setErrorMsg("Lỗi kết nối. Vui lòng thử lại.");
      setStatus("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMsg(null);
  }, []);

  return (
    <div className="space-y-4">
      {status === "idle" || status === "uploading" ? (
        <FileDropzone
          onFileSelect={handleFileSelect}
          label="Upload file Feedback (Facebook Ads / TikTok Ads / Shopee Affiliate)"
          sublabel="Hỗ trợ .csv, .xlsx, .xls"
          disabled={status === "uploading"}
        />
      ) : null}

      {status === "uploading" && (
        <p className="text-sm text-center text-muted-foreground">Đang xử lý file...</p>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMsg}
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>Thử lại</Button>
        </div>
      )}

      {status === "done" && result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                Kết quả upload
                <Badge variant="secondary">{FORMAT_LABELS[result.format] ?? result.format}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Tổng dòng: <span className="font-medium">{result.totalParsed}</span></p>
              <p>Tự động ghép sản phẩm: <span className="font-medium">{result.autoMapped}</span></p>
              <p>Đã lưu: <span className="font-medium text-green-600">{result.saved}</span></p>
            </CardContent>
          </Card>

          {result.mappings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Xem trước ghép sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.mappings.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0">
                      <span className="truncate max-w-[40%] text-muted-foreground">{m.entryName}</span>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="truncate max-w-[35%] font-medium">{m.productName ?? "Chưa ghép"}</span>
                      <Badge
                        variant={m.autoMapped ? "default" : "secondary"}
                        className="ml-2 shrink-0 text-xs"
                      >
                        {m.confidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" size="sm" onClick={handleReset}>Upload thêm</Button>
        </div>
      )}
    </div>
  );
}
