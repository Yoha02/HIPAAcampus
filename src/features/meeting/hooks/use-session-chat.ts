import { useRef, useState } from "react";

import { askClinicalQuestion, type ConsultationContext } from "../lib/clinical-api";
import type { ChatMessage, ChatReply } from "../types";

export type SessionChat = ReturnType<typeof useSessionChat>;

export function useSessionChat(
  getContext: () => ConsultationContext,
  onReply: (reply: ChatReply) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const send = async (text = draft) => {
    const value = text.trim();
    if (!value || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setDraft("");
    try {
      const reply = await askClinicalQuestion(value, getContext());
      onReply(reply);
      setMessages((current) => [...current, { role: "user", text: value }, reply]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retrieve an answer.");
      setDraft((current) => current || value);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { messages, setMessages, draft, setDraft, send, pending, error };
}
