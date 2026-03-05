// Build human-readable Vietnamese reason string for why a product is suggested

export interface ReasonInput {
  combinedScore: number | null;
  categoryWeight: number | null;
  category: string | null;
  deltaType: string | null;
  calendarEvent: { name: string } | null;
  tag: "proven" | "explore";
  lifecycleStage: string | null;
  contentMixMatch: boolean;
}

export function buildSuggestionReason(input: ReasonInput): string {
  const parts: string[] = [];

  if (input.tag === "explore") {
    parts.push("Chưa thử — có thể là hit mới");
  }
  if (input.deltaType === "SURGE" || input.deltaType === "NEW") {
    parts.push("Đang tăng mạnh");
  }
  if (input.calendarEvent) {
    parts.push(`Phù hợp ${input.calendarEvent.name}`);
  }
  if (input.categoryWeight && input.categoryWeight > 1.0) {
    parts.push(`${input.category || "Danh mục"} đang hiệu quả`);
  }
  if ((input.combinedScore ?? 0) >= 80) {
    parts.push(`Điểm ${input.combinedScore}/100`);
  }
  if (input.lifecycleStage === "peak") {
    parts.push("Đang ở đỉnh — nên sớm");
  }
  if (input.contentMixMatch) {
    parts.push("Phù hợp content mix kênh");
  }

  return parts.slice(0, 2).join(" · ") || "Tiềm năng tốt";
}
