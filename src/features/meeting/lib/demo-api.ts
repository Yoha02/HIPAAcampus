import type { ConsentState, EvidenceGraph, EvidenceSource, PatientOption } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { detail?: string };
  if (!response.ok) throw new Error(payload.detail ?? `Request failed (${response.status})`);
  return payload;
}

export type DemoSession = {
  session_id: string;
  patient_id: string;
  notes_text: string;
  summary: {
    patient_id: string;
    name: string;
    age: number;
    label: string;
    last_visit_date: string | null;
    conditions: { id: string; display: string; diagnosed_on: string }[];
    allergies: { id: string; display: string }[];
    synthetic: true;
  };
  synthetic: true;
};

export type ApiTranscriptSegment = {
  id: string;
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
  is_final: boolean;
};

export type ChatApiResponse = {
  answer_id: string;
  status: "completed" | "insufficient_evidence" | "failed";
  answer: string;
  claims: { id: string; text: string; source_ids: string[] }[];
  sources: EvidenceSource[];
  graph: EvidenceGraph;
  consent_version: number;
  knowledge_status: string;
  limitations: string[];
  task?: {
    task_id: string;
    text: string;
    due_date: string | null;
    completed: boolean;
    local_only: boolean;
  } | null;
};

export const demoApi = {
  async patients() {
    const payload = await request<{ patients: PatientOption[] }>("/demo/patients");
    return payload.patients;
  },
  async patientSources(patientId: string) {
    const payload = await request<{ sources: EvidenceSource[] }>(
      `/demo/patients/${patientId}/sources`,
    );
    return payload.sources;
  },
  createSession(patientId: string) {
    return request<DemoSession>("/sessions", {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId }),
    });
  },
  saveNotes(sessionId: string, notesText: string) {
    return request<{ saved: boolean }>(`/sessions/${sessionId}/notes`, {
      method: "PUT",
      body: JSON.stringify({ notes_text: notesText }),
    });
  },
  insights(sessionId: string, transcriptSegments: ApiTranscriptSegment[]) {
    return request<{
      bullets: { text: string; source_ids: string[] }[];
      sources: EvidenceSource[];
      transcript_segment_count: number;
      generated_at: string;
    }>(`/sessions/${sessionId}/insights`, {
      method: "POST",
      body: JSON.stringify({
        transcript_segments: transcriptSegments,
      }),
    });
  },
  chat(
    sessionId: string,
    question: string,
    notesText: string,
    transcriptSegments: ApiTranscriptSegment[],
  ) {
    return request<ChatApiResponse>(`/sessions/${sessionId}/chat`, {
      method: "POST",
      body: JSON.stringify({
        question,
        notes_text: notesText,
        transcript_segments: transcriptSegments,
      }),
    });
  },
  consent(patientId: string) {
    return request<ConsentState>(`/demo/patients/${patientId}/consent`);
  },
  setConsent(patientId: string, category: string, consented: boolean) {
    return request<ConsentState>(`/demo/patients/${patientId}/consent/${category}`, {
      method: "PUT",
      body: JSON.stringify({ consented }),
    });
  },
  reset(sessionId: string) {
    return request<{ reset: true; notes_text: string }>(`/sessions/${sessionId}/reset`, {
      method: "POST",
    });
  },
};
