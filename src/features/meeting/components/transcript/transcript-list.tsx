import { useEffect, useRef } from "react";

import type { TranscriptBlock as Block } from "../../types";
import { TranscribingIndicator } from "./transcribing-indicator";
import { TranscriptBlock } from "./transcript-block";

type TranscriptListProps = {
  blocks: Block[];
  query: string;
  isRecording: boolean;
  isTranscribing: boolean;
  error?: string | null;
};

function emptyMessage(isSearching: boolean, isRecording: boolean) {
  if (isSearching) return "No matching transcript text";
  if (isRecording) return "Listening… text appears every few seconds as you speak.";
  return "Start recording to transcribe this session with Whisper.";
}

export function TranscriptList({
  blocks,
  query,
  isRecording,
  isTranscribing,
  error,
}: TranscriptListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    if (isSearching) return;
    const container = scrollRef.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [blocks.length, isTranscribing, isSearching]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-5">
      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {blocks.length === 0 && !isTranscribing ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage(isSearching, isRecording)}
        </p>
      ) : (
        <div className="max-w-3xl space-y-5">
          {blocks.map((block) => (
            <TranscriptBlock key={block.id} block={block} query={query} />
          ))}
        </div>
      )}
      {isTranscribing && !isSearching && (
        <div className="mt-5">
          <TranscribingIndicator />
        </div>
      )}
    </div>
  );
}
