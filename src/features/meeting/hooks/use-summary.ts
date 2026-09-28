import { useRef, useState } from "react";

import { summarizeConsultation, type ConsultationContext } from "../lib/clinical-api";

export type SummaryStatus = "idle" | "generating" | "ready";
export type SummaryState = ReturnType<typeof useSummary>;

export function useSummary(getContext: () => ConsultationContext) {
  const [status, setStatus] = useState<SummaryStatus>("idle");
  const [bullets, setBullets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  const generate = async () => {
    if (pending.current) return;
    pending.current = true;
    setStatus("generating");
    setError(null);
    try {
      const result = await summarizeConsultation(getContext());
      setBullets(result.bullets);
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read the consultation.");
      setStatus("idle");
    } finally {
      pending.current = false;
    }
  };

  return { status, bullets, generate, error };
}
