import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  PROVIDER_NAMES,
  type ProviderName,
  maskKey,
} from "@/lib/ai/providers";
import { decrypt } from "@/lib/encryption";

interface ProviderStatus {
  provider: ProviderName;
  connected: boolean;
  lastChars: string | null;
}

export async function GET(): Promise<NextResponse> {
  try {
    const dbRecords = await prisma.apiProvider.findMany({ take: 50 });
    const dbMap = new Map(dbRecords.map((r) => [r.provider, r]));

    const providers: ProviderStatus[] = PROVIDER_NAMES.map((provider) => {
      const dbRecord = dbMap.get(provider);

      if (dbRecord?.encryptedKey && dbRecord.isConnected) {
        try {
          const decryptedKey = decrypt(dbRecord.encryptedKey);
          return {
            provider,
            connected: true,
            lastChars: maskKey(decryptedKey),
          };
        } catch {
          // Decryption failed
        }
      }

      return {
        provider,
        connected: false,
        lastChars: null,
      };
    });

    return NextResponse.json({ providers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi" },
      { status: 500 }
    );
  }
}
