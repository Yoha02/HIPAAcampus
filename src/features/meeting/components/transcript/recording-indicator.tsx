import { cn } from "@/lib/utils";

import { formatElapsed } from "../../lib/format";

type RecordingIndicatorProps = {
  isPaused: boolean;
  elapsed: number;
};

export function RecordingIndicator({ isPaused, elapsed }: RecordingIndicatorProps) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-normal text-primary">
      <span className={cn("size-2 rounded-full bg-destructive", !isPaused && "animate-pulse")} />
      {isPaused ? "Paused" : "Recording"} · {formatElapsed(elapsed)}
    </span>
  );
}
