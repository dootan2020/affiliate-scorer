import { z } from "zod/v4";

const ratingSchema = z.number().int().min(1).max(5);

export const createShopSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  commissionReliability: ratingSchema.optional(),
  supportQuality: ratingSchema.optional(),
  samplePolicy: z.string().optional(),
  notes: z.string().optional(),
});

export const updateShopSchema = z.object({
  name: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  commissionReliability: ratingSchema.nullable().optional(),
  supportQuality: ratingSchema.nullable().optional(),
  samplePolicy: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
