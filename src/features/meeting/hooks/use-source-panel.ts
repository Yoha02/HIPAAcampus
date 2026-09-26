import { useState } from "react";

import type {
  Citation,
  EvidenceGraph,
  EvidenceSource,
  SourceDocument,
  SourcePanelTab,
} from "../types";
import type { ChatApiResponse } from "../lib/demo-api";
import { formatElapsed } from "../lib/format";

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
  const [graph, setGraph] = useState<EvidenceGraph>({ nodes: [], edges: [] });

  const show = (sourceId: string, passageId: string | null) => {
    setIsOpen(true);
    setTab("record");
    setFocus((current) => ({ sourceId, passageId, request: (current?.request ?? 0) + 1 }));
  };

  const toDocument = (source: EvidenceSource): SourceDocument => ({
    id: source.id,
    date: source.date,
    patient: source.patient_id === "pt-maria-conti" ? "Maria Conti" : source.patient_id,
    title: source.title,
    kind: source.kind.replaceAll("_", " "),
    author: source.speaker ? `${source.speaker} · Synthetic fixture` : "Synthetic fixture",
    synthetic: source.synthetic,
    consentCategory: source.consent_category,
    documentationStatus: source.documentation_status,
    sections: [
      {
        paragraphs: [
          {
            label:
              source.start_ms !== null
                ? `${formatElapsed(Math.floor(source.start_ms / 1000))}–${formatElapsed(
                    Math.floor((source.end_ms ?? source.start_ms) / 1000),
                  )}`
                : undefined,
            spans: [{ id: source.id, text: source.excerpt }],
          },
        ],
      },
    ],
  });

  const setAnswer = (response: ChatApiResponse) => {
    setSources(response.sources.map(toDocument));
    setGraph(response.graph);
  };

  return {
    isOpen,
    tab,
    focus,
    sources,
    graph,
    setTab,
    setAnswer,
    toggle: () => setIsOpen((open) => !open),
    close: () => setIsOpen(false),
    showCitation: (citation: Citation) => show(citation.sourceId, citation.passageId),
    showSource: (sourceId: string) => show(sourceId, null),
    showList: () => setFocus(null),
    clear: () => {
      setSources([]);
      setGraph({ nodes: [], edges: [] });
      setFocus(null);
      setIsOpen(false);
    },
  };
}
