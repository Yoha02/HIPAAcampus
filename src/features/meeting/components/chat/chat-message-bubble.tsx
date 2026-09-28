import { Fragment } from "react";

import { sourceTitle } from "../../sources";
import type { ChatMessage, ChatReply, Citation, ReplySentence, SourceDocument } from "../../types";
import { CitationChip } from "../sources/citation-chip";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  activeCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onShowGraph: (reply: ChatReply) => void;
  onSelectAnswer: (reply: ChatReply) => void;
};

const citationKey = (citation: Citation) => `${citation.sourceId}#${citation.passageId}`;

/** Numbers each distinct passage in order of first appearance, like footnotes. */
function numberCitations(sentences: ReplySentence[]) {
  const numbers = new Map<string, number>();
  for (const sentence of sentences) {
    for (const citation of sentence.citations) {
      const key = citationKey(citation);
      if (!numbers.has(key)) numbers.set(key, numbers.size + 1);
    }
  }
  return numbers;
}

function CitationButton({
  citation,
  number,
  active,
  onClick,
  sources,
}: {
  citation: Citation;
  number: number;
  active: boolean;
  onClick: () => void;
  sources: SourceDocument[];
}) {
  const source = sources.find((source) => source.id === citation.sourceId);
  if (!source) return null;
  return (
    <CitationChip
      number={number}
      category={source.category}
      sourceLabel={sourceTitle(source)}
      active={active}
      onClick={onClick}
    />
  );
}

export function ChatMessageBubble({
  message,
  activeCitation,
  onCitationClick,
  onShowGraph,
  onSelectAnswer,
}: ChatMessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[78%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
        {message.text}
      </div>
    );
  }

  const numbers = numberCitations(message.sentences);
  const activeKey = activeCitation && citationKey(activeCitation);

  return (
    <div className="max-w-[90%] text-sm leading-7">
      {message.sentences.map((sentence, index) => (
        <Fragment key={index}>
          {sentence.text}
          {sentence.citations.map((citation) => (
            <CitationButton
              key={citationKey(citation)}
              citation={citation}
              sources={message.sources}
              number={numbers.get(citationKey(citation)) ?? 0}
              active={citationKey(citation) === activeKey}
              onClick={() => {
                onSelectAnswer(message);
                onCitationClick(citation);
              }}
            />
          ))}{" "}
        </Fragment>
      ))}
      <button
        type="button"
        onClick={() => onShowGraph(message)}
        className="mt-2 block text-xs font-medium text-primary hover:underline"
      >
        View connections
      </button>
    </div>
  );
}
