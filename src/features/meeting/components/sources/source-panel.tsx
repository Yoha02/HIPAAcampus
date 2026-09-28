import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UnderlineTabs } from "@/components/shared/underline-tabs";
import { Button } from "@/components/ui/button";

import type { SourcePanel as SourcePanelState } from "../../hooks/use-source-panel";
import type { SourceDocument, SourcePanelTab } from "../../types";
import { AddSourceDialog } from "./add-source-dialog";
import { SourceDocumentView } from "./source-document-view";
import { SourceLegend } from "./source-legend";
import { SourceRecordList } from "./source-record-list";
import { SourceGraph } from "./source-graph";

const SOURCE_TABS: { value: SourcePanelTab; label: string }[] = [
  { value: "record", label: "Record" },
  { value: "graph", label: "Graph" },
];

type SourcePanelProps = {
  panel: SourcePanelState;
};

export function SourcePanel({ panel }: SourcePanelProps) {
  const [adding, setAdding] = useState(false);
  const source = panel.activeSource;

  const addSource = async (added: SourceDocument) => {
    await panel.addSource(added);
    toast.success(`Added “${added.title}”`);
  };

  return (
    <aside
      aria-label="Sources"
      className="fixed bottom-0 right-0 top-16 z-30 flex w-full flex-col border-l border-border bg-card shadow-soft sm:w-[var(--source-panel-width)]"
    >
      <div className="flex items-center justify-between px-5 pt-3">
        <h2 className="font-semibold">Sources</h2>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAdding(true)}
            aria-label="Add source"
          >
            <Plus />
          </Button>
          <Button variant="ghost" size="icon" onClick={panel.close} aria-label="Close sources">
            <X />
          </Button>
        </div>
      </div>
      <div className="px-5">
        <UnderlineTabs options={SOURCE_TABS} value={panel.tab} onChange={panel.setTab} />
      </div>

      <SourceLegend />

      {panel.tab === "graph" ? (
        <SourceGraph
          key={panel.answer?.id ?? "empty"}
          answer={panel.answer}
          onCitationClick={panel.showCitation}
        />
      ) : source && panel.focus ? (
        <SourceDocumentView
          key={source.id}
          source={source}
          passageId={panel.focus.passageId}
          request={panel.focus.request}
          onBack={panel.showList}
        />
      ) : (
        <SourceRecordList
          sources={panel.sources}
          onSelect={panel.showSource}
          onAdd={() => setAdding(true)}
        />
      )}

      <AddSourceDialog open={adding} onOpenChange={setAdding} onAdd={addSource} />
    </aside>
  );
}
