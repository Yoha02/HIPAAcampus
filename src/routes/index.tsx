import { createFileRoute } from "@tanstack/react-router";

import { MeetingWorkspace } from "@/features/meeting";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HIPAcampus — Physician Notes Workspace" },
      {
        name: "description",
        content: "A calm workspace for live transcripts, notes, and meeting insights.",
      },
      { property: "og:title", content: "HIPAcampus — Physician Notes Workspace" },
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
