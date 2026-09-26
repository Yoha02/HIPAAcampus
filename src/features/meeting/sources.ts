import type { SourceDocument } from "./types";

const PATIENT = "Maria Alvarez";

export const DEMO_SOURCES: SourceDocument[] = [
  {
    id: "call-2026-06-04",
    date: "6/4/26",
    patient: PATIENT,
    title: "Follow-up Call Transcript",
    kind: "Call transcript",
    author: "Recorded by Dr. M. Nguyen",
    sections: [
      {
        paragraphs: [
          {
            label: "00:00:03",
            spans: [
              "Hi Maria, this is Dr. Nguyen's office calling for your follow-up. Is now still a good time to talk for about fifteen minutes? Yes, now is fine, I'm at home.",
            ],
          },
          {
            label: "00:00:21",
            spans: [
              "Great. I wanted to check in on how you've been since your visit in March and go over the lab work from last week. Your blood pressure log looked good.",
            ],
          },
          {
            label: "00:01:02",
            spans: [
              "I've been walking in the mornings most days, about twenty minutes. My knees are better than they were in the winter.",
            ],
          },
          {
            label: "00:01:40",
            spans: [
              "That's good to hear. How about the metformin? Are you still taking it twice a day with meals?",
            ],
          },
          {
            label: "00:01:52",
            spans: [
              "Actually, no. ",
              {
                id: "stopped-metformin",
                text: "I stopped taking it around the middle of May, so maybe two weeks ago now.",
              },
              " I didn't want to keep taking it the way it was making me feel.",
            ],
          },
          {
            label: "00:02:15",
            spans: ["Okay, thank you for telling me. Can you describe what was happening?"],
          },
          {
            label: "00:02:24",
            spans: [
              "It was the diarrhea. ",
              {
                id: "stool-description",
                text: "The stools were greasy and really pale, kind of a light clay color, and they floated. They were hard to flush. I'd have to flush two or three times.",
              },
            ],
          },
          {
            label: "00:03:05",
            spans: ["Did things get better once you stopped the medication?"],
          },
          {
            label: "00:03:12",
            spans: [
              "Not really. ",
              {
                id: "persistent-symptoms",
                text: "It's been two weeks since I stopped and the diarrhea hasn't gotten any better. And I just haven't been hungry. I'm eating maybe half of what I used to.",
              },
            ],
          },
          {
            label: "00:03:48",
            spans: [
              "Any abdominal pain, fever, or blood in the stool? Some cramping after I eat, but no fever, and no blood that I've seen.",
            ],
          },
          {
            label: "00:04:20",
            spans: [
              "Okay. I'd like to get some stool studies and a few blood tests, and I'm going to talk with Dr. Patel about next steps for your diabetes medication. We'll call you back with a plan by Friday.",
            ],
          },
          {
            label: "00:05:02",
            spans: [
              "Should I keep not taking the metformin until then? Yes, stay off it for now, and keep checking your sugars in the morning.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "note-2026-06-04",
    date: "6/4/26",
    patient: PATIENT,
    title: "Telephone Encounter Note",
    kind: "Visit note",
    author: "Dr. M. Nguyen, MD",
    sections: [
      {
        heading: "Reason for call",
        paragraphs: [
          { spans: ["Scheduled follow-up to review diabetes management and labs from 5/28/26."] },
        ],
      },
      {
        heading: "Subjective",
        paragraphs: [
          {
            spans: [
              "Patient reports she has stopped taking metformin. ",
              { id: "gi-intolerance", text: "Reason given: GI intolerance." },
              " Walking 20 minutes most mornings. Home BP readings within goal. Denies fever.",
            ],
          },
        ],
      },
      {
        heading: "Medications",
        paragraphs: [
          { spans: ["Metformin 500 mg PO BID, discontinued by patient."] },
          { spans: ["Lisinopril 10 mg PO daily."] },
          { spans: ["Atorvastatin 20 mg PO nightly."] },
        ],
      },
      {
        heading: "Assessment",
        paragraphs: [
          {
            spans: [
              "1. Type 2 diabetes mellitus without complications. HbA1c 7.4% (5/28/26), up from 7.1%.",
            ],
          },
          { spans: ["2. Essential hypertension, controlled."] },
        ],
      },
      {
        heading: "Plan",
        paragraphs: [
          { spans: ["Discuss alternative glucose-lowering agents with Dr. Patel."] },
          { spans: ["Continue home glucose monitoring. Phone follow-up in 1 week."] },
        ],
      },
    ],
  },
  {
    id: "labs-2026-05-28",
    date: "5/28/26",
    patient: PATIENT,
    title: "Lab Results: HbA1c and CMP",
    kind: "Lab report",
    author: "Valley Clinical Laboratory",
    sections: [
      {
        heading: "Hemoglobin A1c",
        paragraphs: [
          { label: "HbA1c", spans: ["7.4% (reference < 5.7%). Prior: 7.1% on 3/12/26."] },
        ],
      },
      {
        heading: "Comprehensive metabolic panel",
        paragraphs: [
          { label: "Glucose", spans: ["148 mg/dL (fasting)"] },
          { label: "Creatinine", spans: ["0.8 mg/dL"] },
          { label: "eGFR", spans: ["> 90 mL/min/1.73m²"] },
          { label: "Sodium", spans: ["138 mmol/L"] },
          { label: "Potassium", spans: ["4.1 mmol/L"] },
          { label: "Albumin", spans: ["3.9 g/dL"] },
          { label: "ALT", spans: ["22 U/L"] },
          { label: "AST", spans: ["19 U/L"] },
        ],
      },
    ],
  },
  {
    id: "note-2026-03-12",
    date: "3/12/26",
    patient: PATIENT,
    title: "Visit Notes",
    kind: "Visit note",
    author: "Dr. M. Nguyen, MD",
    sections: [
      {
        heading: "Chief complaint",
        paragraphs: [{ spans: ["Follow-up for type 2 diabetes and hypertension."] }],
      },
      {
        heading: "History of present illness",
        paragraphs: [
          {
            spans: [
              "58-year-old woman with type 2 diabetes diagnosed in 2024, managed with diet and exercise. HbA1c today 7.1%, up from 6.6% in September. Reports good adherence to lisinopril. No hypoglycemia symptoms.",
            ],
          },
        ],
      },
      {
        heading: "Plan",
        paragraphs: [
          {
            spans: [
              "Start metformin 500 mg PO BID with meals. Counseled on common GI side effects, which usually improve within a few weeks. Repeat HbA1c in 3 months.",
            ],
          },
        ],
      },
    ],
  },
];

export function findSource(id: string | null): SourceDocument | undefined {
  return DEMO_SOURCES.find((source) => source.id === id);
}
