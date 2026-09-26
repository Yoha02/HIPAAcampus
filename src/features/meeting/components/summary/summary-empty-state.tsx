import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type SummaryEmptyStateProps = {
  onGenerate: () => void;
};

export function SummaryEmptyState({ onGenerate }: SummaryEmptyStateProps) {
  return (
    <div className="border-y border-border py-10 text-center">
      <WandSparkles className="mx-auto mb-4 size-6 text-primary" />
      <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">
        Turn this conversation into a quick bulleted summary.
      </p>
      <Button onClick={onGenerate}>
        <WandSparkles /> Generate summary
      </Button>
    </div>
  );
}
