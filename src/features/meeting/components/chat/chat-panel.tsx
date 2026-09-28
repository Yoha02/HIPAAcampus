import { BottomSheet } from "@/components/shared/bottom-sheet";

import type { SessionChat } from "../../hooks/use-session-chat";
import type { ChatReply, Citation } from "../../types";
import { useEffect, useRef } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageBubble } from "./chat-message-bubble";
import { SuggestedQuestions } from "./suggested-questions";

type ChatPanelProps = {
  chat: SessionChat;
  suggestedQuestions: string[];
  activeCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onClose: () => void;
  onShowGraph: (reply: ChatReply) => void;
  onSelectAnswer: (reply: ChatReply) => void;
  ready: boolean;
  processingSpeech: boolean;
};

export function ChatPanel({
  chat,
  suggestedQuestions,
  activeCitation,
  onCitationClick,
  onClose,
  onShowGraph,
  onSelectAnswer,
  ready,
  processingSpeech,
}: ChatPanelProps) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat.messages, chat.pending]);
  return (
    <BottomSheet
      title="Ask about this session"
      subtitle={
        processingSpeech
          ? "Recent speech is still processing · Using completed passages"
          : "Local source extraction · Synthetic demo patient"
      }
      closeLabel="Close chat"
      onClose={onClose}
    >
      <div className="flex-1 space-y-4 overflow-y-auto py-5">
        {chat.messages.length === 0 ? (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={(text) => {
              if (ready) void chat.send(text);
            }}
          />
        ) : (
          chat.messages.map((message, index) => (
            <ChatMessageBubble
              key={`${message.role}-${index}`}
              message={message}
              activeCitation={activeCitation}
              onCitationClick={onCitationClick}
              onShowGraph={onShowGraph}
              onSelectAnswer={onSelectAnswer}
            />
          ))
        )}
        {chat.pending && (
          <p role="status" className="text-sm text-muted-foreground">
            Finding supporting passages…
          </p>
        )}
        {chat.error && (
          <p role="alert" className="text-sm text-destructive">
            {chat.error}
          </p>
        )}
        {!ready && (
          <p role="status" className="text-sm text-muted-foreground">
            Waiting for the local records service.
          </p>
        )}
        <div ref={end} />
      </div>
      <ChatComposer
        value={chat.draft}
        onChange={chat.setDraft}
        onSend={() => void chat.send()}
        disabled={chat.pending || !ready}
      />
    </BottomSheet>
  );
}
