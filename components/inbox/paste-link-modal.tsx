"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PasteLinkBox } from "@/components/inbox/paste-link-box";
import { ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PasteLinkModalProps {
  onComplete?: () => void;
}

export function PasteLinkModal({ onComplete }: PasteLinkModalProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  function handleComplete(): void {
    onComplete?.();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400">
          <ClipboardPaste className="w-4 h-4" />
          Dán links
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dán links sản phẩm</DialogTitle>
        </DialogHeader>
        <PasteLinkBox onComplete={handleComplete} />
      </DialogContent>
    </Dialog>
  );
}
