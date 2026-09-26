import { AudioLines, ChevronUp, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Recorder } from "../../hooks/use-recorder";
import { formatElapsed } from "../../lib/format";

type RecordingPillProps = {
  recorder: Recorder;
  onOpenTranscript: () => void;
};

function recordingLabel({ isRecording, isPaused }: Recorder) {
  if (!isRecording) return "Start recording";
  return isPaused ? "Resume recording" : "Pause recording";
}

export function RecordingPill({ recorder, onOpenTranscript }: RecordingPillProps) {
  const { isRecording, isPaused, elapsed } = recorder;

  return (
    <div className="flex h-12 items-center rounded-full border border-border bg-card px-1 shadow-soft">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={isRecording ? recorder.togglePause : recorder.start}
        aria-label={recordingLabel(recorder)}
      >
        {isRecording && !isPaused ? (
          <AudioLines className="text-primary" />
        ) : (
          <Mic className={cn(isPaused ? "text-primary" : "text-muted-foreground")} />
        )}
      </Button>
      {isRecording && (
        <span className="px-1 text-xs tabular-nums text-muted-foreground">
          {formatElapsed(elapsed)}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={onOpenTranscript}
        aria-label="Open meeting transcript"
      >
        <ChevronUp />
      </Button>
    </div>
  );
}
