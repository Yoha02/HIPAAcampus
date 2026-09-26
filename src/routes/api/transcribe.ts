import { createFileRoute } from "@tanstack/react-router";

import { isWhisperReady, transcribeAudio, WhisperUnavailableError } from "@/lib/whisper.server";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      GET: async () => Response.json({ ready: await isWhisperReady() }),

      POST: async ({ request }) => {
        const form = await request.formData().catch(() => null);
        const audio = form?.get("audio");
        if (!(audio instanceof Blob) || audio.size === 0) {
          return Response.json({ error: "Missing audio upload" }, { status: 400 });
        }
        if (audio.size > MAX_UPLOAD_BYTES) {
          return Response.json({ error: "Audio chunk is too large" }, { status: 413 });
        }

        try {
          return Response.json({ segments: await transcribeAudio(audio) });
        } catch (error) {
          console.error(error);
          const unavailable = error instanceof WhisperUnavailableError;
          return Response.json(
            {
              error: unavailable
                ? "The local transcription server isn't running. Start it with `npm run whisper:server`."
                : "Transcription failed for this audio chunk.",
            },
            { status: unavailable ? 503 : 502 },
          );
        }
      },
    },
  },
});
