import { CalendarDays, FolderPlus, PanelRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { MeetingDetails } from "../types";

type MeetingHeaderProps = {
  meeting: MeetingDetails;
  sourcesOpen: boolean;
  onToggleSources: () => void;
};

export function MeetingHeader({ meeting, sourcesOpen, onToggleSources }: MeetingHeaderProps) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {meeting.scheduledFor}
        </p>
        <h1 className="font-display text-4xl font-medium sm:text-5xl">{meeting.title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <FolderPlus /> Add to folder
        </Button>
        <Button variant="outline" onClick={onToggleSources} aria-pressed={sourcesOpen}>
          <PanelRight /> Sources
        </Button>
      </div>
    </div>
  );
}
