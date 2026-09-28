import { ArrowUpRight, GitBranch } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { ChatReply, Citation } from "../../types";
import { SourceDot } from "./source-dot";

type Props = { answer: ChatReply | null; onCitationClick: (citation: Citation) => void };

export function SourceGraph({ answer, onCitationClick }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!answer) {
    return (
      <div className="px-6 py-12 text-center text-sm text-muted-foreground">
        <GitBranch className="mx-auto mb-3 size-5" />
        Ask a question to see how its answer connects to the original records.
      </div>
    );
  }

  const answerNode = answer.graph.nodes.find((node) => node.kind === "answer");
  const nodes = answer.graph.nodes.filter(
    (node) =>
      node.kind === "source" &&
      answer.graph.edges.some((edge) => edge.source === node.id && edge.target === answerNode?.id),
  );
  const selected = nodes.find((node) => node.id === selectedId);
  const source = answer.sources.find((document) => document.id === selected?.id);
  const height = 128 + Math.ceil(nodes.length / 2) * 126;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <p className="mb-4 text-xs text-muted-foreground">
        {nodes.length
          ? "Select a record to inspect the passages cited in this answer."
          : "No supporting passages were found for this answer."}
      </p>
      <div
        className="relative"
        style={{ height: nodes.length ? height : 100 }}
        aria-label="Answer evidence graph"
      >
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full text-border"
          aria-hidden="true"
        >
          {nodes.map((node, index) => {
            const x = nodes.length === 1 ? 50 : index % 2 === 0 ? 23 : 77;
            const y = 128 + Math.floor(index / 2) * 126;
            return (
              <path
                key={node.id}
                d={`M50 88 V108 H${x} V${y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="absolute left-[8%] top-0 flex h-[88px] w-[84%] flex-col justify-center rounded-xl border border-primary/30 bg-primary/5 px-4 text-center">
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your question
          </span>
          <p className="line-clamp-2 text-sm font-medium" title={answer.question}>
            {answer.question}
          </p>
        </div>
        {nodes.map((node, index) => {
          const document = answer.sources.find((item) => item.id === node.id);
          if (!document) return null;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedId(node.id)}
              aria-pressed={selectedId === node.id}
              aria-label={`Inspect ${document.title}, ${document.date}`}
              title={`${document.title} · ${document.date}`}
              className={cn(
                "absolute flex h-[100px] w-[46%] flex-col items-center justify-center gap-1 rounded-xl border bg-card px-2 text-center transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedId === node.id ? "border-primary bg-primary/5" : "border-border",
              )}
              style={{
                top: 128 + Math.floor(index / 2) * 126,
                left: nodes.length === 1 ? "27%" : index % 2 === 0 ? "0%" : "54%",
              }}
            >
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <SourceDot category={document.category} />
                {document.date}
              </span>
              <span className="line-clamp-2 text-xs font-medium leading-4">{document.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {node.citations.length} cited passage{node.citations.length === 1 ? "" : "s"}
              </span>
            </button>
          );
        })}
      </div>
      {nodes.length > 0 && (
        <p className="mb-4 text-center text-[11px] text-muted-foreground">
          Connections show citation provenance, not clinical causation.
        </p>
      )}
      {selected && source && (
        <section
          className="space-y-4 rounded-xl border border-border bg-background p-4"
          aria-label="Selected graph source"
          aria-live="polite"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {source.date} · {source.kind}
            </p>
            <h3 className="mt-1 text-sm font-medium">{source.title}</h3>
          </div>
          {selected.citations.map((citation) => {
            const paragraph = source.sections
              .flatMap((section) => section.paragraphs)
              .find((paragraph) =>
                paragraph.spans.some(
                  (span) => typeof span !== "string" && span.id === citation.passageId,
                ),
              );
            const span = paragraph?.spans.find(
              (span) => typeof span !== "string" && span.id === citation.passageId,
            );
            if (!span || typeof span === "string") return null;
            return (
              <div key={citation.passageId}>
                <p className="text-xs text-muted-foreground">{paragraph?.label}</p>
                <p className="mt-1 text-sm leading-6">“{span.text}”</p>
                <button
                  type="button"
                  onClick={() => onCitationClick(citation)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open original passage <ArrowUpRight className="size-3" />
                </button>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
