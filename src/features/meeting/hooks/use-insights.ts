import { useState } from "react";

import { demoApi, type ApiTranscriptSegment } from "../lib/demo-api";
import type { EvidenceSource, InsightBullet } from "../types";

export type InsightsStatus = "idle" | "generating" | "ready";

export type InsightsState = ReturnType<typeof useInsights>;

type Options = {
  sessionId: string | null;
  transcriptSegments: ApiTranscriptSegment[];
  onSources: (sources: EvidenceSource[]) => void;
};

export function useInsights({ sessionId, transcriptSegments, onSources }: Options) {
  const [status, setStatus] = useState<InsightsStatus>("idle");
  const [bullets, setBullets] = useState<InsightBullet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transcriptSegmentCount, setTranscriptSegmentCount] = useState(0);

  const generate = async () => {
    if (status === "generating" || !sessionId) return;
    setStatus("generating");
    setError(null);
    try {
      const response = await demoApi.insights(sessionId, transcriptSegments);
      setBullets(
        response.bullets.map((bullet) => ({
          text: bullet.text,
          citations: bullet.source_ids.map((sourceId) => ({
            sourceId,
            passageId: sourceId,
          })),
        })),
      );
      onSources(response.sources);
      setTranscriptSegmentCount(response.transcript_segment_count);
      if (response.bullets.length === 0) {
        setError("Record part of the conversation before generating insights.");
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
    setBullets([]);
    setError(null);
    setTranscriptSegmentCount(0);
    setStatus("idle");
  };

  return {
    status,
    bullets,
    error,
    transcriptSegmentCount,
    generate,
    clear,
  };
}
