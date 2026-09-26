const NON_SPEECH_TAG = /\[[^\]]*\]|\([^)]*\)|\*[^*]*\*/g;

export function cleanTranscript(raw: string): string {
  return raw.replace(NON_SPEECH_TAG, " ").replace(/\s+/g, " ").trim();
}
