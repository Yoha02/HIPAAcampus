import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { commandForKey, type NoteCommand } from "../lib/note-commands";
import {
  applyBulletShortcut,
  EMPTY_FORMAT_STATE,
  getFormatState,
  isEditorEmpty,
  restoreSelection,
  saveSelection,
  setParagraphSeparator,
  type FormatState,
} from "../lib/rich-text";

export function useRichTextEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [formatState, setFormatState] = useState<FormatState>(EMPTY_FORMAT_STATE);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => setParagraphSeparator(), []);

  const syncEmpty = () => {
    const editor = editorRef.current;
    if (editor) setIsEmpty(isEditorEmpty(editor));
  };

  const captureSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    savedRangeRef.current = saveSelection(editor);
    setFormatState(getFormatState());
  };

  const runCommand = (command: NoteCommand) => {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection(editor, savedRangeRef.current);
    command.run(getFormatState());
    savedRangeRef.current = saveSelection(editor);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current;
    if (!editor) return;

    const command = commandForKey(event);
    if (command) {
      event.preventDefault();
      command.run(getFormatState());
      return;
    }

    if (event.key === " " && !event.metaKey && !event.ctrlKey && applyBulletShortcut(editor)) {
      event.preventDefault();
    }
  };

  return {
    editorRef,
    formatState,
    isEmpty,
    captureSelection,
    runCommand,
    onKeyDown,
    onInput: syncEmpty,
  };
}
