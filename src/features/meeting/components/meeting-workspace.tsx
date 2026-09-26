import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { UnderlineTabs } from "@/components/shared/underline-tabs";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { DEMO_MEETING, SUGGESTED_QUESTIONS } from "../data";
import { useSummary } from "../hooks/use-summary";
import { useRecorder } from "../hooks/use-recorder";
import { useSessionChat } from "../hooks/use-session-chat";
import { useSourcePanel } from "../hooks/use-source-panel";
import type { BottomPanel, WorkspaceView } from "../types";
import { ChatPanel } from "./chat/chat-panel";
import { BottomDock } from "./dock/bottom-dock";
import { SummaryPanel } from "./summary/summary-panel";
import { MeetingHeader } from "./meeting-header";
import { NotesEditor } from "./notes/notes-editor";
import { SourcePanel } from "./sources/source-panel";
import { TranscriptPanel } from "./transcript/transcript-panel";

const WORKSPACE_TABS: { value: WorkspaceView; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "summary", label: "Summary" },
];

export function MeetingWorkspace() {
  const [view, setView] = useState<WorkspaceView>("notes");
  const [panel, setPanel] = useState<BottomPanel>(null);
  const summary = useSummary();
  const recorder = useRecorder();
  const chat = useSessionChat();
  const sources = useSourcePanel();

  const closePanel = () => setPanel(null);
  const activeCitation =
    sources.isOpen && sources.tab === "record" && sources.focus?.passageId
      ? { sourceId: sources.focus.sourceId, passageId: sources.focus.passageId }
      : null;

  return (
    // From md up the source panel docks beside the page, so fixed sheets stop short of it.
    <main
      className={cn(
        "min-h-screen bg-background text-foreground [--source-panel-width:26rem]",
        sources.isOpen && "md:[--sheet-right:var(--source-panel-width)]",
      )}
    >
      <AppHeader />

      <div className="transition-[padding] duration-200 md:pr-[var(--sheet-right,0px)]">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-5 pb-36 pt-9 sm:px-10 lg:px-16">
          <section className="mx-auto w-full max-w-4xl">
            <MeetingHeader
              meeting={DEMO_MEETING}
              sourcesOpen={sources.isOpen}
              onToggleSources={sources.toggle}
            />
            <UnderlineTabs
              options={WORKSPACE_TABS}
              value={view}
              onChange={setView}
              className="mb-8"
            />
            <div className="max-w-3xl">
              {view === "notes" ? <NotesEditor /> : <SummaryPanel state={summary} />}
            </div>
          </section>
        </div>
      </div>

      {panel === "transcript" && (
        <TranscriptPanel meeting={DEMO_MEETING} recorder={recorder} onClose={closePanel} />
      )}

      {panel === "chat" && (
        <ChatPanel
          chat={chat}
          suggestedQuestions={SUGGESTED_QUESTIONS}
          activeCitation={activeCitation}
          onCitationClick={sources.showCitation}
          onClose={closePanel}
        />
      )}

      {panel === null && (
        <BottomDock
          recorder={recorder}
          onOpenTranscript={() => setPanel("transcript")}
          onOpenChat={() => setPanel("chat")}
        />
      )}

      {sources.isOpen && <SourcePanel panel={sources} />}

      <Toaster position="top-center" />
    </main>
  );
}
