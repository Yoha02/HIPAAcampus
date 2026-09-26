import type { MeetingDetails, ReplySentence } from "./types";

export const DEMO_MEETING: MeetingDetails = {
  title: "Clinical consultation",
  scheduledFor: "Today · Local hackathon demo",
};

export const SUGGESTED_QUESTIONS = [
  "What's changed since her last visit?",
  "Why did Maria stop metformin?",
  "Has her weight changed, and did she say why?",
  "Which of my patients over 50 were diagnosed with diabetes in the last two years and have lost more than 5% of their body weight?",
];

const CALL = "call-2026-06-04";

export const DEMO_ASSISTANT_REPLY: ReplySentence[] = [
  {
    text: "Maria stopped metformin in mid-May 2026, about two weeks before the June 4 call.",
    citations: [{ sourceId: CALL, passageId: "stopped-metformin" }],
  },
  {
    text: "She said it gave her diarrhea with greasy, pale stools that floated and were hard to flush.",
    citations: [{ sourceId: CALL, passageId: "stool-description" }],
  },
  {
    text: "She added that the diarrhea had not improved two weeks after stopping, and that her appetite had dropped.",
    citations: [{ sourceId: CALL, passageId: "persistent-symptoms" }],
  },
  {
    text: "The June note records only “GI intolerance”; the stool description and the persistence after stopping aren't documented.",
    citations: [{ sourceId: "note-2026-06-04", passageId: "gi-intolerance" }],
  },
];
