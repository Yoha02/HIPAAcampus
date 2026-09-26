import { ChevronRight, Plus } from "lucide-react";

import { SOURCE_CATEGORIES } from "../../lib/source-categories";
import { sourceTitle } from "../../sources";
import type { SourceDocument } from "../../types";
import { SourceDot } from "./source-dot";

type SourceRecordListProps = {
  sources: SourceDocument[];
  onSelect: (sourceId: string) => void;
  onAdd: () => void;
};

export function SourceRecordList({ sources, onSelect, onAdd }: SourceRecordListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <button
        type="button"
        onClick={onAdd}
        className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" /> Add source
      </button>
      <p className="mb-3 text-xs text-muted-foreground">
        {sources.length} sources. Click a citation in a chat reply to jump to the passage it came
        from.
      </p>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.id}>
            <button
              type="button"
              onClick={() => onSelect(source.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left transition-colors hover:bg-muted"
            >
              <SourceDot category={source.category} className="size-2.5" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{sourceTitle(source)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {SOURCE_CATEGORIES[source.category].label} · {source.kind}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
