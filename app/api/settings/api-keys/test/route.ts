import { NextResponse } from "next/server";
import { type ProviderName, PROVIDER_NAMES } from "@/lib/ai/providers";

interface TestRequest {
  provider: ProviderName;
  apiKey: string;
}

async function testAnthropic(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!res.ok) {
      const body = await res.json().catch((err: unknown) => {
        console.error(`[api-keys/test] JSON parse failed:`, err);
        return null;
      });
      return { success: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi kết nối" };
  }
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.json().catch((err: unknown) => {
        console.error(`[api-keys/test] JSON parse failed:`, err);
        return null;
      });
      return { success: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi kết nối" };
  }
}

async function testTelegram(apiKey: string): Promise<{ success: boolean; error?: string; botUsername?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${apiKey}/getMe`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { success: false, error: body?.description ?? `HTTP ${res.status}` };
    }
    const data = await res.json() as { ok: boolean; result?: { username?: string } };
    if (!data.ok) return { success: false, error: "Token không hợp lệ" };
    return { success: true, botUsername: data.result?.username || undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi kết nối" };
  }
}

async function testGoogle(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    );
    if (!res.ok) {
      const body = await res.json().catch((err: unknown) => {
        console.error(`[api-keys/test] JSON parse failed:`, err);
        return null;
      });
      return { success: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi kết nối" };
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as TestRequest;

    if (!body.provider || !PROVIDER_NAMES.includes(body.provider)) {
      return NextResponse.json({ error: "Provider không hợp lệ" }, { status: 400 });
    }
    if (!body.apiKey || body.apiKey.length < 10) {
      return NextResponse.json({ error: "API key không hợp lệ" }, { status: 400 });
    }

    let result: { success: boolean; error?: string };

    switch (body.provider) {
      case "anthropic":
        result = await testAnthropic(body.apiKey);
        break;
      case "openai":
        result = await testOpenAI(body.apiKey);
        break;
      case "google":
        result = await testGoogle(body.apiKey);
        break;
      case "telegram":
        result = await testTelegram(body.apiKey);
        break;
      default:
        return NextResponse.json({ error: "Provider không được hỗ trợ" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 }
    );
  }
}
