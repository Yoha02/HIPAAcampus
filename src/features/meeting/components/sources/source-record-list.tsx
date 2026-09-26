import { ChevronRight, FileText } from "lucide-react";

import type { SourceDocument } from "../../types";

type SourceRecordListProps = {
  sources: SourceDocument[];
  onSelect: (sourceId: string) => void;
};

export function SourceRecordList({ sources, onSelect }: SourceRecordListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <p className="mb-3 text-xs text-muted-foreground">
        {sources.length} permitted evidence item{sources.length === 1 ? "" : "s"} from the latest
        answer. Click a citation to jump to its exact excerpt.
      </p>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.id}>
            <button
              type="button"
              onClick={() => onSelect(source.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left transition-colors hover:bg-muted"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {source.date} {source.patient} {source.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {source.kind} · {source.author}
                </span>
                <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                  Synthetic demo data · {source.documentationStatus.replaceAll("_", " ")}
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
