import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { SourceDocument, SourceSpan } from "../../types";

type SourceDocumentViewProps = {
  source: SourceDocument;
  passageId: string | null;
  /** Changes on every citation click so the same passage can be scrolled to again. */
  request: number;
  onBack: () => void;
};

export function SourceDocumentView({
  source,
  passageId,
  request,
  onBack,
}: SourceDocumentViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const target = passageId
      ? container.querySelector(`[data-passage-id="${CSS.escape(passageId)}"]`)
      : null;
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });
    else container.scrollTo({ top: 0 });
  }, [source.id, passageId, request]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ChevronLeft /> All sources
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-10 pt-2">
        <header className="mb-5 border-b border-border pb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {source.kind}
          </p>
          <h3 className="font-display text-2xl leading-tight">
            {source.date} {source.patient} {source.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{source.author}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
              Synthetic demo data
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
              {source.documentationStatus.replaceAll("_", " ")}
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
              Consent: {source.consentCategory.replaceAll("_", " ")}
            </span>
          </div>
        </header>

        <div className="space-y-5 text-sm leading-6">
          {source.sections.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              {section.heading && (
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.heading}
                </h4>
              )}
              <div className="space-y-2.5">
                {section.paragraphs.map((paragraph, index) => (
                  <div
                    key={index}
                    className={cn(paragraph.label && "grid grid-cols-[4.75rem_1fr] gap-3")}
                  >
                    {paragraph.label && (
                      <span className="pt-px text-xs tabular-nums text-muted-foreground">
                        {paragraph.label}
                      </span>
                    )}
                    <p className="text-foreground/85">
                      {paragraph.spans.map((span, spanIndex) => (
                        <SourceSpanText key={spanIndex} span={span} focusedId={passageId} />
                      ))}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceSpanText({ span, focusedId }: { span: SourceSpan; focusedId: string | null }) {
  if (typeof span === "string") return <>{span}</>;
  if (span.id !== focusedId) return <span data-passage-id={span.id}>{span.text}</span>;
  return (
    <mark
      data-passage-id={span.id}
      className="rounded-sm bg-highlight px-0.5 text-foreground ring-2 ring-highlight-ring/60 box-decoration-clone"
    >
      {span.text}
    </mark>
  );
}
