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
  | { role: "user"; text: string }
  | {
      role: "assistant";
      answer: string;
      claims: ReplySentence[];
      status: "completed" | "insufficient_evidence" | "failed";
      knowledgeStatus: string;
      limitations: string[];
    };

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
  synthetic: boolean;
  consentCategory: string;
  documentationStatus: string;
  sections: SourceSection[];
};

export type SourcePanelTab = "record" | "graph";

export type InsightBullet = ReplySentence;

export type MeetingDetails = {
  title: string;
  scheduledFor: string;
};

export type EvidenceSource = {
  id: string;
  patient_id: string;
  kind: string;
  title: string;
  date: string;
  clinical_date: string;
  text: string;
  excerpt: string;
  speaker: string | null;
  start_ms: number | null;
  end_ms: number | null;
  consent_category: string;
  documentation_status: string;
  synthetic: boolean;
};

export type EvidenceGraph = {
  nodes: { id: string; kind: string; label: string }[];
  edges: { source: string; target: string; type: string }[];
};

export type PatientOption = {
  patient_id: string;
  name: string;
  age: number;
  synthetic: true;
  label: string;
};

export type ConsentState = {
  categories: Record<string, { consented: boolean; version: number; last_updated: string }>;
  consent_version: number;
};
