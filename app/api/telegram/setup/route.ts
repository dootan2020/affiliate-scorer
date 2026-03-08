// Telegram Bot Setup — registers webhook URL with Telegram API
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function POST(request: Request): Promise<NextResponse> {
  // Admin-only: require CRON_SECRET
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN chưa được cấu hình" },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL chưa được cấu hình" },
      { status: 503 }
    );
  }

  const webhookUrl = `https://${appUrl.replace(/^https?:\/\//, "")}/api/telegram/webhook`;

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      ...(process.env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET } : {}),
    }),
  });

  const result = await response.json();

  return NextResponse.json({
    ok: result.ok,
    webhookUrl,
    telegram: result,
  });
}
