export interface QuestionnaireAnswers {
  interests: string[]; // niche categories: "beauty_skincare", "fashion", "food", etc.
  experience: "beginner" | "intermediate" | "expert";
  goals: string[]; // "passive_income", "full_time", "brand_building", "quick_money"
  contentStyle: string[]; // "entertaining", "educational", "review", "lifestyle"
  budget: "zero" | "low" | "medium" | "high"; // monthly budget for ads/tools
}

export interface NicheRecommendation {
  nicheKey: string; // "beauty_skincare", "home_living", etc.
  nicheLabel: string; // Vietnamese label
  score: number; // 0-100 match score
  reasoning: string; // Why this niche fits
  marketInsight: string; // Market data/trends
  competitionLevel: "low" | "medium" | "high";
  contentIdeas: string[]; // 3-4 starter content ideas
  estimatedEarning: string; // Monthly earning estimate range
}

export interface NicheAnalysisResult {
  recommendations: NicheRecommendation[];
  summary: string; // Overall analysis summary
}

export interface NicheStats {
  nicheKey: string;
  productCount: number;
  avgScore: number | null;
  topProducts: Array<{ title: string; score: number }>;
  channelCount: number;
}
