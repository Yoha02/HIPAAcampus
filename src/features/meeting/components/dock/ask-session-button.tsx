import { ChevronDown } from "lucide-react";

type AskSessionButtonProps = {
  onClick: () => void;
};

export function AskSessionButton({ onClick }: AskSessionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 flex-1 items-center justify-between rounded-xl border border-input bg-card px-5 text-left text-sm text-muted-foreground shadow-soft transition hover:border-primary/50"
    >
      <span>Ask about this session</span>
      <span className="hidden items-center gap-2 text-xs sm:flex">
        Open chat <ChevronDown className="size-4" />
      </span>
    </button>
  );
}
