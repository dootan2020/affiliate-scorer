import { z } from "zod/v4";

export const createCalendarSchema = z.object({
  name: z.string().min(1),
  eventType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  prepStartDate: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  notes: z.string().optional(),
  recurring: z.boolean().optional(),
});

export const createFinancialSchema = z.object({
  type: z.string().min(1),
  amount: z.number(),
  source: z.string().min(1),
  productId: z.string().optional(),
  campaignId: z.string().optional(),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export const createGoalSchema = z.object({
  type: z.string().min(1),
  targetAmount: z.number(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export const createCommissionSchema = z.object({
  amount: z.number().positive(),
  platform: z.string().optional(),
  earnedDate: z.string().min(1),
  productIdentityId: z.string().optional(),
  contentAssetId: z.string().optional(),
  notes: z.string().optional(),
  autoConfirm: z.boolean().optional(),
});

export const createGoalP5Schema = z.object({
  periodType: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  targetVideos: z.number().int().optional(),
  targetCommission: z.number().optional(),
  targetViews: z.number().int().optional(),
  notes: z.string().optional(),
});

export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;
export type CreateFinancialInput = z.infer<typeof createFinancialSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type CreateCommissionInput = z.infer<typeof createCommissionSchema>;
export type CreateGoalP5Input = z.infer<typeof createGoalP5Schema>;
