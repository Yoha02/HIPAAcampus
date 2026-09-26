import type { Insight } from "../../types";

type InsightRowProps = {
  insight: Insight;
};

export function InsightRow({ insight }: InsightRowProps) {
  return (
    <div className="grid gap-3 border-b border-border py-6 sm:grid-cols-[8rem_1fr]">
      <p className="insight-label">{insight.label}</p>
      <p className="leading-6">{insight.text}</p>
    </div>
  );
}
