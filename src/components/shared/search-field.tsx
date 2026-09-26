import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3",
        className,
      )}
    >
      <Search className="size-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
