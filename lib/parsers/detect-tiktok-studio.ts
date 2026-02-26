// Detect TikTok Studio export file type from filename

export type TikTokStudioFileType =
  | "content"
  | "overview"
  | "follower_activity"
  | "viewers"
  | "follower_history"
  | "follower_gender"
  | "follower_territories"
  | "unknown";

export function detectTikTokStudioFileType(fileName: string): TikTokStudioFileType {
  const lower = fileName.toLowerCase().replace(/[\s-]/g, "");

  if (lower.includes("followeractivity") || lower.includes("follower_activity")) {
    return "follower_activity";
  }
  if (lower.includes("followerhistory") || lower.includes("follower_history")) {
    return "follower_history";
  }
  if (lower.includes("followergender") || lower.includes("follower_gender")) {
    return "follower_gender";
  }
  if (lower.includes("topterritories") || lower.includes("top_territories")) {
    return "follower_territories";
  }
  if (lower.includes("viewers")) return "viewers";
  if (lower.includes("overview")) return "overview";
  if (lower.includes("content")) return "content";

  return "unknown";
}

export const FILE_TYPE_LABELS: Record<TikTokStudioFileType, string> = {
  content: "Nội dung (Content)",
  overview: "Tổng quan (Overview)",
  follower_activity: "Hoạt động follower",
  viewers: "Người xem",
  follower_history: "Lịch sử follower",
  follower_gender: "Giới tính follower",
  follower_territories: "Vùng lãnh thổ",
  unknown: "Không xác định",
};
