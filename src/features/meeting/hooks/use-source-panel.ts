import { useState } from "react";

import { DEMO_SOURCES } from "../sources";
import type { Citation, SourceDocument, SourcePanelTab } from "../types";

type Focus = {
  sourceId: string;
  passageId: string | null;
  /** Bumped on every request so re-clicking the same citation scrolls to it again. */
  request: number;
};

export type SourcePanel = ReturnType<typeof useSourcePanel>;

export function useSourcePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<SourcePanelTab>("record");
  const [focus, setFocus] = useState<Focus | null>(null);
  const [sources, setSources] = useState<SourceDocument[]>(DEMO_SOURCES);

  const show = (sourceId: string, passageId: string | null) => {
    setIsOpen(true);
    setTab("record");
    setFocus((current) => ({ sourceId, passageId, request: (current?.request ?? 0) + 1 }));
  };

  return {
    isOpen,
    tab,
    focus,
    sources,
    activeSource: sources.find((source) => source.id === focus?.sourceId),
    setTab,
    toggle: () => setIsOpen((open) => !open),
    close: () => setIsOpen(false),
    showCitation: (citation: Citation) => show(citation.sourceId, citation.passageId),
    showSource: (sourceId: string) => show(sourceId, null),
    showList: () => setFocus(null),
    addSource: (source: SourceDocument) => {
      setSources((current) => [source, ...current]);
      show(source.id, null);
    },
  };
}
