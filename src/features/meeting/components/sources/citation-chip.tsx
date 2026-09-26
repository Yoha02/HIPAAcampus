import { cn } from "@/lib/utils";

type CitationChipProps = {
  number: number;
  sourceLabel: string;
  active: boolean;
  onClick: () => void;
};

export function CitationChip({ number, sourceLabel, active, onClick }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={sourceLabel}
      aria-label={`Source ${number}: ${sourceLabel}`}
      aria-pressed={active}
      className={cn(
        "mx-0.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full align-[0.1em] text-[0.68rem] font-semibold tabular-nums transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {number}
    </button>
  );
}
