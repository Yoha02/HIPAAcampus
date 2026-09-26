export type WorkspaceView = "notes" | "insights";

export type BottomPanel = "chat" | "transcript" | null;

export type TimedText = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptSegment = TimedText & {
  id: string;
};

export type TranscriptBlock = TranscriptSegment;

/** Points at one highlighted passage inside a source document. */
export type Citation = {
  sourceId: string;
  passageId: string;
};

export type ReplySentence = {
  text: string;
  citations: Citation[];
};

export type ChatMessage =
  { role: "user"; text: string } | { role: "assistant"; sentences: ReplySentence[] };

/** Plain strings render as-is; `{ id, text }` spans are citable passages that get highlighted. */
export type SourceSpan = string | { id: string; text: string };

export type SourceSection = {
  heading?: string;
  /** Optional left-hand label per paragraph, e.g. a transcript timestamp. */
  paragraphs: { label?: string; spans: SourceSpan[] }[];
};

export type SourceDocument = {
  id: string;
  date: string;
  patient: string;
  title: string;
  kind: string;
  author: string;
  sections: SourceSection[];
};

export type SourcePanelTab = "record" | "graph";

export type Insight = {
  label: string;
  text: string;
};

export type MeetingDetails = {
  title: string;
  scheduledFor: string;
};
