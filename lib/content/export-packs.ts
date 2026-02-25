// Phase 3: Export Packs — scripts.md, prompts.json, checklist.csv
import { prisma } from "@/lib/db";

interface AssetWithIdentity {
  assetCode: string | null;
  format: string | null;
  hookText: string | null;
  hookType: string | null;
  angle: string | null;
  scriptText: string | null;
  captionText: string | null;
  hashtags: unknown;
  ctaText: string | null;
  videoPrompts: unknown;
  status: string;
  productIdentity: {
    title: string | null;
    price: unknown;
  };
}

interface ScenePrompt {
  scene: number;
  start_s: number;
  end_s: number;
  description?: string;
  prompt_kling?: string;
  prompt_veo3?: string;
  text_overlay?: string;
  audio_note?: string;
}

/** Lấy assets của batch + identity */
async function getBatchAssets(batchId: string): Promise<AssetWithIdentity[]> {
  return prisma.contentAsset.findMany({
    where: { productionBatchId: batchId },
    include: { productIdentity: true },
    orderBy: { createdAt: "asc" },
  }) as Promise<AssetWithIdentity[]>;
}

/** Export scripts.md */
export async function exportScriptsMd(batchId: string): Promise<string> {
  const batch = await prisma.productionBatch.findUnique({ where: { id: batchId } });
  const assets = await getBatchAssets(batchId);

  const date = batch?.batchDate
    ? new Date(batch.batchDate).toLocaleDateString("vi-VN")
    : new Date().toLocaleDateString("vi-VN");

  const lines: string[] = [
    `# Ca sản xuất — ${date} — ${assets.length} video`,
    "",
  ];

  // Nhóm theo sản phẩm
  const grouped = new Map<string, AssetWithIdentity[]>();
  for (const asset of assets) {
    const key = asset.productIdentity.title || "Chưa có tên";
    const arr = grouped.get(key) || [];
    arr.push(asset);
    grouped.set(key, arr);
  }

  for (const [productName, productAssets] of grouped) {
    lines.push(`## ${productName} (${productAssets.length} video)`);
    lines.push("");

    for (let i = 0; i < productAssets.length; i++) {
      const a = productAssets[i];
      lines.push(`### Video ${i + 1}: ${a.format || "?"} — ${a.assetCode || "?"}`);
      lines.push(`**Hook:** ${a.hookText || "—"}`);
      lines.push(`**Angle:** ${a.angle || "—"}`);
      lines.push("");

      if (a.scriptText) {
        lines.push("**Script:**");
        lines.push(a.scriptText);
        lines.push("");
      }

      lines.push(`**Caption:** ${a.captionText || "—"}`);

      const tags = Array.isArray(a.hashtags) ? (a.hashtags as string[]).join(" ") : "";
      if (tags) lines.push(`**Hashtags:** ${tags}`);

      lines.push(`**CTA:** ${a.ctaText || "—"}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/** Export prompts.json */
export async function exportPromptsJson(batchId: string): Promise<string> {
  const batch = await prisma.productionBatch.findUnique({ where: { id: batchId } });
  const assets = await getBatchAssets(batchId);

  const result = {
    batch_date: batch?.batchDate
      ? new Date(batch.batchDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    total_videos: assets.length,
    assets: assets.map((a) => ({
      asset_code: a.assetCode,
      product: a.productIdentity.title,
      format: a.format,
      hook: a.hookText,
      scenes: Array.isArray(a.videoPrompts)
        ? (a.videoPrompts as ScenePrompt[]).map((s) => ({
            scene: s.scene,
            start_s: s.start_s,
            end_s: s.end_s,
            prompt_kling: s.prompt_kling || "",
            prompt_veo3: s.prompt_veo3 || "",
            text_overlay: s.text_overlay || "",
          }))
        : [],
      caption: a.captionText,
      hashtags: Array.isArray(a.hashtags) ? a.hashtags : [],
    })),
  };

  return JSON.stringify(result, null, 2);
}

/** Export checklist.csv */
export async function exportChecklistCsv(batchId: string): Promise<string> {
  const assets = await getBatchAssets(batchId);

  const header = "asset_code,product,format,hook,status_produced,status_rendered,status_published,published_url,notes";
  const rows = assets.map((a) => {
    const cols = [
      a.assetCode || "",
      `"${(a.productIdentity.title || "").replace(/"/g, '""')}"`,
      a.format || "",
      `"${(a.hookText || "").replace(/"/g, '""')}"`,
      a.status === "produced" || a.status === "rendered" || a.status === "published" ? "x" : "",
      a.status === "rendered" || a.status === "published" ? "x" : "",
      a.status === "published" ? "x" : "",
      "",
      "",
    ];
    return cols.join(",");
  });

  return [header, ...rows].join("\n");
}
