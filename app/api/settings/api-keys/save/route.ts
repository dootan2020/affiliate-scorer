import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { type ProviderName, PROVIDER_NAMES } from "@/lib/ai/providers";

interface SaveRequest {
  provider: ProviderName;
  apiKey: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as SaveRequest;

    if (!body.provider || !PROVIDER_NAMES.includes(body.provider)) {
      return NextResponse.json({ error: "Provider không hợp lệ" }, { status: 400 });
    }
    if (!body.apiKey || body.apiKey.length < 10) {
      return NextResponse.json({ error: "API key không hợp lệ" }, { status: 400 });
    }

    const encryptedKey = encrypt(body.apiKey);

    await prisma.apiProvider.upsert({
      where: { provider: body.provider },
      update: {
        encryptedKey,
        isFromEnv: false,
        isConnected: true,
        lastTestedAt: new Date(),
      },
      create: {
        provider: body.provider,
        encryptedKey,
        isFromEnv: false,
        isConnected: true,
        lastTestedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi khi lưu API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") as ProviderName | null;

    if (!provider || !PROVIDER_NAMES.includes(provider)) {
      return NextResponse.json({ error: "Provider không hợp lệ" }, { status: 400 });
    }

    await prisma.apiProvider.update({
      where: { provider },
      data: {
        encryptedKey: null,
        isConnected: false,
        lastTestedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi khi xoá API key" }, { status: 500 });
  }
}
