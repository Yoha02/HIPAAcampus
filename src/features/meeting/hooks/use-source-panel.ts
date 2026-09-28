import { useCallback, useState } from "react";

import { saveSource } from "../lib/clinical-api";
import type { ChatReply, Citation, SourceDocument, SourcePanelTab } from "../types";

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
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [answer, setAnswer] = useState<ChatReply | null>(null);

  const mergeSources = useCallback(
    (added: SourceDocument[]) =>
      setSources((current) => {
        const merged = new Map(current.map((source) => [source.id, source]));
        added.forEach((source) => merged.set(source.id, source));
        return [...merged.values()];
      }),
    [],
  );

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
    answer,
    mergeSources,
    setAnswer,
    activeSource: sources.find((source) => source.id === focus?.sourceId),
    setTab,
    toggle: () => setIsOpen((open) => !open),
    close: () => setIsOpen(false),
    showCitation: (citation: Citation) => show(citation.sourceId, citation.passageId),
    showSource: (sourceId: string) => show(sourceId, null),
    showList: () => setFocus(null),
    showGraph: (reply: ChatReply) => {
      setAnswer(reply);
      setIsOpen(true);
      setTab("graph");
    },
    addSource: async (source: SourceDocument) => {
      const saved = await saveSource(source);
      mergeSources([saved]);
      show(saved.id, null);
    },
  };
}
