"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ImportStatus {
  id: string;
  source: string;
  fileName: string;
  recordCount: number;
  status: string;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsError: number;
  scoringStatus: string;
  errorLog: unknown;
  completedAt: string | null;
  isTerminal: boolean;
  progress: number;
}

const POLL_INTERVAL = 3000;

/** Poll /api/imports/[id]/status until terminal state. */
export function useImportPolling(batchId: string | null): {
  status: ImportStatus | null;
  isPolling: boolean;
} {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/imports/${id}/status`);
      if (!res.ok) return;
      const data = await res.json();
      const s = data.data as ImportStatus;
      setStatus(s);

      if (s.isTerminal) {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // network error, keep polling
    }
  }, []);

  useEffect(() => {
    if (!batchId) {
      setStatus(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    // Immediate first poll
    poll(batchId);

    intervalRef.current = setInterval(() => poll(batchId), POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [batchId, poll]);

  return { status, isPolling };
}
