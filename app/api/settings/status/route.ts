import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { maskKey } from "@/lib/ai/providers";

// Legacy endpoint — returns Anthropic key status for backward compat
export async function GET(): Promise<NextResponse> {
  try {
    const record = await prisma.apiProvider.findUnique({
      where: { provider: "anthropic" },
    });

    const hasKey = !!record?.encryptedKey && record.isConnected;
    let maskedKey: string | null = null;
    if (hasKey && record?.encryptedKey) {
      try {
        maskedKey = maskKey(decrypt(record.encryptedKey));
      } catch {
        // decrypt error
      }
    }

    return NextResponse.json({
      data: { hasKey, maskedKey },
    });
  } catch {
    return NextResponse.json({
      data: { hasKey: false, maskedKey: null },
    });
  }
}
