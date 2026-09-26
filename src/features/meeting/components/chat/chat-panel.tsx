import { BottomSheet } from "@/components/shared/bottom-sheet";

import type { SessionChat } from "../../hooks/use-session-chat";
import type { Citation } from "../../types";
import { ChatComposer } from "./chat-composer";
import { ChatMessageBubble } from "./chat-message-bubble";
import { SuggestedQuestions } from "./suggested-questions";

type ChatPanelProps = {
  chat: SessionChat;
  suggestedQuestions: string[];
  activeCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onClose: () => void;
};

export function ChatPanel({
  chat,
  suggestedQuestions,
  activeCitation,
  onCitationClick,
  onClose,
}: ChatPanelProps) {
  return (
    <BottomSheet
      title="Ask about this session"
      subtitle="Grounded in permitted synthetic records and finalized speech"
      closeLabel="Close chat"
      onClose={onClose}
    >
      <div className="flex-1 space-y-4 overflow-y-auto py-5">
        {chat.messages.length === 0 ? (
          <SuggestedQuestions questions={suggestedQuestions} onSelect={chat.send} />
        ) : (
          chat.messages.map((message, index) => (
            <ChatMessageBubble
              key={`${message.role}-${index}`}
              message={message}
              activeCitation={activeCitation}
              onCitationClick={onCitationClick}
            />
          ))
        )}
        {chat.isSending && (
          <p className="text-sm text-muted-foreground">Checking permitted evidence…</p>
        )}
      </div>
      <ChatComposer
        value={chat.draft}
        onChange={chat.setDraft}
        onSend={() => void chat.send()}
        disabled={chat.isSending}
      />
    </BottomSheet>
  );
}
