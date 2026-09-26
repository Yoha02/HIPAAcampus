// Formatting runs through document.execCommand: it is deprecated but still the only
// browser API that edits contentEditable while keeping native undo/redo intact.

export type BlockType = "p" | "h1" | "h2" | "h3";

export type FormatState = {
  block: BlockType;
  bold: boolean;
  italic: boolean;
  bulletList: boolean;
};

export const EMPTY_FORMAT_STATE: FormatState = {
  block: "p",
  bold: false,
  italic: false,
  bulletList: false,
};

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "LI"]);
const BULLET_TRIGGERS = new Set(["-", "*"]);

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function setParagraphSeparator() {
  exec("defaultParagraphSeparator", "p");
}

export function setBlockType(type: BlockType) {
  exec("formatBlock", `<${type}>`);
}

export function toggleBold() {
  exec("bold");
}

export function toggleItalic() {
  exec("italic");
}

export function toggleBulletList(state: FormatState) {
  exec("insertUnorderedList");
  // Leaving a list, Blink drops the text inline in the editor root instead of in a paragraph.
  if (state.bulletList) setBlockType("p");
  else liftNestedLists();
}

/** Blink wraps new lists in the paragraph they replace (`<p><ul>…</ul></p>`), which is invalid HTML. */
function liftNestedLists() {
  const selection = window.getSelection();
  const anchor = selection?.anchorNode;
  const host = (anchor instanceof Element ? anchor : anchor?.parentElement)?.closest(
    "[contenteditable='true']",
  );
  if (!selection || !host) return;

  // Ranges are live and collapse when their nodes move, so keep the raw boundary points.
  const current = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const bounds = current && {
    start: [current.startContainer, current.startOffset] as const,
    end: [current.endContainer, current.endOffset] as const,
  };
  for (const wrapper of host.querySelectorAll(":is(p, div):has(> :is(ul, ol))")) {
    const onlyLists = Array.from(wrapper.childNodes).every(
      (child) =>
        child instanceof HTMLUListElement ||
        child instanceof HTMLOListElement ||
        !child.textContent?.trim(),
    );
    if (onlyLists) wrapper.replaceWith(...wrapper.childNodes);
  }

  if (bounds && bounds.start[0].isConnected && bounds.end[0].isConnected) {
    const range = document.createRange();
    range.setStart(...bounds.start);
    range.setEnd(...bounds.end);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function getFormatState(): FormatState {
  const raw = String(document.queryCommandValue("formatBlock") ?? "")
    .toLowerCase()
    .replace(/[<>]/g, "");
  const block: BlockType = raw === "h1" || raw === "h2" || raw === "h3" ? raw : "p";
  return {
    block,
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    bulletList: document.queryCommandState("insertUnorderedList"),
  };
}

/** True when there is nothing to show but an empty paragraph, so the placeholder can appear. */
export function isEditorEmpty(root: HTMLElement): boolean {
  return !root.textContent?.trim() && !root.querySelector("ul, ol, h1, h2, h3");
}

export function saveSelection(root: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return root.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

export function restoreSelection(root: HTMLElement, range: Range | null) {
  root.focus();
  if (!range) return;
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function closestBlock(node: Node, root: HTMLElement): HTMLElement {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current instanceof HTMLElement && BLOCK_TAGS.has(current.tagName)) return current;
    current = current.parentNode;
  }
  return root;
}

/** Turns "-" or "*" typed at the start of a paragraph into a bullet when space is pressed. */
export function applyBulletShortcut(root: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;

  const caret = selection.getRangeAt(0);
  const block = closestBlock(caret.startContainer, root);
  if (block !== root && block.tagName !== "P" && block.tagName !== "DIV") return false;

  const prefix = document.createRange();
  prefix.setStart(block, 0);
  prefix.setEnd(caret.startContainer, caret.startOffset);
  if (!BULLET_TRIGGERS.has(prefix.toString())) return false;

  selection.removeAllRanges();
  selection.addRange(prefix);
  exec("delete");
  toggleBulletList(getFormatState());
  return true;
}
