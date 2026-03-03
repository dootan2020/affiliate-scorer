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
  /** True when polling stopped due to MAX_POLLS safety limit */
  timedOut?: boolean;
}

const POLL_INTERVAL = 3000;
const MAX_POLLS = 100; // ~5 minutes safety limit

/** Poll /api/imports/[id]/status until terminal state. */
export function useImportPolling(batchId: string | null): {
  status: ImportStatus | null;
  isPolling: boolean;
} {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // Reset status when batchId clears — prevents stale results
  useEffect(() => {
    if (!batchId) setStatus(null);
  }, [batchId]);

  // Effect to manage polling lifecycle
  useEffect(() => {
    if (!batchId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    pollCountRef.current = 0;

    // Initial state update is acceptable for polling setup
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPolling(true);

    const stopPolling = (): void => {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const pollFn = async (): Promise<void> => {
      pollCountRef.current++;
      if (pollCountRef.current > MAX_POLLS) {
        // Mark timeout so UI can show feedback
        setStatus((prev) => prev ? { ...prev, timedOut: true } : prev);
        stopPolling();
        return;
      }

      try {
        const res = await fetch(`/api/imports/${batchId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        const s = data.data as ImportStatus;
        setStatus(s);

        if (s.isTerminal) stopPolling();
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
