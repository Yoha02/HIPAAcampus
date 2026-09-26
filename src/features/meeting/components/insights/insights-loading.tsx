import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const ROW_WIDTHS = [
  ["w-full", "w-4/5"],
  ["w-full", "w-2/3"],
  ["w-11/12", "w-1/2"],
  ["w-full", "w-3/4"],
];

export function InsightsLoading({ regenerating }: { regenerating: boolean }) {
  return (
    <div role="status" aria-live="polite">
      <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        {regenerating ? "Regenerating enhanced notes…" : "Generating enhanced notes…"}
      </p>
      <div className="border-t border-border">
        {ROW_WIDTHS.map(([first, second], index) => (
          <div
            key={index}
            className="grid gap-3 border-b border-border py-6 sm:grid-cols-[8rem_1fr]"
          >
            <Skeleton className="h-3 w-20" />
            <div className="space-y-2">
              <Skeleton className={`h-3.5 ${first}`} />
              <Skeleton className={`h-3.5 ${second}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
