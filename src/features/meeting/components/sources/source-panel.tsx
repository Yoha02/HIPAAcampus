import { X } from "lucide-react";

import { UnderlineTabs } from "@/components/shared/underline-tabs";
import { Button } from "@/components/ui/button";

import type { SourcePanel as SourcePanelState } from "../../hooks/use-source-panel";
import type { SourcePanelTab } from "../../types";
import { SourceDocumentView } from "./source-document-view";
import { SourceRecordList } from "./source-record-list";

const SOURCE_TABS: { value: SourcePanelTab; label: string }[] = [
  { value: "record", label: "Record" },
  { value: "graph", label: "Graph" },
];

type SourcePanelProps = {
  panel: SourcePanelState;
};

export function SourcePanel({ panel }: SourcePanelProps) {
  const source = panel.sources.find((item) => item.id === panel.focus?.sourceId);

  return (
    <aside
      aria-label="Sources"
      className="fixed bottom-0 right-0 top-16 z-30 flex w-full flex-col border-l border-border bg-card shadow-soft sm:w-[var(--source-panel-width)]"
    >
      <div className="flex items-center justify-between px-5 pt-3">
        <h2 className="font-semibold">Sources</h2>
        <Button variant="ghost" size="icon" onClick={panel.close} aria-label="Close sources">
          <X />
        </Button>
      </div>
      <div className="px-5">
        <UnderlineTabs options={SOURCE_TABS} value={panel.tab} onChange={panel.setTab} />
      </div>

      {panel.tab === "graph" ? (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {panel.graph.nodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask a question to build a graph from its validated evidence.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Deterministic links from answer claims to cited evidence.
              </p>
              <div className="space-y-2">
                {panel.graph.nodes.map((node) => {
                  const isSource = panel.sources.some((item) => item.id === node.id);
                  return (
                    <button
                      key={node.id}
                      type="button"
                      disabled={!isSource}
                      onClick={() => isSource && panel.showSource(node.id)}
                      className="w-full rounded-lg border border-border bg-background p-3 text-left disabled:cursor-default"
                    >
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-wide text-primary">
                        {node.kind.replaceAll("_", " ")}
                      </span>
                      <span className="text-sm">{node.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 border-t border-border pt-4">
                {panel.graph.edges.map((edge, index) => (
                  <p key={`${edge.source}-${edge.target}-${index}`} className="mb-2 text-xs">
                    <span className="font-medium">{edge.source}</span>{" "}
                    <span className="text-muted-foreground">{edge.type.replaceAll("_", " ")}</span>{" "}
                    <span className="font-medium">{edge.target}</span>
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      ) : source && panel.focus ? (
        <SourceDocumentView
          key={source.id}
          source={source}
          passageId={panel.focus.passageId}
          request={panel.focus.request}
          onBack={panel.showList}
        />
      ) : (
        <SourceRecordList sources={panel.sources} onSelect={panel.showSource} />
      )}
    </aside>
  );
}
