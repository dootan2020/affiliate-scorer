// Zod validation schemas for Video Bible, Shot Codes, Scene Templates

import { z } from "zod/v4";

export const upsertVideoBibleSchema = z.object({
  framing: z.string().optional(),
  lighting: z.string().optional(),
  composition: z.string().optional(),
  palette: z.string().optional(),
  editRhythm: z.string().optional(),
  voiceStyleLock: z.string().optional(),
  sfxPack: z.array(z.string()).optional(),
  bgmMoods: z.array(z.string()).optional(),
  roomTone: z.string().optional(),
  openingRitual: z.string().optional(),
  proofTokenRule: z.string().optional(),
  closingRitual: z.string().optional(),
  aiMode: z.enum(["ai_only", "hybrid"]).optional(),
});

export const createShotCodeSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  durationHint: z.string().optional(),
  camera: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateShotCodeSchema = createShotCodeSchema.partial();

export const createSceneTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  blocks: z.array(z.object({
    blockType: z.string(),
    label: z.string(),
    description: z.string(),
  })).min(1),
  defaultShotSequence: z.array(z.string()).optional(),
  rules: z.object({
    maxWords: z.number().int().optional(),
    maxCuts: z.number().int().optional(),
    subtitleStyle: z.string().optional(),
  }).optional(),
});

export const updateSceneTemplateSchema = createSceneTemplateSchema.partial();
