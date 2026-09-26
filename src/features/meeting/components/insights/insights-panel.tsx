import { RefreshCw, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { InsightsState } from "../../hooks/use-insights";
import type { Citation } from "../../types";
import { CitationChip } from "../sources/citation-chip";
import { InsightsEmptyState } from "./insights-empty-state";
import { InsightsLoading } from "./insights-loading";

type InsightsPanelProps = {
  state: InsightsState;
  activeCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
};

const citationKey = (citation: Citation) => `${citation.sourceId}#${citation.passageId}`;

export function InsightsPanel({ state, activeCitation, onCitationClick }: InsightsPanelProps) {
  const { status, bullets, error, transcriptSegmentCount, generate } = state;
  const isGenerating = status === "generating";
  const hasInsights = bullets.length > 0;
  const citationNumbers = new Map<string, number>();
  bullets.forEach((bullet) =>
    bullet.citations.forEach((citation) => {
      const key = citationKey(citation);
      if (!citationNumbers.has(key)) citationNumbers.set(key, citationNumbers.size + 1);
    }),
  );
  const activeKey = activeCitation && citationKey(activeCitation);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 font-display text-2xl">
            <WandSparkles className="size-5 text-primary" /> Insights
          </div>
          <p className="text-sm text-muted-foreground">
            A concise summary of the finalized live transcript.
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
            {transcriptSegmentCount === 1 ? "" : "s"}.
          </p>
          <ul className="list-disc space-y-3 border-t border-border py-6 pl-5 text-sm leading-7 marker:text-muted-foreground">
            {bullets.map((bullet, index) => (
              <li key={`${bullet.text}-${index}`} className="pl-1">
                {bullet.text}{" "}
                {bullet.citations.map((citation) => (
                  <CitationChip
                    key={citationKey(citation)}
                    number={citationNumbers.get(citationKey(citation)) ?? 0}
                    sourceLabel={`Live transcript ${citation.sourceId}`}
                    active={citationKey(citation) === activeKey}
                    onClick={() => onCitationClick(citation)}
                  />
                ))}
              </li>
            ))}
          </ul>
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
