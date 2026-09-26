import { cn } from "@/lib/utils";

import { SOURCE_CATEGORIES } from "../../lib/source-categories";
import type { SourceCategory } from "../../types";

type CitationChipProps = {
  number: number;
  category: SourceCategory;
  sourceLabel: string;
  active: boolean;
  onClick: () => void;
};

export function CitationChip({
  number,
  category,
  sourceLabel,
  active,
  onClick,
}: CitationChipProps) {
  const style = SOURCE_CATEGORIES[category];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${style.label}: ${sourceLabel}`}
      aria-label={`Source ${number}, ${style.label}: ${sourceLabel}`}
      aria-pressed={active}
      className={cn(
        "mx-0.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full align-[0.1em] text-[0.68rem] font-semibold tabular-nums transition-colors",
        active ? style.chipActive : style.chip,
      )}
    >
      {number}
    </button>
  );
}
