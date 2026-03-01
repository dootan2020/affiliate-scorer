import { z } from "zod/v4";

// ─── Character Bible ───

const relationshipSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  personality: z.string().min(1),
  catchphrase: z.string(),
  dynamic: z.string(),
});

const worldRuleSchema = z.object({
  rule: z.string().min(1),
  effect: z.string(),
});

const livingSpaceSchema = z.object({
  name: z.string().min(1),
  mood: z.string(),
  visualDesc: z.string(),
});

const storyArcSchema = z.object({
  chapter: z.number().int().min(1),
  weeks: z.string(),
  title: z.string().min(1),
  description: z.string(),
});

const visualLocksSchema = z.object({
  props: z.array(z.string()),
  texture: z.string(),
  colorPalette: z.string(),
});

const voiceDnaSchema = z.object({
  tone: z.string(),
  pace: z.string(),
  signature: z.string(),
});

export const upsertCharacterBibleSchema = z.object({
  coreValues: z.array(z.string()).optional(),
  coreFear: z.string().optional(),
  crisisResponse: z.string().optional(),
  redLines: z.array(z.string()).optional(),
  relationships: z.array(relationshipSchema).optional(),
  worldRules: z.array(worldRuleSchema).optional(),
  weaknesses: z.array(z.string()).optional(),
  originWound: z.string().optional(),
  originVow: z.string().optional(),
  originSymbol: z.string().optional(),
  livingSpaces: z.array(livingSpaceSchema).optional(),
  storyArcs: z.array(storyArcSchema).optional(),
  catchphrases: z.array(z.string()).optional(),
  insideJokes: z.array(z.string()).optional(),
  rituals: z.array(z.string()).optional(),
  vocabularyRules: z.array(z.string()).optional(),
  visualLocks: visualLocksSchema.optional(),
  voiceDna: voiceDnaSchema.optional(),
});

export const generateCharacterBibleSchema = z.object({
  channelId: z.string().min(1),
});

// ─── Format Template ───

export const createFormatTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
  description: z.string().optional(),
  goal: z.string().optional(),
  hookTemplate: z.string().optional(),
  bodyTemplate: z.string().optional(),
  proofTemplate: z.string().optional(),
  ctaTemplate: z.string().optional(),
  exampleScript: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateFormatTemplateSchema = createFormatTemplateSchema.partial();

// ─── Idea Matrix ───

export const generateIdeaMatrixSchema = z.object({
  channelId: z.string().min(1),
});

export const updateIdeaMatrixItemSchema = z.object({
  status: z.enum(["fresh", "picked", "briefed", "dismissed"]).optional(),
  notes: z.string().optional(),
});

// ─── Type exports ───

export type UpsertCharacterBibleInput = z.infer<typeof upsertCharacterBibleSchema>;
export type GenerateCharacterBibleInput = z.infer<typeof generateCharacterBibleSchema>;
export type CreateFormatTemplateInput = z.infer<typeof createFormatTemplateSchema>;
export type UpdateFormatTemplateInput = z.infer<typeof updateFormatTemplateSchema>;
export type GenerateIdeaMatrixInput = z.infer<typeof generateIdeaMatrixSchema>;
export type UpdateIdeaMatrixItemInput = z.infer<typeof updateIdeaMatrixItemSchema>;
