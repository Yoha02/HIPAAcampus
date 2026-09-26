import { useEffect, useRef, useState } from "react";

import { DEMO_SUMMARY_VERSIONS } from "../data";

const DEMO_GENERATION_MS = 1800;

export type SummaryStatus = "idle" | "generating" | "ready";

export type SummaryState = ReturnType<typeof useSummary>;

export function useSummary() {
  const [status, setStatus] = useState<SummaryStatus>("idle");
  const [bullets, setBullets] = useState<string[]>([]);
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const generate = () => {
    if (status === "generating") return;
    setStatus("generating");
    timerRef.current = setTimeout(() => {
      setBullets(DEMO_SUMMARY_VERSIONS[versionRef.current % DEMO_SUMMARY_VERSIONS.length] ?? []);
      versionRef.current += 1;
      setStatus("ready");
    }, DEMO_GENERATION_MS);
  };

  return { status, bullets, generate };
}
