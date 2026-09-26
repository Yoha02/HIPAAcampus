import { useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { DEMO_MEETING, SUGGESTED_QUESTIONS } from "../data";
import { useDemoSession } from "../hooks/use-demo-session";
import { useRecorder } from "../hooks/use-recorder";
import { useSessionChat } from "../hooks/use-session-chat";
import { useSourcePanel } from "../hooks/use-source-panel";
import type { BottomPanel } from "../types";
import { ChatPanel } from "./chat/chat-panel";
import { BottomDock } from "./dock/bottom-dock";
import { MeetingHeader } from "./meeting-header";
import { NotesEditor } from "./notes/notes-editor";
import { SourcePanel } from "./sources/source-panel";
import { TranscriptPanel } from "./transcript/transcript-panel";

export function MeetingWorkspace() {
  const [panel, setPanel] = useState<BottomPanel>(null);
  const recorder = useRecorder();
  const demo = useDemoSession();
  const sources = useSourcePanel();
  const transcriptSegments = useMemo(
    () =>
      recorder.segments.map((segment, index) => ({
        id: `whisper-${Math.round(segment.start * 1000)}-${index}`,
        speaker: "conversation",
        start_ms: Math.round(segment.start * 1000),
        end_ms: Math.round(segment.end * 1000),
        text: segment.text,
        is_final: true,
      })),
    [recorder.segments],
  );
  const chat = useSessionChat({
    sessionId: demo.session?.session_id ?? null,
    notesText: demo.notesText,
    transcriptSegments,
    onAnswer: sources.setAnswer,
  });

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
              meeting={{
                ...DEMO_MEETING,
                title: demo.session?.summary.name
                  ? `${demo.session.summary.name} consultation`
                  : DEMO_MEETING.title,
              }}
              sourcesOpen={sources.isOpen}
              onToggleSources={sources.toggle}
              patients={demo.patients}
              selectedPatientId={demo.session?.patient_id ?? null}
              onSelectPatient={(patientId) => {
                chat.clear();
                sources.clear();
                void demo.selectPatient(patientId);
              }}
              consent={demo.consent}
              onConsentChange={(category, consented) => {
                chat.clear();
                void demo.setConsent(category, consented);
                sources.clear();
              }}
              onReset={() => {
                chat.clear();
                sources.clear();
                void demo.reset();
              }}
              disabled={demo.isLoading}
            />
            <div className="max-w-3xl">
              <div className="mb-5">
                <h2 className="font-display text-2xl">Current notes</h2>
                <p className="text-sm text-muted-foreground">
                  These clinician-authored notes are sent with each submitted question.
                </p>
              </div>
              <NotesEditor
                key={demo.session?.session_id ?? "loading"}
                value={demo.notesText}
                onChange={demo.updateNotes}
              />
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
