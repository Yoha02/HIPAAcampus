import { cleanTranscript } from "./transcript-text";

const env =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

const WHISPER_SERVER_URL = env["WHISPER_SERVER_URL"] ?? "http://127.0.0.1:8178";

export type WhisperSegment = {
  start: number;
  end: number;
  text: string;
};

type VerboseJsonResponse = {
  segments?: Array<{ start?: number; end?: number; text?: string; no_speech_prob?: number }>;
  error?: string;
};

const MAX_NO_SPEECH_PROBABILITY = 0.6;

export class WhisperUnavailableError extends Error {}

export async function isWhisperReady(): Promise<boolean> {
  try {
    const response = await fetch(`${WHISPER_SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function transcribeAudio(audio: Blob): Promise<WhisperSegment[]> {
  const form = new FormData();
  form.append("file", audio, "chunk.wav");
  form.append("response_format", "verbose_json");
  form.append("no_timestamps", "false");
  form.append("temperature", "0.0");
  form.append("temperature_inc", "0.2");

  let response: Response;
  try {
    response = await fetch(`${WHISPER_SERVER_URL}/inference`, { method: "POST", body: form });
  } catch (cause) {
    throw new WhisperUnavailableError(`whisper-server is not reachable at ${WHISPER_SERVER_URL}`, {
      cause,
    });
  }

  const payload = (await response.json().catch(() => ({}))) as VerboseJsonResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? `whisper-server responded with ${response.status}`);
  }

  return (payload.segments ?? [])
    .filter((segment) => (segment.no_speech_prob ?? 0) <= MAX_NO_SPEECH_PROBABILITY)
    .map((segment) => ({
      start: segment.start ?? 0,
      end: segment.end ?? segment.start ?? 0,
      text: cleanTranscript(segment.text ?? ""),
    }))
    .filter((segment) => segment.text.length > 0);
}
