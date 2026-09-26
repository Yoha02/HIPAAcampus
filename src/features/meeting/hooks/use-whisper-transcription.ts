import { useEffect, useRef, useState } from "react";

import { startPcmCapture, type PcmCapture } from "../lib/pcm-capture";
import { isTranscriptionServerReady, transcribeChunk } from "../lib/transcription-api";
import { concatSamples, downsample, encodeWav, rootMeanSquare } from "../lib/wav";
import type { TimedText } from "../types";

const WHISPER_SAMPLE_RATE = 16_000;
const CHUNK_SECONDS = 5;
const SILENCE_RMS = 0.005;

type Options = {
  onError?: (message: string) => void;
};

export function useWhisperTranscription({ onError }: Options = {}) {
  const [segments, setSegments] = useState<TimedText[]>([]);
  const [pendingChunks, setPendingChunks] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const captureRef = useRef<PcmCapture | null>(null);
  const startingRef = useRef(false);
  const bufferRef = useRef<Float32Array[]>([]);
  const bufferedSamplesRef = useRef(0);
  const recordedSecondsRef = useRef(0);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => () => void captureRef.current?.stop(), []);

  const fail = (message: string) => {
    const capture = captureRef.current;
    captureRef.current = null;
    bufferRef.current = [];
    bufferedSamplesRef.current = 0;
    void capture?.stop();
    setError(message);
    onError?.(message);
  };

  const flush = (sampleRate: number) => {
    const chunks = bufferRef.current;
    bufferRef.current = [];
    bufferedSamplesRef.current = 0;
    if (chunks.length === 0) return;

    const samples = downsample(concatSamples(chunks), sampleRate, WHISPER_SAMPLE_RATE);
    const chunkStart = recordedSecondsRef.current;
    recordedSecondsRef.current += samples.length / WHISPER_SAMPLE_RATE;
    if (rootMeanSquare(samples) < SILENCE_RMS) return;
    const wav = encodeWav(samples, WHISPER_SAMPLE_RATE);

    setPendingChunks((count) => count + 1);
    queueRef.current = queueRef.current.then(async () => {
      try {
        const chunkSegments = await transcribeChunk(wav);
        if (chunkSegments.length === 0) return;
        setSegments((current) => [
          ...current,
          ...chunkSegments.map((segment) => ({
            start: chunkStart + segment.start,
            end: chunkStart + segment.end,
            text: segment.text,
          })),
        ]);
      } catch (chunkError) {
        fail(chunkError instanceof Error ? chunkError.message : "Transcription failed");
      } finally {
        setPendingChunks((count) => count - 1);
      }
    });
  };

  const start = async () => {
    if (captureRef.current || startingRef.current) return;
    startingRef.current = true;
    setError(null);
    try {
      if (!(await isTranscriptionServerReady())) {
        fail(
          "The local transcription server isn't running. Start it with `npm run whisper:server`.",
        );
        return;
      }
      captureRef.current = await startPcmCapture((samples, sampleRate) => {
        bufferRef.current.push(samples);
        bufferedSamplesRef.current += samples.length;
        if (bufferedSamplesRef.current >= sampleRate * CHUNK_SECONDS) flush(sampleRate);
      });
    } catch {
      fail("Microphone access was blocked. Allow it in your browser to record.");
    } finally {
      startingRef.current = false;
    }
  };

  const stop = async () => {
    const capture = captureRef.current;
    if (!capture) return;
    captureRef.current = null;
    await capture.stop();
    flush(capture.sampleRate);
  };

  return {
    segments,
    isTranscribing: pendingChunks > 0,
    error,
    start,
    stop,
  };
}
