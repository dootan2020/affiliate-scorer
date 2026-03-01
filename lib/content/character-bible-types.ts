// Character Bible type definitions — 7 layers + consistency locks

export interface Relationship {
  name: string;
  role: string; // "sidekick" | "mentor" | "anti-fan" | "rival"
  personality: string;
  catchphrase: string;
  dynamic: string; // how they interact with main character
}

export interface WorldRule {
  rule: string;
  effect: string; // what content it generates
}

export interface LivingSpace {
  name: string;
  mood: string;
  visualDesc: string;
}

export interface StoryArc {
  chapter: number; // 1, 2, 3
  weeks: string; // "1-4", "5-8", "9-12"
  title: string;
  description: string;
}

export interface VisualLocks {
  props: string[];
  texture: string;
  colorPalette: string;
}

export interface VoiceDna {
  tone: string;
  pace: string;
  signature: string;
}

/** Full Character Bible data — matches Prisma CharacterBible model */
export interface CharacterBibleData {
  // Layer 1: Core
  coreValues: string[];
  coreFear: string;
  crisisResponse: string;
  redLines: string[];

  // Layer 2: Relationships
  relationships: Relationship[];

  // Layer 3: World Rules
  worldRules: WorldRule[];
  weaknesses: string[];

  // Layer 4: Origin
  originWound: string;
  originVow: string;
  originSymbol: string;

  // Layer 5: Living Spaces
  livingSpaces: LivingSpace[];

  // Layer 6: Story Arcs
  storyArcs: StoryArc[];

  // Layer 7: Language
  catchphrases: string[];
  insideJokes: string[];
  rituals: string[];
  vocabularyRules: string[];

  // Locks
  visualLocks: VisualLocks;
  voiceDna: VoiceDna;
}

/** Layers enum for Idea Matrix cross-referencing */
export const BIBLE_LAYER_KEYS = [
  "core_beliefs",
  "relationships",
  "world_rules",
  "origin",
  "living_spaces",
  "story_arcs",
  "language",
] as const;

export type BibleLayerKey = (typeof BIBLE_LAYER_KEYS)[number];

export const BIBLE_LAYER_LABELS: Record<BibleLayerKey, string> = {
  core_beliefs: "Niềm tin cốt lõi",
  relationships: "Nhân vật phụ",
  world_rules: "Luật thế giới",
  origin: "Câu chuyện gốc",
  living_spaces: "Bối cảnh",
  story_arcs: "Arc mùa",
  language: "Ngôn ngữ & Ritual",
};
