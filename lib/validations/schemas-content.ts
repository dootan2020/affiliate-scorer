import { z } from "zod/v4";

export const inboxPasteSchema = z.object({
  text: z.string().min(1),
});

export const updateInboxItemSchema = z.object({
  title: z.string().optional(),
  shopName: z.string().optional(),
  category: z.string().optional(),
  price: z.number().optional(),
  commissionRate: z.number().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  inboxState: z.string().optional(),
  personalNotes: z.string().optional(),
  personalRating: z.number().int().min(1).max(5).optional(),
  personalTags: z.array(z.string()).optional(),
});

export const quickLogSchema = z.object({
  tiktokUrl: z.string().optional(),
  assetId: z.string().optional(),
  views: z.number().int().optional(),
  likes: z.number().int().optional(),
  comments: z.number().int().optional(),
  shares: z.number().int().optional(),
  saves: z.number().int().optional(),
  orders: z.number().int().optional(),
  commissionAmount: z.number().optional(),
});

const batchItemSchema = z.object({
  assetId: z.string().min(1),
  tiktokUrl: z.string().optional(),
  views: z.number().int().optional(),
  likes: z.number().int().optional(),
  comments: z.number().int().optional(),
  shares: z.number().int().optional(),
  saves: z.number().int().optional(),
  orders: z.number().int().optional(),
});

export const batchLogSchema = z.object({
  items: z.array(batchItemSchema).min(1),
});

export const generateBriefSchema = z.object({
  productIdentityId: z.string().min(1),
});

export const batchBriefSchema = z.object({
  productIdentityIds: z.array(z.string().min(1)).min(1).max(10),
});

const VALID_ASSET_STATUSES = ["draft", "produced", "rendered", "published", "logged", "archived", "failed"] as const;

export const updateAssetSchema = z.object({
  status: z.enum(VALID_ASSET_STATUSES).optional(),
  publishedUrl: z.string().optional(),
  postId: z.string().optional(),
  scriptText: z.string().optional(),
  captionText: z.string().optional(),
  ctaText: z.string().optional(),
});

export const complianceCheckSchema = z.object({
  text: z.string().min(1),
});

export const createProductionBatchSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1),
  notes: z.string().optional(),
});

export const updateProductNotesSchema = z.object({
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  affiliateLink: z.string().optional(),
  affiliateLinkStatus: z.string().optional(),
});

export const updateSeasonalSchema = z.object({
  tag: z.string().nullable(),
  preset: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type InboxPasteInput = z.infer<typeof inboxPasteSchema>;
export type UpdateInboxItemInput = z.infer<typeof updateInboxItemSchema>;
export type QuickLogInput = z.infer<typeof quickLogSchema>;
export type BatchLogInput = z.infer<typeof batchLogSchema>;
export type GenerateBriefInput = z.infer<typeof generateBriefSchema>;
export type BatchBriefInput = z.infer<typeof batchBriefSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>;
export type CreateProductionBatchInput = z.infer<typeof createProductionBatchSchema>;
export type UpdateProductNotesInput = z.infer<typeof updateProductNotesSchema>;
export type UpdateSeasonalInput = z.infer<typeof updateSeasonalSchema>;
