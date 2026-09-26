import { Mic, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

type RecordingButtonProps = {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onTogglePause: () => void;
};

export function RecordingButton({
  isRecording,
  isPaused,
  onStart,
  onTogglePause,
}: RecordingButtonProps) {
  if (!isRecording) {
    return (
      <Button size="sm" onClick={onStart}>
        <Mic /> Start recording
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onTogglePause}>
      {isPaused ? <Play /> : <Pause />}
      {isPaused ? "Resume" : "Pause"}
    </Button>
  );
}
