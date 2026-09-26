import { BrandMark } from "./brand-mark";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center border-b border-border px-4 sm:px-7">
      <BrandMark />
    </header>
  );
}
