import { Menu, MoreHorizontal, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BrandMark } from "./brand-mark";
import { UserAvatar } from "./user-avatar";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-7">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu />
        </Button>
        <BrandMark />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More options">
          <MoreHorizontal />
        </Button>
        <UserAvatar initials="MN" />
      </div>
    </header>
  );
}
