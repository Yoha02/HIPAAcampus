import { HighlightedText } from "@/components/shared/highlighted-text";

import { formatClock } from "../../lib/transcript";
import type { TranscriptBlock as Block } from "../../types";

type TranscriptBlockProps = {
  block: Block;
  query: string;
};

export function TranscriptBlock({ block, query }: TranscriptBlockProps) {
  return (
    <article className="grid grid-cols-[3.5rem_1fr] gap-3">
      <time className="pt-0.5 text-xs tabular-nums text-muted-foreground">
        {formatClock(block.start)}
      </time>
      <p className="text-sm leading-6 text-foreground/90">
        <HighlightedText text={block.text} query={query} />
      </p>
    </article>
  );
}
