import { useEffect, useRef, useState } from "react";

import { DEMO_INSIGHT_VERSIONS } from "../data";
import type { Insight } from "../types";

const DEMO_GENERATION_MS = 1800;

export type InsightsStatus = "idle" | "generating" | "ready";

export type InsightsState = ReturnType<typeof useInsights>;

export function useInsights() {
  const [status, setStatus] = useState<InsightsStatus>("idle");
  const [insights, setInsights] = useState<Insight[]>([]);
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const generate = () => {
    if (status === "generating") return;
    setStatus("generating");
    timerRef.current = setTimeout(() => {
      setInsights(DEMO_INSIGHT_VERSIONS[versionRef.current % DEMO_INSIGHT_VERSIONS.length] ?? []);
      versionRef.current += 1;
      setStatus("ready");
    }, DEMO_GENERATION_MS);
  };

  return { status, insights, generate };
}
