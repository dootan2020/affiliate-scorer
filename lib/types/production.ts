// Shared types for Production page

export interface ProductLinks {
  tiktokShop: string | null;
  fastmossProduct: string | null;
  fastmossShop: string | null;
}

export interface BriefProductInfo {
  id: string;
  title: string | null;
  shopName: string | null;
  imageUrl: string | null;
  price: number | null;
  productIdExternal: string | null;
  combinedScore: number | null;
  product: {
    shopRating: number | null;
    salesTotal: number | null;
  } | null;
  urls: Array<{ url: string; urlType: string }>;
}

export interface AssetWithStatus {
  id: string;
  assetCode: string | null;
  format: string | null;
  hookText: string | null;
  hookType: string | null;
  angle: string | null;
  scriptText: string | null;
  captionText: string | null;
  hashtags: string[];
  ctaText: string | null;
  videoPrompts: Scene[];
  complianceStatus: string | null;
  complianceNotes: string | null;
  status: string;
}

export interface Scene {
  scene: number;
  start_s: number;
  end_s: number;
  description?: string;
  prompt_kling?: string;
  prompt_veo3?: string;
  text_overlay?: string;
  audio_note?: string;
}

export interface BriefWithProduct {
  id: string;
  angles: string[];
  hooks: Array<{ text: string; type: string }>;
  assets: AssetWithStatus[];
  status: string;
  createdAt: string;
  productIdentity: BriefProductInfo;
}

/** Map DB asset status → Vietnamese UI label */
export const VIDEO_STATUS_MAP: Record<string, string> = {
  draft: "Chưa quay",
  produced: "Đã quay",
  rendered: "Đang edit",
  published: "Đã đăng",
  archived: "Bỏ",
};

export const VIDEO_STATUSES = ["draft", "produced", "rendered", "published", "archived"] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];
