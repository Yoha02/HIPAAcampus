import type { Insight, MeetingDetails, ReplySentence } from "./types";

export const DEMO_MEETING: MeetingDetails = {
  title: "Clinical consultation",
  scheduledFor: "Today · Local hackathon demo",
};

/** Each generate or regenerate shows the next version, cycling. */
export const DEMO_INSIGHT_VERSIONS: Insight[][] = [
  [
    {
      label: "Summary",
      text: "Maria stopped metformin in mid-May after diarrhea with greasy, pale, floating stools. Two weeks later the diarrhea hasn't improved and her appetite has dropped.",
    },
    {
      label: "Documentation gap",
      text: "The 6/4 note records only “GI intolerance.” The stool description and the persistence after stopping aren't documented.",
    },
    {
      label: "Decision",
      text: "Stay off metformin for now. Dr. Nguyen will review alternative glucose-lowering agents with Dr. Patel.",
    },
    {
      label: "Next steps",
      text: "Order stool studies and blood work, keep morning glucose checks going, and call Maria back with a plan by Friday.",
    },
  ],
  [
    {
      label: "Summary",
      text: "Follow-up call on diabetes management. Maria self-discontinued metformin about two weeks ago because of GI side effects that have continued since stopping.",
    },
    {
      label: "Worth noting",
      text: "Greasy, pale stools that float and persist after stopping metformin aren't typical of metformin intolerance alone, and she reports reduced appetite and cramping after meals.",
    },
    {
      label: "Decision",
      text: "Hold metformin until the workup is back. Glucose-lowering alternatives to be discussed with Dr. Patel.",
    },
    {
      label: "Next steps",
      text: "Stool studies and labs this week. Update the encounter note with the full symptom history. Callback by Friday.",
    },
  ],
  [
    {
      label: "Summary",
      text: "HbA1c rose to 7.4% from 7.1%. Maria stopped metformin in mid-May after persistent diarrhea and now reports lower appetite. Blood pressure is at goal and she walks most mornings.",
    },
    {
      label: "Documentation gap",
      text: "The chart attributes the discontinuation to “GI intolerance” without the stool characteristics, the timeline, or the fact that symptoms continued after stopping.",
    },
    {
      label: "Decision",
      text: "Remain off metformin. Continue lisinopril and atorvastatin unchanged.",
    },
    {
      label: "Next steps",
      text: "Stool studies and blood tests, discuss alternatives with Dr. Patel, phone follow-up within a week.",
    },
  ],
];

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
