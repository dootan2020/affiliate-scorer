import { z } from "zod/v4";

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  productId: z.string().optional(),
  plannedBudgetDaily: z.number().optional(),
  plannedDurationDays: z.number().int().positive().optional(),
  affiliateLink: z.string().optional(),
  contentUrl: z.string().optional(),
  contentType: z.string().optional(),
  contentNotes: z.string().optional(),
  status: z.string().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  productId: z.string().nullable().optional(),
  plannedBudgetDaily: z.number().nullable().optional(),
  plannedDurationDays: z.number().int().nullable().optional(),
  affiliateLink: z.string().nullable().optional(),
  contentUrl: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  contentNotes: z.string().nullable().optional(),
  status: z.string().optional(),
  checklist: z.unknown().optional(),
  verdict: z.string().nullable().optional(),
  lessonsLearned: z.string().nullable().optional(),
});

export const addDailyResultSchema = z.object({
  date: z.string().min(1),
  spend: z.number(),
  orders: z.number().int(),
  revenue: z.number().optional(),
  clicks: z.number().int().optional(),
  notes: z.string().optional(),
});

export const patchDailyResultSchema = z.object({
  date: z.string().min(1),
  spend: z.number().optional(),
  orders: z.number().int().optional(),
  revenue: z.number().optional(),
  clicks: z.number().int().optional(),
  notes: z.string().optional(),
});

export const createContentPostSchema = z.object({
  url: z.string().min(1),
  platform: z.string().min(1),
  campaignId: z.string().optional(),
  productId: z.string().optional(),
  contentType: z.string().optional(),
  views: z.number().int().optional(),
  likes: z.number().int().optional(),
  comments: z.number().int().optional(),
  shares: z.number().int().optional(),
  notes: z.string().optional(),
  postedAt: z.string().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type AddDailyResultInput = z.infer<typeof addDailyResultSchema>;
export type PatchDailyResultInput = z.infer<typeof patchDailyResultSchema>;
export type CreateContentPostInput = z.infer<typeof createContentPostSchema>;
