import { X } from "lucide-react";

import { UnderlineTabs } from "@/components/shared/underline-tabs";
import { Button } from "@/components/ui/button";

import type { SourcePanel as SourcePanelState } from "../../hooks/use-source-panel";
import { DEMO_SOURCES, findSource } from "../../sources";
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
  const source = findSource(panel.focus?.sourceId ?? null);

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
        <div className="flex-1" />
      ) : source && panel.focus ? (
        <SourceDocumentView
          key={source.id}
          source={source}
          passageId={panel.focus.passageId}
          request={panel.focus.request}
          onBack={panel.showList}
        />
      ) : (
        <SourceRecordList sources={DEMO_SOURCES} onSelect={panel.showSource} />
      )}
    </aside>
  );
}
