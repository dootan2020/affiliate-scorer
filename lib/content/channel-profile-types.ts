export interface ChannelProfileInput {
  niche: string;
  targetAudience: string;
  tone: string;
}

export interface VideoFormatRecommendation {
  contentType: string;
  primaryFormat: string;
  secondaryFormat: string;
  aiToolSuggestion: string;
  productionNotes: string;
}

export interface ChannelProfileResult {
  name: string;
  handle: string;
  personaName: string;
  personaDesc: string;
  subNiche: string;
  usp: string;
  contentPillars: string[];
  contentPillarDetails: Array<{
    pillar: string;
    aiFeasibility: "high" | "medium" | "low";
    recommendedFormats: string[];
    productionNotes: string;
  }>;
  hookBank: string[];
  contentMix: {
    review: number;
    lifestyle: number;
    tutorial: number;
    selling: number;
    entertainment: number;
  };
  contentMixReason: string;
  videoFormats: VideoFormatRecommendation[];
  productionStyle: "voiceover_broll" | "talking_head" | "product_showcase" | "hybrid";
  productionStyleReason: string;
  postsPerDay: number;
  postingSchedule: Record<string, { times: string[]; focus: string }>;
  seriesSchedule: Array<{
    name: string;
    dayOfWeek: string;
    contentPillar: string;
  }>;
  ctaTemplates: {
    entertainment: string;
    education: string;
    review: string;
    selling: string;
  };
  competitorChannels: Array<{
    handle: string;
    followers: string;
    whyReference: string;
  }>;
  voiceStyle: string;
  editingStyle: string;
  fontStyle: string;
  colorPrimary: string;
  colorSecondary: string;
}
