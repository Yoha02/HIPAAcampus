import { useState } from "react";
import { toast } from "sonner";

import { useElapsedSeconds } from "./use-elapsed-seconds";
import { useWhisperTranscription } from "./use-whisper-transcription";

export type Recorder = ReturnType<typeof useRecorder>;

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const elapsed = useElapsedSeconds(isRecording && !isPaused);
  const transcription = useWhisperTranscription({
    onError: (message) => {
      setIsRecording(false);
      setIsPaused(false);
      toast.error(message);
    },
  });

  const start = () => {
    setIsRecording(true);
    setIsPaused(false);
    setStartedAt((current) => current ?? new Date());
    void transcription.start();
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      void transcription.start();
    } else {
      void transcription.stop();
      setIsPaused(true);
    }
  };

  return {
    isRecording,
    isPaused,
    startedAt,
    elapsed,
    segments: transcription.segments,
    isTranscribing: transcription.isTranscribing,
    error: transcription.error,
    start,
    togglePause,
  };
}
