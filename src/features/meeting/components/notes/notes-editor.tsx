import { useEffect } from "react";

import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";

import { useRichTextEditor } from "../../hooks/use-rich-text-editor";
import { NotesFormatMenu } from "./notes-format-menu";

type NotesEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function NotesEditor({ value, onChange }: NotesEditorProps) {
  const { editorRef, formatState, isEmpty, captureSelection, runCommand, onKeyDown, onInput } =
    useRichTextEditor();

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerText !== value) {
      editor.innerText = value;
    }
  }, [editorRef, value]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={onKeyDown}
          onInput={(event) => {
            onInput();
            onChange(event.currentTarget.innerText);
          }}
          onContextMenu={captureSelection}
          data-empty={(isEmpty && !value.trim()) || undefined}
          data-placeholder="Type anything"
          className="note-editor min-h-[28rem] outline-none"
          aria-label="Meeting notes"
        />
      </ContextMenuTrigger>
      <NotesFormatMenu formatState={formatState} onCommand={runCommand} />
    </ContextMenu>
  );
}
