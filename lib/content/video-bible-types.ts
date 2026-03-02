// Type definitions for Video Bible (12 locks across 3 groups)

export interface VisualLocks {
  framing: string;
  lighting: string;
  composition: string;
  palette: string;
  editRhythm: string;
}

export interface AudioLocks {
  voiceStyleLock: string;
  sfxPack: string[];
  bgmMoods: string[];
  roomTone: string;
}

export interface NarrativeLocks {
  openingRitual: string;
  proofTokenRule: string;
  closingRitual: string;
}

export interface VideoBibleData {
  // Visual (5)
  framing?: string | null;
  lighting?: string | null;
  composition?: string | null;
  palette?: string | null;
  editRhythm?: string | null;
  // Audio (4)
  voiceStyleLock?: string | null;
  sfxPack?: string[] | null;
  bgmMoods?: string[] | null;
  roomTone?: string | null;
  // Narrative (3)
  openingRitual?: string | null;
  proofTokenRule?: string | null;
  closingRitual?: string | null;
  // Mode
  aiMode?: string;
}

export interface ShotCodeData {
  code: string;
  name: string;
  description?: string | null;
  durationHint?: string | null;
  camera?: string | null;
  notes?: string | null;
  sortOrder?: number;
}

export interface SceneTemplateBlock {
  blockType: string; // "tension" | "reveal" | "proof" | "payoff" | "cta"
  label: string;
  description: string;
}

export interface SceneTemplateRules {
  maxWords?: number;
  maxCuts?: number;
  subtitleStyle?: string;
}

export interface SceneTemplateData {
  name: string;
  slug: string;
  description?: string | null;
  blocks: SceneTemplateBlock[];
  defaultShotSequence?: string[];
  rules?: SceneTemplateRules | null;
}

export const AI_MODES = ["ai_only", "hybrid"] as const;
export type AiMode = (typeof AI_MODES)[number];

export const CAMERA_TYPES = ["close-up", "medium", "wide", "pov", "overhead", "tracking"] as const;

export const LOCK_GROUP_LABELS: Record<string, string> = {
  visual: "Visual Locks",
  audio: "Audio Locks",
  narrative: "Narrative Locks",
};
