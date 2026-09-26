import { cn } from "@/lib/utils";

import { SOURCE_CATEGORIES } from "../../lib/source-categories";
import type { SourceCategory } from "../../types";

type SourceDotProps = {
  category: SourceCategory;
  className?: string;
};

export function SourceDot({ category, className }: SourceDotProps) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", SOURCE_CATEGORIES[category].dot, className)}
    />
  );
}
