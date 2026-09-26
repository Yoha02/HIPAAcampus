import { CalendarDays, Clock, MessageSquareText } from "lucide-react";

import { formatClock } from "../../lib/transcript";

type TranscriptMetadataProps = {
  startedAt: Date | null;
  durationSeconds: number;
  blockCount: number;
};

export function TranscriptMetadata({
  startedAt,
  durationSeconds,
  blockCount,
}: TranscriptMetadataProps) {
  if (!startedAt) {
    return (
      <p className="border-b border-border py-4 text-xs text-muted-foreground">Not recorded yet</p>
    );
  }

  const date = startedAt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = startedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border py-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <CalendarDays className="size-3.5" /> {date}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="size-3.5" /> Started {time} · {formatClock(durationSeconds)}
      </span>
      <span className="flex items-center gap-1.5">
        <MessageSquareText className="size-3.5" /> {blockCount}{" "}
        {blockCount === 1 ? "passage" : "passages"}
      </span>
    </div>
  );
}
