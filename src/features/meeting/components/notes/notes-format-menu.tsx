import { Fragment } from "react";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

import { NOTE_COMMANDS, type NoteCommand } from "../../lib/note-commands";
import type { FormatState } from "../../lib/rich-text";

type NotesFormatMenuProps = {
  formatState: FormatState;
  onCommand: (command: NoteCommand) => void;
};

export function NotesFormatMenu({ formatState, onCommand }: NotesFormatMenuProps) {
  return (
    <ContextMenuContent className="w-56" onCloseAutoFocus={(event) => event.preventDefault()}>
      <ContextMenuLabel className="text-xs font-medium text-muted-foreground">
        Format
      </ContextMenuLabel>
      {NOTE_COMMANDS.map((command, index) => {
        const Icon = command.icon;
        const active = command.isActive(formatState);
        const startsGroup = index > 0 && NOTE_COMMANDS[index - 1]?.group !== command.group;
        return (
          <Fragment key={command.id}>
            {startsGroup && <ContextMenuSeparator />}
            <ContextMenuItem
              onSelect={() => onCommand(command)}
              className={cn("gap-2", active && "bg-accent/60 font-medium text-accent-foreground")}
            >
              <Icon className="size-4" />
              {command.label}
              <ContextMenuShortcut>{command.shortcut}</ContextMenuShortcut>
            </ContextMenuItem>
          </Fragment>
        );
      })}
    </ContextMenuContent>
  );
}
