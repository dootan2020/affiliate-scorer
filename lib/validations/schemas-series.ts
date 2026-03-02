// Zod validation schemas for Series + Episodes

import { z } from "zod/v4";

export const createSeriesSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["evergreen", "signature", "arc", "community"]),
  premise: z.string().optional(),
  openingRitual: z.string().optional(),
  closingRitual: z.string().optional(),
  proofRule: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
});

export const updateSeriesSchema = createSeriesSchema.partial();

export const createEpisodeSchema = z.object({
  episodeNumber: z.number().int().min(1),
  title: z.string().min(1).max(300),
  goal: z.enum(["awareness", "lead", "sale"]).optional(),
  formatSlug: z.string().optional(),
  pillar: z.string().optional(),
  contentAssetId: z.string().optional(),
  plannedDate: z.string().optional(), // ISO date
  status: z.enum(["draft", "ready", "produced", "published"]).optional(),
  notes: z.string().optional(),
});

export const updateEpisodeSchema = createEpisodeSchema.partial();

export const generateEpisodesSchema = z.object({
  count: z.number().int().min(1).max(30).default(10),
  goalDistribution: z.object({
    awareness: z.number().min(0).max(100).optional(),
    lead: z.number().min(0).max(100).optional(),
    sale: z.number().min(0).max(100).optional(),
  }).optional(),
});
