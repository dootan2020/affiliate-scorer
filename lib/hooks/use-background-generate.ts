"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TaskData {
  id: string;
  status: string;
  progress: number;
  detail: string | null;
  error: string | null;
  result: unknown;
}

interface UseBackgroundGenerateReturn {
  /** Start a background task by calling the endpoint. */
  start: (url: string, options?: { method?: string; body?: unknown }) => Promise<string | null>;
  /** Current task status. */
  status: "idle" | "processing" | "completed" | "failed";
  /** Task result (available when completed, for endpoints that store result). */
  result: unknown;
  /** Error message if failed. */
  error: string | null;
  /** Reset to idle state. */
  reset: () => void;
}

const POLL_INTERVAL = 2000;

/**
 * Hook for calling non-blocking AI endpoints.
 * Endpoint returns { taskId }, hook polls until completed/failed.
 * Calls onComplete when task finishes successfully.
 */
export function useBackgroundGenerate(
  onComplete?: () => void,
): UseBackgroundGenerateReturn {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<UseBackgroundGenerateReturn["status"]>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Poll task status
  useEffect(() => {
    if (!taskId || status !== "processing") return;

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data: TaskData };
        const task = json.data;

        if (task.status === "completed") {
          setStatus("completed");
          setResult(task.result);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onCompleteRef.current?.();
        } else if (task.status === "failed") {
          setStatus("failed");
          setError(task.error);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // network error — keep polling
      }
    };

    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL);
    // Poll immediately
    void poll();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [taskId, status]);

  const start = useCallback(async (
    url: string,
    options?: { method?: string; body?: unknown },
  ): Promise<string | null> => {
    setStatus("processing");
    setResult(null);
    setError(null);

    try {
      const res = await fetch(url, {
        method: options?.method ?? "POST",
        headers: options?.body ? { "Content-Type": "application/json" } : undefined,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      const json = (await res.json()) as { taskId?: string; error?: string };

      if (!res.ok || !json.taskId) {
        setStatus("failed");
        setError(json.error ?? `Lỗi ${res.status}`);
        return null;
      }

      setTaskId(json.taskId);
      return json.taskId;
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTaskId(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { start, status, result, error, reset };
}
