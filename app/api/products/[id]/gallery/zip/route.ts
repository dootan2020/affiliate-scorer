import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import JSZip from "jszip";

/** GET — download all gallery images + main image as zip */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  try {
    const [images, identity] = await Promise.all([
      prisma.productGalleryImage.findMany({
        where: { productIdentityId: id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.productIdentity.findUnique({
        where: { id },
        select: { imageUrl: true, title: true },
      }),
    ]);

    if (images.length === 0 && !identity?.imageUrl) {
      return NextResponse.json({ error: "No images to download" }, { status: 404 });
    }

    const zip = new JSZip();
    let fileIndex = 1;

    // Add main image if available
    if (identity?.imageUrl) {
      try {
        const res = await fetch(identity.imageUrl);
        if (res.ok) {
          const contentType = res.headers.get("content-type") ?? "image/jpeg";
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const buffer = await res.arrayBuffer();
          zip.file(`00-main.${ext}`, buffer);
        }
      } catch {
        // skip if main image fetch fails
      }
    }

    // Add gallery images
    for (const img of images) {
      const ext = img.mimeType.split("/")[1] ?? "jpg";
      const paddedIndex = String(fileIndex++).padStart(2, "0");
      zip.file(`${paddedIndex}-${img.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`, img.data);
    }

    const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const safeName = (identity?.title ?? "gallery").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

    return new Response(zipArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName}-images.zip"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Zip creation failed" }, { status: 500 });
  }
}
