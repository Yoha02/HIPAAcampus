import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";

import { useRichTextEditor } from "../../hooks/use-rich-text-editor";
import { NotesFormatMenu } from "./notes-format-menu";

export function NotesEditor() {
  const { editorRef, formatState, isEmpty, captureSelection, runCommand, onKeyDown, onInput } =
    useRichTextEditor();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={onKeyDown}
          onInput={onInput}
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
