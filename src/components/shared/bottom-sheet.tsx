import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
};

export function BottomSheet({
  title,
  subtitle,
  actions,
  closeLabel,
  onClose,
  className,
  children,
}: BottomSheetProps) {
  return (
    <section
      className={cn(
        "fixed bottom-0 left-0 right-[var(--sheet-right,0px)] z-20 h-[52vh] border-t border-border bg-card shadow-panel",
        className,
      )}
    >
      <div className="mx-auto flex h-full max-w-4xl flex-col px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">{title}</div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
              <X />
            </Button>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
