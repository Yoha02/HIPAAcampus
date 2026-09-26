import { useMemo, useState } from "react";

import { BottomSheet } from "@/components/shared/bottom-sheet";
import { SearchField } from "@/components/shared/search-field";

import type { Recorder } from "../../hooks/use-recorder";
import { matchesSearch } from "../../lib/format";
import { groupIntoBlocks, toSegments } from "../../lib/transcript";
import type { MeetingDetails } from "../../types";
import { DownloadTranscriptButton } from "./download-transcript-button";
import { RecordingButton } from "./recording-button";
import { RecordingIndicator } from "./recording-indicator";
import { TranscriptList } from "./transcript-list";
import { TranscriptMetadata } from "./transcript-metadata";

type TranscriptPanelProps = {
  meeting: MeetingDetails;
  recorder: Recorder;
  onClose: () => void;
};

export function TranscriptPanel({ meeting, recorder, onClose }: TranscriptPanelProps) {
  const [search, setSearch] = useState("");

  const segments = useMemo(() => toSegments(recorder.segments), [recorder.segments]);
  const blocks = useMemo(() => groupIntoBlocks(segments), [segments]);
  const visibleBlocks = blocks.filter((block) => matchesSearch(block.text, search));

  return (
    <BottomSheet
      className="h-[72vh]"
      title={
        <>
          Transcript
          {recorder.isRecording && (
            <RecordingIndicator isPaused={recorder.isPaused} elapsed={recorder.elapsed} />
          )}
        </>
      }
      subtitle={`${meeting.title} · Transcribed locally with Whisper`}
      actions={
        <>
          <DownloadTranscriptButton title={meeting.title} segments={segments} />
          <RecordingButton
            isRecording={recorder.isRecording}
            isPaused={recorder.isPaused}
            onStart={recorder.start}
            onTogglePause={recorder.togglePause}
          />
        </>
      }
      closeLabel="Close transcript"
      onClose={onClose}
    >
      <TranscriptMetadata
        startedAt={recorder.startedAt}
        durationSeconds={recorder.elapsed}
        blockCount={blocks.length}
      />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Search transcript"
        className="mt-4"
      />
      <TranscriptList
        blocks={visibleBlocks}
        query={search}
        isRecording={recorder.isRecording && !recorder.isPaused}
        isTranscribing={recorder.isTranscribing}
        error={recorder.error}
      />
    </BottomSheet>
  );
}
