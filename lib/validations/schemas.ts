import { z } from "zod/v4";

export const uploadProductsSchema = z.object({
  format: z.enum(["fastmoss", "kalodata", "auto"]).default("auto"),
});

export const uploadFeedbackSchema = z.object({
  format: z
    .enum(["fb_ads", "tiktok_ads", "shopee_affiliate", "auto"])
    .default("auto"),
});

export const scoreRequestSchema = z.object({
  batchId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  minScore: z.coerce.number().optional(),
  sortBy: z.enum(["aiScore", "price", "commissionRate", "createdAt"]).default("aiScore"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
