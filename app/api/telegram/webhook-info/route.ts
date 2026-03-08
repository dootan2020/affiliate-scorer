// GET /api/telegram/webhook-info — check current webhook status with Telegram
import { NextResponse } from "next/server";
import { getTelegramToken } from "@/lib/ai/providers";

export async function GET(): Promise<NextResponse> {
  const token = await getTelegramToken();
  if (!token) {
    return NextResponse.json({ error: "No token configured" }, { status: 404 });
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();

  return NextResponse.json(data);
}

// POST /api/telegram/webhook-info — re-register webhook
export async function POST(): Promise<NextResponse> {
  const token = await getTelegramToken();
  if (!token) {
    return NextResponse.json({ error: "No token configured" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "No app URL configured" }, { status: 503 });
  }

  const webhookUrl = `https://${appUrl.replace(/^https?:\/\//, "")}/api/telegram/webhook`;
  const body: Record<string, string> = { url: webhookUrl };
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await res.json();

  // Verify
  const verifyRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const verifyData = await verifyRes.json();

  return NextResponse.json({ setWebhook: result, webhookInfo: verifyData, webhookUrl });
}
