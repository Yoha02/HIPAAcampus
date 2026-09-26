import type { TimedText, TranscriptBlock, TranscriptSegment } from "../types";

export const PAUSE_BREAK_SECONDS = 3;
export const MAX_BLOCK_SECONDS = 45;

export function toSegments(timed: TimedText[]): TranscriptSegment[] {
  return timed.map((item, index) => ({ id: `segment-${index}`, ...item }));
}

export function groupIntoBlocks(
  segments: TranscriptSegment[],
  { pauseBreakSeconds = PAUSE_BREAK_SECONDS, maxBlockSeconds = MAX_BLOCK_SECONDS } = {},
): TranscriptBlock[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const blocks: TranscriptBlock[] = [];
  for (const segment of sorted) {
    const previous = blocks.at(-1);
    const continuesBlock =
      previous &&
      segment.start - previous.end <= pauseBreakSeconds &&
      segment.end - previous.start <= maxBlockSeconds;
    if (continuesBlock) {
      previous.end = segment.end;
      previous.text = `${previous.text} ${segment.text}`;
    } else {
      blocks.push({ ...segment });
    }
  }
  return blocks;
}

export function formatClock(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = String(whole % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function formatVttTimestamp(totalSeconds: number): string {
  const totalMs = Math.max(0, Math.round(totalSeconds * 1000));
  const hours = String(Math.floor(totalMs / 3_600_000)).padStart(2, "0");
  const minutes = String(Math.floor((totalMs % 3_600_000) / 60_000)).padStart(2, "0");
  const seconds = String(Math.floor((totalMs % 60_000) / 1000)).padStart(2, "0");
  const millis = String(totalMs % 1000).padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${millis}`;
}

export function toWebVtt(segments: TranscriptSegment[]): string {
  const cues = [...segments]
    .sort((a, b) => a.start - b.start)
    .map(
      (segment) =>
        `${formatVttTimestamp(segment.start)} --> ${formatVttTimestamp(segment.end)}\n${segment.text}`,
    );
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
