import { useState } from "react";

import { DEMO_ASSISTANT_REPLY } from "../data";
import type { ChatMessage } from "../types";

export type SessionChat = ReturnType<typeof useSessionChat>;

export function useSessionChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  const send = (text = draft) => {
    const value = text.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: value },
      { role: "assistant", sentences: DEMO_ASSISTANT_REPLY },
    ]);
    setDraft("");
  };

  return { messages, draft, setDraft, send };
}
