import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET — serve individual image binary */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
): Promise<Response> {
  const { id, imageId } = await params;
  try {
    const image = await prisma.productGalleryImage.findFirst({
      where: { id: imageId, productIdentityId: id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return new Response(new Uint8Array(image.data as Buffer), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Disposition": `attachment; filename="${image.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}
