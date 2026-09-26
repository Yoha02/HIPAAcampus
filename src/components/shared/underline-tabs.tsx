import { cn } from "@/lib/utils";

type TabOption<T extends string> = {
  value: T;
  label: string;
};

type UnderlineTabsProps<T extends string> = {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: UnderlineTabsProps<T>) {
  return (
    <div role="tablist" className={cn("flex gap-7 border-b border-border", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          className={cn("tab-button", value === option.value && "tab-button-active")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
