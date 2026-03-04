// Custom event system for suggestion widget refresh triggers
// Uses window.dispatchEvent — no dependencies needed

export const SUGGESTION_EVENTS = [
  "brief-created",
  "import-completed",
  "score-completed",
  "channel-updated",
  "calendar-updated",
  "learning-completed",
] as const;

export type SuggestionEventType = (typeof SUGGESTION_EVENTS)[number];

const EVENT_PREFIX = "suggestion:";

/** Dispatch a suggestion refresh event from any component */
export function dispatchSuggestionEvent(type: SuggestionEventType): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${type}`));
}

/** Subscribe to all suggestion events — returns cleanup function */
export function onSuggestionEvent(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  for (const type of SUGGESTION_EVENTS) {
    window.addEventListener(`${EVENT_PREFIX}${type}`, handler);
  }
  return () => {
    for (const type of SUGGESTION_EVENTS) {
      window.removeEventListener(`${EVENT_PREFIX}${type}`, handler);
    }
  };
}
