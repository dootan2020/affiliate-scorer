import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** GET — list gallery image metadata (no binary) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const [images, identity] = await Promise.all([
      prisma.productGalleryImage.findMany({
        where: { productIdentityId: id },
        select: { id: true, filename: true, mimeType: true, sortOrder: true, createdAt: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.productIdentity.findUnique({
        where: { id },
        select: { imageUrl: true },
      }),
    ]);
    return NextResponse.json({ data: images, mainImageUrl: identity?.imageUrl ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

/** POST — upload images (multipart FormData) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    // Verify product identity exists
    const identity = await prisma.productIdentity.findUnique({ where: { id }, select: { id: true } });
    if (!identity) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Max ${MAX_FILES} files per upload` }, { status: 400 });
    }

    // Get current max sort order
    const lastImage = await prisma.productGalleryImage.findFirst({
      where: { productIdentityId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    let nextOrder = (lastImage?.sortOrder ?? -1) + 1;

    const created: Array<{ id: string; filename: string }> = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const record = await prisma.productGalleryImage.create({
        data: {
          productIdentityId: id,
          filename: file.name,
          mimeType: file.type,
          data: buffer,
          sortOrder: nextOrder++,
        },
        select: { id: true, filename: true },
      });
      created.push(record);
    }

    return NextResponse.json({ data: created });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/** DELETE — delete a specific image */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const { imageId } = (await req.json()) as { imageId: string };
    if (!imageId) {
      return NextResponse.json({ error: "imageId required" }, { status: 400 });
    }

    await prisma.productGalleryImage.deleteMany({
      where: { id: imageId, productIdentityId: id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
