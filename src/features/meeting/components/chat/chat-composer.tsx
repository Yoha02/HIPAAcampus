import { ArrowUp, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

function ModeMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden sm:flex">
          Focus <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Focus</DropdownMenuItem>
        <DropdownMenuItem>Quick</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatComposer({ value, onChange, onSend, disabled = false }: ChatComposerProps) {
  return (
    <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !disabled &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            onSend();
          }
        }}
        className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Ask about this session"
        autoFocus
      />
      <ModeMenu />
      <Button size="icon" onClick={onSend} aria-label="Send" disabled={disabled || !value.trim()}>
        <ArrowUp />
      </Button>
    </div>
  );
}
