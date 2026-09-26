import type { SourceCategory } from "../types";

type CategoryStyle = {
  label: string;
  dot: string;
  chip: string;
  chipActive: string;
  highlight: string;
};

/** Class names are spelled out in full so Tailwind can find them. Order is the legend order. */
export const SOURCE_CATEGORIES: Record<SourceCategory, CategoryStyle> = {
  "clinician-notes": {
    label: "Clinician notes",
    dot: "bg-source-notes",
    chip: "bg-source-notes/15 text-source-notes hover:bg-source-notes/25",
    chipActive: "bg-source-notes text-white",
    highlight: "bg-source-notes/15 ring-source-notes/50",
  },
  "live-transcript": {
    label: "Live transcripts",
    dot: "bg-source-transcript",
    chip: "bg-source-transcript/15 text-source-transcript hover:bg-source-transcript/25",
    chipActive: "bg-source-transcript text-white",
    highlight: "bg-source-transcript/15 ring-source-transcript/50",
  },
  ehr: {
    label: "Electronic health records",
    dot: "bg-source-ehr",
    chip: "bg-source-ehr/15 text-source-ehr hover:bg-source-ehr/25",
    chipActive: "bg-source-ehr text-white",
    highlight: "bg-source-ehr/15 ring-source-ehr/50",
  },
  "medical-reference": {
    label: "Grounded medical sources",
    dot: "bg-source-reference",
    chip: "bg-source-reference/15 text-source-reference hover:bg-source-reference/25",
    chipActive: "bg-source-reference text-white",
    highlight: "bg-source-reference/15 ring-source-reference/50",
  },
};

export const SOURCE_CATEGORY_ORDER = Object.keys(SOURCE_CATEGORIES) as SourceCategory[];
