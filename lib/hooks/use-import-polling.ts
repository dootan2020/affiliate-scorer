"use client";

import { useState, useEffect, useRef } from "react";

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

  // Effect to manage polling lifecycle
  useEffect(() => {
    if (!batchId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial state update is acceptable for polling setup
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPolling(true);

    const pollFn = async () => {
      try {
        const res = await fetch(`/api/imports/${batchId}/status`);
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
    };

    void pollFn();
    intervalRef.current = setInterval(() => {
      void pollFn();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [batchId]); // Only depend on batchId to avoid re-creating effect

  return { status, isPolling };
}
