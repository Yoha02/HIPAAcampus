import type { TimedText } from "../types";

const ENDPOINT = "/api/transcribe";

export async function isTranscriptionServerReady(): Promise<boolean> {
  try {
    const response = await fetch(ENDPOINT);
    const payload = (await response.json()) as { ready?: boolean };
    return payload.ready === true;
  } catch {
    return false;
  }
}

export async function transcribeChunk(wav: Blob): Promise<TimedText[]> {
  const form = new FormData();
  form.append("audio", wav, "chunk.wav");

  const response = await fetch(ENDPOINT, { method: "POST", body: form });
  const payload = (await response.json().catch(() => ({}))) as {
    segments?: TimedText[];
    error?: string;
  };
  if (!response.ok) throw new Error(payload.error ?? "Transcription request failed");
  return payload.segments ?? [];
}
