/**
 * Test: AI Model Image Consistency via Gemini Image Generation
 *
 * Generates a hero image then uses it as reference for subsequent poses.
 * Evaluates identity consistency across generated images.
 *
 * Usage: npx tsx scripts/test-model-image-gen.ts
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Encryption (mirrors lib/encryption.ts) ───

function decrypt(encryptedText: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) throw new Error("ENCRYPTION_KEY missing or invalid");
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const [ivHex, authTagHex, encrypted] = parts;
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ─── Gemini API ───

const MODEL = "gemini-3-pro-image-preview";
const OUTPUT_DIR = path.resolve(__dirname, "../docs/test-model-images");

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message: string };
}

async function generateImage(
  apiKey: string,
  prompt: string,
  referenceImageBase64?: string,
): Promise<{ imageBase64: string | null; error: string | null; durationMs: number }> {
  const start = Date.now();

  // Build contents
  const parts: Array<Record<string, unknown>> = [];

  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: referenceImageBase64,
      },
    });
  }

  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0,
    },
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as GeminiResponse;

    if (!res.ok || json.error) {
      return { imageBase64: null, error: json.error?.message ?? `HTTP ${res.status}`, durationMs: Date.now() - start };
    }

    // Extract image from response parts
    const candidate = json.candidates?.[0];
    if (!candidate?.content?.parts) {
      return { imageBase64: null, error: `No parts in response. finishReason=${candidate?.finishReason}`, durationMs: Date.now() - start };
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return { imageBase64: part.inlineData.data, error: null, durationMs: Date.now() - start };
      }
    }

    // Log text parts for debugging
    const textParts = candidate.content.parts.filter(p => p.text).map(p => p.text).join("\n");
    return { imageBase64: null, error: `No image in response. Text: ${textParts.slice(0, 200)}`, durationMs: Date.now() - start };
  } catch (err) {
    return { imageBase64: null, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

// ─── Test Poses ───

interface PoseConfig {
  id: string;
  filename: string;
  prompt: string;
  useReference: boolean;
}

const POSES: PoseConfig[] = [
  {
    id: "01-hero-fullbody",
    filename: "01-hero-fullbody.png",
    useReference: false,
    prompt: `A Vietnamese woman, 25 years old, bright smooth skin, natural minimal makeup, long straight black hair past shoulders, wearing a clean white t-shirt and light blue jeans, standing confidently with relaxed posture, full body shot, studio white background, professional photography, soft diffused lighting, Canon EOS R5, sharp focus, 4K quality. She has a warm friendly face with slightly rounded cheeks and natural eyebrows.`,
  },
  {
    id: "02-portrait",
    filename: "02-portrait.png",
    useReference: true,
    prompt: `Generate an image of the EXACT same person from the reference image. STRICT identity lock — same face shape, same eyes, same nose, same lips, same skin tone, same hair style and color. Close-up portrait from chest up, looking directly at camera, gentle warm smile, soft studio lighting, clean white background. Professional headshot photography. PRESERVE IDENTITY EXACTLY.`,
  },
  {
    id: "03-reaction-wow",
    filename: "03-reaction-wow.png",
    useReference: true,
    prompt: `Generate an image of the EXACT same person from the reference image. STRICT identity lock — same face, same hair, same skin tone. Waist-up shot, surprised happy expression, mouth slightly open in amazement, eyes wide with excitement, one hand near her cheek. Bright studio lighting, white background. PRESERVE IDENTITY EXACTLY.`,
  },
  {
    id: "04-holding-product",
    filename: "04-holding-product.png",
    useReference: true,
    prompt: `Generate an image of the EXACT same person from the reference image. STRICT identity lock — same face, same hair, same skin tone. She is holding a white skincare bottle near her face with both hands, gentle smile, product review pose, looking at camera. Bright bathroom vanity background with soft natural daylight. Wearing same white t-shirt. PRESERVE IDENTITY EXACTLY.`,
  },
  {
    id: "05-lifestyle-sitting",
    filename: "05-lifestyle-sitting.png",
    useReference: true,
    prompt: `Generate an image of the EXACT same person from the reference image. STRICT identity lock — same face, same hair, same skin tone. Sitting comfortably on a white sofa, relaxed pose, holding a white cup of tea, warm genuine smile, looking at camera. Modern minimalist living room, warm afternoon lighting from window. Wearing casual comfortable clothes. PRESERVE IDENTITY EXACTLY.`,
  },
];

// ─── Main ───

async function main(): Promise<void> {
  console.log("=== AI Model Image Consistency Test ===\n");

  // 1. Get API key from DB
  console.log("[1] Getting Gemini API key from database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let apiKey: string | undefined = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    try {
      const record = await prisma.apiProvider.findUnique({ where: { provider: "google" } });
      if (!record?.encryptedKey || !record.isConnected) {
        throw new Error("Google API key not configured. Set GEMINI_API_KEY env var or configure in Settings.");
      }
      apiKey = decrypt(record.encryptedKey);
    } catch (err) {
      console.error("    ERROR:", err instanceof Error ? err.message : err);
      await prisma.$disconnect();
      await pool.end();
      process.exit(1);
    }
  }

  console.log(`    Key found: ****${apiKey!.slice(-4)}\n`);
  await prisma.$disconnect();
  await pool.end();

  // 2. Ensure output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 3. Generate images
  console.log(`[2] Generating ${POSES.length} images with model: ${MODEL}\n`);

  let heroBase64: string | null = null;
  const results: Array<{ pose: PoseConfig; success: boolean; error: string | null; durationMs: number }> = [];

  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    const ref = pose.useReference && heroBase64 ? heroBase64 : undefined;

    console.log(`    [${i + 1}/${POSES.length}] ${pose.id}${ref ? " (with reference)" : " (no reference)"}...`);

    const result = await generateImage(apiKey, pose.prompt, ref);

    if (result.imageBase64) {
      const outPath = path.join(OUTPUT_DIR, pose.filename);
      fs.writeFileSync(outPath, Buffer.from(result.imageBase64, "base64"));
      console.log(`    -> Saved: ${pose.filename} (${(result.durationMs / 1000).toFixed(1)}s)`);

      // Store hero for subsequent reference
      if (i === 0) heroBase64 = result.imageBase64;

      results.push({ pose, success: true, error: null, durationMs: result.durationMs });
    } else {
      console.error(`    -> FAILED: ${result.error} (${(result.durationMs / 1000).toFixed(1)}s)`);
      results.push({ pose, success: false, error: result.error, durationMs: result.durationMs });
    }
  }

  // 4. Summary
  const succeeded = results.filter(r => r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log("\n=== Results ===");
  console.log(`Generated: ${succeeded}/${POSES.length}`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`Avg per image: ${(totalTime / POSES.length / 1000).toFixed(1)}s`);
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  if (results.some(r => !r.success)) {
    console.log("\nFailed:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.pose.id}: ${r.error}`);
    });
  }

  console.log("\nDone. Review images in docs/test-model-images/ for consistency.");
}

main().catch(console.error);
