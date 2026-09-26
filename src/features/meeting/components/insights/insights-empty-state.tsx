import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";

type InsightsEmptyStateProps = {
  onGenerate: () => void;
};

export function InsightsEmptyState({ onGenerate }: InsightsEmptyStateProps) {
  return (
    <div className="border-y border-border py-10 text-center">
      <Lightbulb className="mx-auto mb-4 size-6 text-primary" />
      <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">
        Turn the live conversation into a concise bulleted summary.
      </p>
      <Button onClick={onGenerate}>
        <Lightbulb /> Generate insights
      </Button>
    </div>
  );
}
