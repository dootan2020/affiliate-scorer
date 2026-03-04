"use client";

import { useState, useEffect, useRef } from "react";

export interface ActiveBatch {
  id: string;
  fileName: string;
  source: string;
  recordCount: number;
  status: string;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsError: number;
  scoringStatus: string;
  completedAt: string | null;
}

const POLL_INTERVAL = 5000; // 5s — lighter than /sync page's 3s

/** Poll /api/imports/active for the global widget. */
export function useActiveImportBatch(): {
  batch: ActiveBatch | null;
  isPolling: boolean;
} {
  const [batch, setBatch] = useState<ActiveBatch | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsPolling(true);

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch("/api/imports/active");
        if (!res.ok) return;
        const data = await res.json();
        setBatch(data.data as ActiveBatch | null);
      } catch {
        // network error — keep polling silently
      }
    };

    void poll();
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, []);

  return { batch, isPolling };
}
