import type { Recorder } from "../../hooks/use-recorder";
import { AskSessionButton } from "./ask-session-button";
import { RecordingPill } from "./recording-pill";

type BottomDockProps = {
  recorder: Recorder;
  onOpenTranscript: () => void;
  onOpenChat: () => void;
};

export function BottomDock({ recorder, onOpenTranscript, onOpenChat }: BottomDockProps) {
  return (
    <div className="fixed bottom-0 left-0 right-[var(--sheet-right,0px)] z-10 border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <RecordingPill recorder={recorder} onOpenTranscript={onOpenTranscript} />
        <AskSessionButton onClick={onOpenChat} />
      </div>
    </div>
  );
}
