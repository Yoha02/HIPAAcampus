import { SOURCE_CATEGORIES, SOURCE_CATEGORY_ORDER } from "../../lib/source-categories";
import { SourceDot } from "./source-dot";

export function SourceLegend() {
  return (
    <ul
      aria-label="Source types"
      className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-border px-5 py-3 text-xs text-muted-foreground"
    >
      {SOURCE_CATEGORY_ORDER.map((category) => (
        <li key={category} className="flex items-center gap-2">
          <SourceDot category={category} />
          {SOURCE_CATEGORIES[category].label}
        </li>
      ))}
    </ul>
  );
}
