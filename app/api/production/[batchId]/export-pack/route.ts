// GET /api/production/[batchId]/export-pack — Download enhanced ZIP pack
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  exportScriptMd,
  exportShotlistJson,
  exportCaptionTxt,
  exportBrollListMd,
  exportStyleGuideMd,
  exportChecklistMd,
} from "@/lib/content/export-enhanced-pack";

interface Ctx {
  params: Promise<{ batchId: string }>;
}

// Simple ZIP builder (no external deps) — uses store method (no compression)
function createZipBuffer(files: Array<{ name: string; content: string }>): Buffer {
  const encoder = new TextEncoder();
  const entries: Array<{ name: Uint8Array; data: Uint8Array; offset: number }> = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);

    // Local file header (30 + name + data)
    const header = new Uint8Array(30 + nameBytes.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, 0x04034b50, true); // signature
    hv.setUint16(4, 20, true); // version needed
    hv.setUint16(8, 0, true); // method: store
    hv.setUint32(18, dataBytes.length, true); // compressed
    hv.setUint32(22, dataBytes.length, true); // uncompressed
    hv.setUint16(26, nameBytes.length, true); // name length
    header.set(nameBytes, 30);

    entries.push({ name: nameBytes, data: dataBytes, offset });
    parts.push(header, dataBytes);
    offset += header.length + dataBytes.length;
  }

  // Central directory
  const centralStart = offset;
  for (const entry of entries) {
    const cd = new Uint8Array(46 + entry.name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, entry.name.length, true);
    cv.setUint32(42, entry.offset, true);
    cd.set(entry.name, 46);
    parts.push(cd);
    offset += cd.length;
  }

  // End of central directory
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, offset - centralStart, true);
  ev.setUint32(16, centralStart, true);
  parts.push(end);

  // Concat
  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { result.set(p, pos); pos += p.length; }
  return Buffer.from(result);
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { batchId } = await ctx.params;
  try {
    const batch = await prisma.productionBatch.findUnique({
      where: { id: batchId },
      include: { assets: { select: { channelId: true }, take: 1 } },
    });
    if (!batch) return NextResponse.json({ error: "Không tìm thấy batch" }, { status: 404 });

    const channelId = batch.assets[0]?.channelId;

    // Generate all pack files
    const [scriptMd, shotlistJson, captionTxt, brollMd, checklistMd] = await Promise.all([
      exportScriptMd(batchId),
      exportShotlistJson(batchId),
      exportCaptionTxt(batchId),
      exportBrollListMd(batchId),
      exportChecklistMd(batchId),
    ]);

    const files = [
      { name: "script.md", content: scriptMd },
      { name: "shotlist.json", content: shotlistJson },
      { name: "caption.txt", content: captionTxt },
      { name: "broll-list.md", content: brollMd },
      { name: "checklist.md", content: checklistMd },
    ];

    // Add style guide if Video Bible exists
    if (channelId) {
      const styleGuide = await exportStyleGuideMd(channelId);
      if (styleGuide) files.push({ name: "style-guide.md", content: styleGuide });
    }

    const zipBuffer = createZipBuffer(files);
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="export-pack-${dateStr}.zip"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[export-pack]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
