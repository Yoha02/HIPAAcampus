import { Bold, Heading1, Heading2, Heading3, Italic, List, Pilcrow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  setBlockType,
  toggleBold,
  toggleBulletList,
  toggleItalic,
  type BlockType,
  type FormatState,
} from "./rich-text";

export type NoteCommand = {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut: string;
  group: "block" | "inline" | "list";
  isActive: (state: FormatState) => boolean;
  run: (state: FormatState) => void;
};

function headingCommand(
  type: Exclude<BlockType, "p">,
  label: string,
  icon: LucideIcon,
  key: string,
) {
  return {
    id: type,
    label,
    icon,
    shortcut: `⌥⌘${key}`,
    group: "block",
    isActive: (state) => state.block === type,
    run: (state) => setBlockType(state.block === type ? "p" : type),
  } satisfies NoteCommand;
}

export const NOTE_COMMANDS: NoteCommand[] = [
  headingCommand("h1", "Heading 1", Heading1, "1"),
  headingCommand("h2", "Heading 2", Heading2, "2"),
  headingCommand("h3", "Heading 3", Heading3, "3"),
  {
    id: "p",
    label: "Normal text",
    icon: Pilcrow,
    shortcut: "⌥⌘0",
    group: "block",
    isActive: (state) => state.block === "p" && !state.bulletList,
    run: () => setBlockType("p"),
  },
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    shortcut: "⌘B",
    group: "inline",
    isActive: (state) => state.bold,
    run: toggleBold,
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    shortcut: "⌘I",
    group: "inline",
    isActive: (state) => state.italic,
    run: toggleItalic,
  },
  {
    id: "bullets",
    label: "Bulleted list",
    icon: List,
    shortcut: "- space",
    group: "list",
    isActive: (state) => state.bulletList,
    run: toggleBulletList,
  },
];

const KEY_COMMANDS: Record<string, string> = {
  "mod+KeyB": "bold",
  "mod+KeyI": "italic",
  "mod+alt+Digit1": "h1",
  "mod+alt+Digit2": "h2",
  "mod+alt+Digit3": "h3",
  "mod+alt+Digit0": "p",
};

export function commandForKey(event: {
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  code: string;
}): NoteCommand | undefined {
  if (!(event.metaKey || event.ctrlKey) || event.shiftKey) return undefined;
  const id = KEY_COMMANDS[`mod+${event.altKey ? "alt+" : ""}${event.code}`];
  return NOTE_COMMANDS.find((command) => command.id === id);
}
