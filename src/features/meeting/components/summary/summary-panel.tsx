import { RefreshCw, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { SummaryState } from "../../hooks/use-summary";
import { SummaryEmptyState } from "./summary-empty-state";
import { SummaryLoading } from "./summary-loading";

type SummaryPanelProps = {
  state: SummaryState;
};

export function SummaryPanel({ state }: SummaryPanelProps) {
  const { status, bullets, generate } = state;
  const isGenerating = status === "generating";
  const hasSummary = bullets.length > 0;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 font-display text-2xl">
            <WandSparkles className="size-5 text-primary" /> Summary
          </div>
          <p className="text-sm text-muted-foreground">
            Your notes and captured speech · Local extractive mode.
          </p>
        </div>
        {hasSummary && (
          <Button variant="outline" size="sm" onClick={generate} disabled={isGenerating}>
            <RefreshCw className={cn(isGenerating && "animate-spin")} />
            {isGenerating ? "Regenerating" : "Regenerate"}
          </Button>
        )}
      </div>
      {state.error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {status === "ready" && !hasSummary && (
        <p className="mb-4 text-sm text-muted-foreground">
          No notes or completed transcript passages yet.
        </p>
      )}
      {isGenerating ? (
        <SummaryLoading regenerating={hasSummary} />
      ) : hasSummary ? (
        <ul className="list-disc space-y-2.5 border-t border-border pl-5 pt-6 leading-7 marker:text-muted-foreground">
          {bullets.map((bullet) => (
            <li key={bullet} className="pl-1">
              {bullet}
            </li>
          ))}
        </ul>
      ) : (
        <SummaryEmptyState onGenerate={generate} />
      )}
    </div>
  );
}
