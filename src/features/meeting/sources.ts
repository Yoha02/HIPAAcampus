import type { SourceDocument } from "./types";

export const DEMO_CONNECTORS: {
  name: string;
  category: SourceDocument["category"];
  description: string;
}[] = [
  { name: "Epic", category: "ehr", description: "Visit notes, labs, medications" },
  { name: "Oracle Health (Cerner)", category: "ehr", description: "Encounters and results" },
  { name: "Microsoft Teams", category: "live-transcript", description: "Call transcripts" },
  { name: "UpToDate", category: "medical-reference", description: "Clinical topic reviews" },
  { name: "PubMed", category: "medical-reference", description: "Published research" },
];

export function sourceTitle(source: SourceDocument): string {
  return [source.date, source.patient, source.title].filter(Boolean).join(" ");
}
