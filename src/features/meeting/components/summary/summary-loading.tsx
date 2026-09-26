import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const LINE_WIDTHS = ["w-11/12", "w-4/5", "w-full", "w-2/3", "w-5/6", "w-3/4"];

export function SummaryLoading({ regenerating }: { regenerating: boolean }) {
  return (
    <div role="status" aria-live="polite">
      <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        {regenerating ? "Regenerating summary…" : "Generating summary…"}
      </p>
      <ul className="space-y-4 border-t border-border pt-6">
        {LINE_WIDTHS.map((width, index) => (
          <li key={index} className="flex items-center gap-3">
            <Skeleton className="size-1.5 shrink-0 rounded-full" />
            <Skeleton className={`h-3.5 ${width}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
