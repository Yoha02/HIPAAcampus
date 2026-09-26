import { useState } from "react";

import { demoApi, type ApiTranscriptSegment, type ChatApiResponse } from "../lib/demo-api";
import type { ChatMessage } from "../types";

export type SessionChat = ReturnType<typeof useSessionChat>;

type Options = {
  sessionId: string | null;
  notesText: string;
  transcriptSegments: ApiTranscriptSegment[];
  onAnswer: (response: ChatApiResponse) => void;
};

export function useSessionChat({ sessionId, notesText, transcriptSegments, onAnswer }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (text = draft) => {
    const value = text.trim();
    if (!value || !sessionId || isSending) return;
    setMessages((current) => [...current, { role: "user", text: value }]);
    setDraft("");
    setError(null);
    setIsSending(true);
    try {
      const response = await demoApi.chat(sessionId, value, notesText, transcriptSegments);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          answer: response.answer,
          claims: response.claims.map((claim) => ({
            text: claim.text,
            citations: claim.source_ids.map((sourceId) => ({
              sourceId,
              passageId: sourceId,
            })),
          })),
          status: response.status,
          knowledgeStatus: response.knowledge_status,
          limitations: response.limitations,
        },
      ]);
      onAnswer(response);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "The answer request failed";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          answer: `I couldn't complete that request: ${message}`,
          claims: [],
          status: "failed",
          knowledgeStatus: "not_requested",
          limitations: [],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clear = () => {
    setMessages([]);
    setDraft("");
    setError(null);
  };

  return { messages, draft, setDraft, send, isSending, error, clear };
}
