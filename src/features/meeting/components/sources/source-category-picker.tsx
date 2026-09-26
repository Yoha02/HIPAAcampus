import { cn } from "@/lib/utils";

import { SOURCE_CATEGORIES, SOURCE_CATEGORY_ORDER } from "../../lib/source-categories";
import type { SourceCategory } from "../../types";
import { SourceDot } from "./source-dot";

type SourceCategoryPickerProps = {
  value: SourceCategory;
  onChange: (category: SourceCategory) => void;
};

export function SourceCategoryPicker({ value, onChange }: SourceCategoryPickerProps) {
  return (
    <div role="radiogroup" aria-label="Source type" className="grid grid-cols-2 gap-2">
      {SOURCE_CATEGORY_ORDER.map((category) => (
        <button
          key={category}
          type="button"
          role="radio"
          aria-checked={value === category}
          onClick={() => onChange(category)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
            value === category
              ? "border-foreground/40 bg-muted font-medium"
              : "border-border hover:bg-muted/60",
          )}
        >
          <SourceDot category={category} />
          {SOURCE_CATEGORIES[category].label}
        </button>
      ))}
    </div>
  );
}
