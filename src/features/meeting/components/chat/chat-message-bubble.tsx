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
  return `Evidence source ${citation.sourceId}`;
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

  const numbers = numberCitations(message.claims);
  const activeKey = activeCitation && citationKey(activeCitation);

  return (
    <div className="max-w-[86%] text-sm leading-7">
      <p className="whitespace-pre-wrap">{message.answer}</p>
      {message.claims.length > 0 && (
        <div className="mt-2 space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
          {message.claims.map((claim, index) => (
            <p key={index}>
              {claim.text}
              {claim.citations.map((citation) => (
                <CitationChip
                  key={citationKey(citation)}
                  number={numbers.get(citationKey(citation)) ?? 0}
                  sourceLabel={sourceLabel(citation)}
                  active={citationKey(citation) === activeKey}
                  onClick={() => onCitationClick(citation)}
                />
              ))}{" "}
            </p>
          ))}
        </div>
      )}
      {message.knowledgeStatus !== "not_requested" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Biomedical lookup: {message.knowledgeStatus}
        </p>
      )}
    </div>
  );
}
