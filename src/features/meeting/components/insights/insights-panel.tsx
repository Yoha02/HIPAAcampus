import { RefreshCw, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { InsightsState } from "../../hooks/use-insights";
import { InsightRow } from "./insight-row";
import { InsightsEmptyState } from "./insights-empty-state";
import { InsightsLoading } from "./insights-loading";

type InsightsPanelProps = {
  state: InsightsState;
};

export function InsightsPanel({ state }: InsightsPanelProps) {
  const { status, insights, error, transcriptSegmentCount, generate } = state;
  const isGenerating = status === "generating";
  const hasInsights = insights.length > 0;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 font-display text-2xl">
            <WandSparkles className="size-5 text-primary" /> Insights
          </div>
          <p className="text-sm text-muted-foreground">
            A concise summary of the current notes and finalized transcript.
          </p>
        </div>
        {hasInsights && (
          <Button variant="outline" size="sm" onClick={generate} disabled={isGenerating}>
            <RefreshCw className={cn(isGenerating && "animate-spin")} />
            {isGenerating ? "Regenerating" : "Regenerate"}
          </Button>
        )}
      </div>
      {isGenerating ? (
        <InsightsLoading regenerating={hasInsights} />
      ) : hasInsights ? (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Generated from {transcriptSegmentCount} finalized transcript passage
            {transcriptSegmentCount === 1 ? "" : "s"} and the current notes.
          </p>
          <div className="border-t border-border text-sm">
            {insights.map((insight) => (
              <InsightRow key={insight.label} insight={insight} />
            ))}
          </div>
        </>
      ) : (
        <>
          <InsightsEmptyState onGenerate={generate} />
          {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}
