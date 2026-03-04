"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBackgroundGenerate } from "@/lib/hooks/use-background-generate";

interface Props {
  channelId: string;
  hasExisting: boolean;
  onGenerated: () => void;
}

export function BibleGenerateButton({ channelId, hasExisting, onGenerated }: Props): React.ReactElement {
  const gen = useBackgroundGenerate(() => {
    toast.success("Đã tạo Character Bible bằng AI");
    onGenerated();
  });

  async function handleGenerate(): Promise<void> {
    if (hasExisting && !confirm("Tạo mới sẽ ghi đè Character Bible hiện tại. Tiếp tục?")) return;
    const taskId = await gen.start(`/api/channels/${channelId}/character-bible/generate`);
    if (!taskId) {
      toast.error(gen.error ?? "Lỗi tạo Character Bible");
    }
  }

  const loading = gen.status === "processing";

  return (
    <Button
      onClick={() => void handleGenerate()}
      disabled={loading}
      variant="secondary"
      size="sm"
      className="bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50"
    >
      {loading ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo...</>
      ) : (
        <><Sparkles className="w-3.5 h-3.5" /> {hasExisting ? "Tạo lại" : "Tạo bằng AI"}</>
      )}
    </Button>
  );
}
