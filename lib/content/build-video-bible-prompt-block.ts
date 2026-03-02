// Build prompt block for Video Bible injection into brief generation

interface VideoBibleRow {
  framing?: string | null;
  lighting?: string | null;
  composition?: string | null;
  palette?: string | null;
  editRhythm?: string | null;
  voiceStyleLock?: string | null;
  sfxPack?: unknown;
  bgmMoods?: unknown;
  roomTone?: string | null;
  openingRitual?: string | null;
  proofTokenRule?: string | null;
  closingRitual?: string | null;
}

/** Format Video Bible data into a prompt block for AI script generation */
export function buildVideoBibleBlock(vb: VideoBibleRow): string {
  const lines: string[] = ["[VIDEO BIBLE — tuân thủ nghiêm ngặt]"];

  // Visual
  if (vb.framing) lines.push(`Framing: ${vb.framing}`);
  if (vb.lighting) lines.push(`Lighting: ${vb.lighting}`);
  if (vb.composition) lines.push(`Composition: ${vb.composition}`);
  if (vb.palette) lines.push(`Color palette: ${vb.palette}`);
  if (vb.editRhythm) lines.push(`Edit rhythm: ${vb.editRhythm}`);

  // Audio
  if (vb.voiceStyleLock) lines.push(`Voice: ${vb.voiceStyleLock}`);
  const sfx = Array.isArray(vb.sfxPack) ? vb.sfxPack : [];
  if (sfx.length > 0) lines.push(`SFX: ${sfx.join(", ")}`);
  const bgm = Array.isArray(vb.bgmMoods) ? vb.bgmMoods : [];
  if (bgm.length > 0) lines.push(`BGM mood: ${bgm.join(", ")}`);
  if (vb.roomTone) lines.push(`Room tone: ${vb.roomTone}`);

  // Narrative
  if (vb.openingRitual) lines.push(`Opening ritual: ${vb.openingRitual}`);
  if (vb.proofTokenRule) lines.push(`Proof rule: ${vb.proofTokenRule}`);
  if (vb.closingRitual) lines.push(`Closing ritual: ${vb.closingRitual}`);

  if (lines.length <= 1) return "";
  return lines.join("\n");
}
