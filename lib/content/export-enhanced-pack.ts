// Enhanced Export Pack — generates individual export components for ZIP
import { prisma } from "@/lib/db";

interface AssetRow {
  assetCode: string | null;
  hookText: string | null;
  format: string | null;
  angle: string | null;
  scriptText: string | null;
  captionText: string | null;
  hashtags: unknown;
  ctaText: string | null;
  videoPrompts: unknown;
  productIdentity: { title: string | null } | null;
}

interface VideoBibleRow {
  framing: string | null;
  lighting: string | null;
  composition: string | null;
  palette: string | null;
  editRhythm: string | null;
  voiceStyleLock: string | null;
  sfxPack: unknown;
  bgmMoods: unknown;
  roomTone: string | null;
  openingRitual: string | null;
  proofTokenRule: string | null;
  closingRitual: string | null;
}

async function fetchBatchAssets(batchId: string): Promise<AssetRow[]> {
  return prisma.contentAsset.findMany({
    where: { productionBatchId: batchId },
    include: { productIdentity: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  }) as unknown as AssetRow[];
}

export async function exportScriptMd(batchId: string): Promise<string> {
  const assets = await fetchBatchAssets(batchId);
  const lines: string[] = ["# Scripts Export\n"];
  for (const [i, a] of assets.entries()) {
    lines.push(`## Video ${i + 1} — ${a.productIdentity?.title || "N/A"}`);
    lines.push(`**Code:** ${a.assetCode || "N/A"} | **Format:** ${a.format || "N/A"}`);
    if (a.hookText) lines.push(`\n**Hook:** ${a.hookText}`);
    if (a.angle) lines.push(`**Góc:** ${a.angle}`);
    if (a.scriptText) lines.push(`\n### Script\n${a.scriptText}`);
    if (a.captionText) lines.push(`\n### Caption\n${a.captionText}`);
    const tags = Array.isArray(a.hashtags) ? a.hashtags : [];
    if (tags.length > 0) lines.push(`\n**Hashtags:** ${tags.join(" ")}`);
    if (a.ctaText) lines.push(`**CTA:** ${a.ctaText}`);
    lines.push("\n---\n");
  }
  return lines.join("\n");
}

export async function exportShotlistJson(batchId: string): Promise<string> {
  const assets = await fetchBatchAssets(batchId);
  const shotlist = assets.map((a, i) => {
    const prompts = Array.isArray(a.videoPrompts) ? a.videoPrompts : [];
    return {
      video: i + 1,
      assetCode: a.assetCode,
      product: a.productIdentity?.title || "N/A",
      format: a.format,
      shots: prompts.map((p: Record<string, unknown>, si: number) => ({
        shot: si + 1,
        scene: p.scene ?? "",
        duration: p.duration_s ?? null,
        action: p.text_overlay ?? p.prompt_kling ?? "",
        notes: "",
      })),
    };
  });
  return JSON.stringify({ batchId, totalVideos: assets.length, shotlist }, null, 2);
}

export async function exportCaptionTxt(batchId: string): Promise<string> {
  const assets = await fetchBatchAssets(batchId);
  return assets.map((a, i) => {
    const tags = Array.isArray(a.hashtags) ? a.hashtags.join(" ") : "";
    return `--- Video ${i + 1}: ${a.productIdentity?.title || "N/A"} ---\n${a.captionText || ""}\n${tags}\n`;
  }).join("\n");
}

export async function exportBrollListMd(batchId: string): Promise<string> {
  const assets = await fetchBatchAssets(batchId);
  const lines: string[] = ["# B-Roll Checklist\n"];
  for (const [i, a] of assets.entries()) {
    lines.push(`## Video ${i + 1} — ${a.productIdentity?.title || "N/A"}`);
    const prompts = Array.isArray(a.videoPrompts) ? a.videoPrompts : [];
    for (const p of prompts as Record<string, unknown>[]) {
      if (p.prompt_kling || p.prompt_veo3) {
        lines.push(`- [ ] ${p.scene || "Scene"}: ${p.prompt_kling || p.prompt_veo3 || ""}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function exportStyleGuideMd(channelId: string): Promise<string | null> {
  const vb = await prisma.videoBible.findUnique({ where: { channelId } }) as VideoBibleRow | null;
  if (!vb) return null;

  const lines: string[] = ["# Style Guide — Video Bible\n"];
  lines.push("## Visual Locks");
  if (vb.framing) lines.push(`- **Framing:** ${vb.framing}`);
  if (vb.lighting) lines.push(`- **Lighting:** ${vb.lighting}`);
  if (vb.composition) lines.push(`- **Composition:** ${vb.composition}`);
  if (vb.palette) lines.push(`- **Palette:** ${vb.palette}`);
  if (vb.editRhythm) lines.push(`- **Edit Rhythm:** ${vb.editRhythm}`);

  lines.push("\n## Audio Locks");
  if (vb.voiceStyleLock) lines.push(`- **Voice:** ${vb.voiceStyleLock}`);
  const sfx = Array.isArray(vb.sfxPack) ? vb.sfxPack : [];
  if (sfx.length > 0) lines.push(`- **SFX:** ${sfx.join(", ")}`);
  const bgm = Array.isArray(vb.bgmMoods) ? vb.bgmMoods : [];
  if (bgm.length > 0) lines.push(`- **BGM Moods:** ${bgm.join(", ")}`);
  if (vb.roomTone) lines.push(`- **Room Tone:** ${vb.roomTone}`);

  lines.push("\n## Narrative Locks");
  if (vb.openingRitual) lines.push(`- **Opening Ritual:** ${vb.openingRitual}`);
  if (vb.proofTokenRule) lines.push(`- **Proof Rule:** ${vb.proofTokenRule}`);
  if (vb.closingRitual) lines.push(`- **Closing Ritual:** ${vb.closingRitual}`);

  return lines.join("\n");
}

export async function exportChecklistMd(batchId: string): Promise<string> {
  const assets = await fetchBatchAssets(batchId);
  const lines: string[] = ["# Production Checklist\n"];
  for (const [i, a] of assets.entries()) {
    lines.push(`## Video ${i + 1} — ${a.assetCode || "N/A"}`);
    lines.push(`**Product:** ${a.productIdentity?.title || "N/A"}`);
    lines.push(`**Format:** ${a.format || "N/A"}`);
    lines.push("");
    lines.push("- [ ] Script reviewed");
    lines.push("- [ ] Shotlist checked");
    lines.push("- [ ] B-roll filmed");
    lines.push("- [ ] Audio recorded");
    lines.push("- [ ] Edited");
    lines.push("- [ ] Subtitle added");
    lines.push("- [ ] QC passed");
    lines.push("- [ ] Published");
    lines.push("");
  }
  return lines.join("\n");
}
