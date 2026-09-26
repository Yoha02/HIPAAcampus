import { createFileRoute } from "@tanstack/react-router";

import { MeetingWorkspace } from "@/features/meeting";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hippacampus — Physician Notes Workspace" },
      {
        name: "description",
        content: "A calm workspace for live transcripts, notes, and meeting summaries.",
      },
      { property: "og:title", content: "Hippacampus — Physician Notes Workspace" },
      {
        property: "og:description",
        content: "Capture live transcripts and turn conversations into clear notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeetingWorkspace,
});
