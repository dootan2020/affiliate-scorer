export interface ChannelProfileInput {
  niche: string;
  targetAudience: string;
  tone: string;
}

export interface ChannelProfileResult {
  name: string;
  handle: string;
  personaName: string;
  personaDesc: string;
  subNiche: string;
  usp: string;
  contentPillars: string[];
  hookBank: string[];
  contentMix: {
    entertainment: number;
    education: number;
    review: number;
    selling: number;
  };
  contentMixReason: string;
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
