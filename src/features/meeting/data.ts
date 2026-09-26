import type { MeetingDetails, ReplySentence } from "./types";

export const DEMO_MEETING: MeetingDetails = {
  title: "Research handoff",
  scheduledFor: "Today, 2:30 PM",
};

/** Each generate or regenerate shows the next version, cycling. */
export const DEMO_SUMMARY_VERSIONS: string[][] = [
  [
    "Maria stopped metformin in mid-May, about two weeks before the call.",
    "She describes diarrhea with greasy, pale stools that float and are hard to flush.",
    "The diarrhea hasn't improved since stopping, and her appetite has dropped.",
    "Some cramping after meals; no fever and no blood in the stool.",
    "The 6/4 note only says “GI intolerance” and leaves out the stool description and timeline.",
    "Staying off metformin for now while Dr. Nguyen reviews alternatives with Dr. Patel.",
    "Stool studies and blood work ordered; callback with a plan by Friday.",
  ],
  [
    "Follow-up call on diabetes management and the 5/28 labs.",
    "HbA1c is up to 7.4% from 7.1% in March.",
    "Maria self-discontinued metformin about two weeks ago because of GI side effects.",
    "Symptoms are still going: greasy, pale, floating stools and reduced appetite.",
    "Persistent symptoms after stopping aren't typical of metformin intolerance alone.",
    "Blood pressure is at goal and she walks about 20 minutes most mornings.",
    "Plan: hold metformin, run stool studies and labs, discuss next agent with Dr. Patel.",
  ],
  [
    "Walking most mornings; knees better than in the winter.",
    "Home blood pressure readings within goal; lisinopril and atorvastatin unchanged.",
    "Stopped metformin around mid-May because of how it made her feel.",
    "Diarrhea with greasy, pale stools that float, still present two weeks after stopping.",
    "Eating about half of what she used to.",
    "Chart should document the stool characteristics and persistence, not just “GI intolerance.”",
    "Keep checking morning sugars; phone follow-up within a week.",
  ],
];

export const SUGGESTED_QUESTIONS = [
  "Why did Maria stop metformin?",
  "List the next steps",
  "What themes came up?",
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
    citations: [
      { sourceId: CALL, passageId: "persistent-symptoms" },
      { sourceId: "ref-metformin-gi", passageId: "persistence-after-stopping" },
    ],
  },
  {
    text: "The June note records only “GI intolerance”; the stool description and the persistence after stopping aren't documented.",
    citations: [{ sourceId: "note-2026-06-04", passageId: "gi-intolerance" }],
  },
];
