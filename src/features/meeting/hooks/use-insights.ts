import { useState } from "react";

import { demoApi, type ApiTranscriptSegment } from "../lib/demo-api";
import type { Insight } from "../types";

export type InsightsStatus = "idle" | "generating" | "ready";

export type InsightsState = ReturnType<typeof useInsights>;

type Options = {
  sessionId: string | null;
  notesText: string;
  transcriptSegments: ApiTranscriptSegment[];
};

export function useInsights({ sessionId, notesText, transcriptSegments }: Options) {
  const [status, setStatus] = useState<InsightsStatus>("idle");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transcriptSegmentCount, setTranscriptSegmentCount] = useState(0);

  const generate = async () => {
    if (status === "generating" || !sessionId) return;
    setStatus("generating");
    setError(null);
    try {
      const response = await demoApi.insights(sessionId, notesText, transcriptSegments);
      setInsights(response.insights);
      setTranscriptSegmentCount(response.transcript_segment_count);
      if (response.insights.length === 0) {
        setError("Add notes or record part of the conversation before generating insights.");
        setStatus("idle");
      } else {
        setStatus("ready");
      }
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : "Insight generation failed",
      );
      setStatus("idle");
    }
  };

  const clear = () => {
    setInsights([]);
    setError(null);
    setTranscriptSegmentCount(0);
    setStatus("idle");
  };

  return {
    status,
    insights,
    error,
    transcriptSegmentCount,
    generate,
    clear,
  };
}
