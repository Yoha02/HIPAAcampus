import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";

import { useRichTextEditor } from "../../hooks/use-rich-text-editor";
import { NotesFormatMenu } from "./notes-format-menu";
import { useEffect } from "react";

export function NotesEditor({ onTextChange }: { onTextChange: (text: string) => void }) {
  const { editorRef, formatState, isEmpty, captureSelection, runCommand, onKeyDown, onInput } =
    useRichTextEditor();

  useEffect(() => {
    const saved = localStorage.getItem("hippacampus:maria-notes");
    if (saved && editorRef.current) {
      // Store and restore text only; pasted HTML is never replayed as markup.
      editorRef.current.innerText = saved;
      onTextChange(saved);
      onInput();
    }
  }, [editorRef, onTextChange, onInput]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={onKeyDown}
          onInput={() => {
            onInput();
            const text = editorRef.current?.innerText ?? "";
            onTextChange(text);
            localStorage.setItem("hippacampus:maria-notes", text);
          }}
          onContextMenu={captureSelection}
          data-empty={isEmpty || undefined}
          data-placeholder="Type anything"
          className="note-editor min-h-[28rem] outline-none"
          aria-label="Meeting notes"
        >
          <p>
            <br />
          </p>
        </div>
      </ContextMenuTrigger>
      <NotesFormatMenu formatState={formatState} onCommand={runCommand} />
    </ContextMenu>
  );
}
