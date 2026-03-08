import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { type ProviderName, PROVIDER_NAMES, getApiKey } from "@/lib/ai/providers";

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
        isConnected: true,
        lastTestedAt: new Date(),
      },
      create: {
        provider: body.provider,
        encryptedKey,
        isConnected: true,
        lastTestedAt: new Date(),
      },
    });

    // Auto-register Telegram webhook when token is saved
    let webhookWarning: string | undefined;
    if (body.provider === "telegram") {
      try {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "").trim();
        if (appUrl) {
          const webhookUrl = `https://${appUrl.replace(/^https?:\/\//, "")}/api/telegram/webhook`;
          const webhookBody: Record<string, string> = { url: webhookUrl };
          if (process.env.TELEGRAM_WEBHOOK_SECRET) {
            webhookBody.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
          }
          const webhookRes = await fetch(`https://api.telegram.org/bot${body.apiKey}/setWebhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookBody),
          });
          const webhookResult = await webhookRes.json() as { ok: boolean; description?: string };
          if (!webhookResult.ok) {
            console.error("[api-keys/save] Telegram webhook failed:", webhookResult.description);
            webhookWarning = webhookResult.description;
          }
        }
      } catch (err) {
        console.warn("[api-keys/save] Telegram webhook setup failed:", err);
        webhookWarning = "Không thể đăng ký webhook";
      }
    }

    return NextResponse.json({ success: true, webhookWarning });
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

    // Deregister Telegram webhook before clearing token
    if (provider === "telegram") {
      try {
        const token = await getApiKey(provider);
        if (token) {
          await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
        }
      } catch { /* non-critical */ }
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
