"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Target } from "lucide-react";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { ImportDetectionCard } from "@/components/upload/import-detection-card";

interface DetectionData {
  type: string;
  confidence: string;
  reason: string;
  rowsTotal: number;
  headers: string[];
}

interface ImportResult {
  importId: string;
  format: string;
  confidence: string;
  reason: string;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  rowsError: number;
  campaignsCreated: number;
  campaignsUpdated: number;
  financialRecordsCreated: number;
  errors: Array<{ row: number; message: string }>;
}

interface CampaignImportZoneProps {
  onImportComplete?: () => void;
}

export function CampaignImportZone({
  onImportComplete,
}: CampaignImportZoneProps): React.ReactElement {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<DetectionData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportFileSelect = useCallback(async (file: File) => {
    setImportFile(file);
    setIsDetecting(true);
    setDetection(null);
    setImportResult(null);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/import/detect", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi nhận dạng file");
      }

      setDetection(data.data as DetectionData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi không xác định";
      setImportError(message);
      toast.error(message);
      setImportFile(null);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const handleConfirmImport = useCallback(
    async (fileType: string) => {
      if (!importFile) return;
      setIsImporting(true);
      setImportError(null);

      try {
        const formData = new FormData();
        formData.append("file", importFile);
        formData.append("fileType", fileType);

        const res = await fetch("/api/upload/import", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Lỗi import");
        }

        setImportResult(data.data as ImportResult);
        setDetection(null);
        setImportFile(null);
        toast.success(data.message);
        onImportComplete?.();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Lỗi không xác định";
        setImportError(message);
        toast.error(message);
      } finally {
        setIsImporting(false);
      }
    },
    [importFile, onImportComplete]
  );

  const handleCancel = useCallback(() => {
    setDetection(null);
    setImportFile(null);
    setImportError(null);
    setImportResult(null);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Ket qua chien dich
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload ket qua tu FB Ads, TikTok Ads, Shopee — AI se hoc tu data nay
          </p>
        </div>
      </div>

      {/* Dropzone - show when no file is selected */}
      {!detection && !isDetecting && !importResult && (
        <FileDropzone
          onFileSelect={handleImportFileSelect}
          label="Keo tha file ket qua vao day"
          sublabel="FB Ads, TikTok Ads, Shopee (.csv, .xlsx)"
          disabled={isDetecting || isImporting}
        />
      )}

      {/* Detecting spinner */}
      {isDetecting && (
        <div className="rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dang nhan dang loai file...
          </p>
        </div>
      )}

      {/* Detection card */}
      {detection && importFile && (
        <ImportDetectionCard
          fileName={importFile.name}
          detection={detection}
          onConfirm={handleConfirmImport}
          onCancel={handleCancel}
          isImporting={isImporting}
        />
      )}

      {/* Import result */}
      {importResult && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 p-4 space-y-2">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Import thanh cong
          </p>
          <div className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
            <p>
              {importResult.rowsImported}/{importResult.rowsTotal} dong da
              import
            </p>
            {importResult.campaignsCreated > 0 && (
              <p>{importResult.campaignsCreated} campaigns moi</p>
            )}
            {importResult.campaignsUpdated > 0 && (
              <p>{importResult.campaignsUpdated} campaigns cap nhat</p>
            )}
            {importResult.financialRecordsCreated > 0 && (
              <p>
                {importResult.financialRecordsCreated} ban ghi tai chinh
              </p>
            )}
            {importResult.rowsError > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                {importResult.rowsError} dong loi
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="mt-2 text-sm text-emerald-700 dark:text-emerald-300 underline underline-offset-2 hover:no-underline"
          >
            Import file khac
          </button>
        </div>
      )}

      {/* Error */}
      {importError && !detection && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 p-4">
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {importError}
          </p>
          <button
            onClick={handleCancel}
            className="mt-2 text-sm text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:no-underline"
          >
            Thu lai
          </button>
        </div>
      )}
    </div>
  );
}
