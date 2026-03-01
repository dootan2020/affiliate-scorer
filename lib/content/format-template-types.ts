// Format Template type definitions

export interface FormatTemplateData {
  slug: string;
  name: string;
  description: string;
  goal: string;
  hookTemplate: string;
  bodyTemplate: string;
  proofTemplate: string;
  ctaTemplate: string;
  exampleScript: string;
}

/** 10 default format slugs from the spec */
export const DEFAULT_FORMAT_SLUGS = [
  "review",
  "myth-bust",
  "a-vs-b",
  "checklist",
  "story",
  "test",
  "react",
  "mini-drama",
  "series-challenge",
  "deal-breakdown",
] as const;

export type DefaultFormatSlug = (typeof DEFAULT_FORMAT_SLUGS)[number];

export const FORMAT_LABELS: Record<string, string> = {
  "review": "Review",
  "myth-bust": "Myth-bust",
  "a-vs-b": "A vs B",
  "checklist": "Checklist",
  "story": "Story",
  "test": "Test thực tế",
  "react": "React/Reaction",
  "mini-drama": "Mini Drama",
  "series-challenge": "Series Challenge",
  "deal-breakdown": "Deal Breakdown",
};
