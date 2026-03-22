// Phase 07 Fix #15: Zod enum validation for feedback source field
// Prevents invalid source values (typos like "manaul") from entering DB

import { z } from "zod";

export const FeedbackSourceSchema = z.enum([
  "manual",
  "implicit",
  "outcome",
  "quick",
]);

export type FeedbackSource = z.infer<typeof FeedbackSourceSchema>;
