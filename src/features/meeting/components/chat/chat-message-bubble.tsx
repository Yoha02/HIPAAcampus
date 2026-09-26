import { Fragment } from "react";

import { findSource } from "../../sources";
import type { ChatMessage, Citation, ReplySentence } from "../../types";
import { CitationChip } from "../sources/citation-chip";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  activeCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
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

function sourceLabel(citation: Citation) {
  const source = findSource(citation.sourceId);
  return source ? `${source.date} ${source.patient} ${source.title}` : "Source";
}

export function ChatMessageBubble({
  message,
  activeCitation,
  onCitationClick,
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
    <p className="max-w-[78%] text-sm leading-7">
      {message.sentences.map((sentence, index) => (
        <Fragment key={index}>
          {sentence.text}
          {sentence.citations.map((citation) => (
            <CitationChip
              key={citationKey(citation)}
              number={numbers.get(citationKey(citation)) ?? 0}
              sourceLabel={sourceLabel(citation)}
              active={citationKey(citation) === activeKey}
              onClick={() => onCitationClick(citation)}
            />
          ))}{" "}
        </Fragment>
      ))}
    </p>
  );
}
