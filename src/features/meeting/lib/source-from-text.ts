import type { SourceCategory, SourceDocument } from "../types";

type NewSource = {
  title: string;
  category: SourceCategory;
  kind: string;
  text: string;
};

function todayShort() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).slice(-2)}`;
}

/** Builds a source document from plain text, one paragraph per blank-line-separated block. */
export function sourceFromText({ title, category, kind, text }: NewSource): SourceDocument {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({ spans: [block] }));

  return {
    id: `added-${crypto.randomUUID()}`,
    category,
    date: todayShort(),
    title,
    kind,
    author: "Added by you",
    sections: [{ paragraphs }],
  };
}

const TEXT_EXTENSIONS = /\.(txt|md|markdown|csv|json|xml|html?|rtf)$/i;

export async function readFileText(file: File): Promise<string | null> {
  if (file.type.startsWith("text/") || TEXT_EXTENSIONS.test(file.name)) return file.text();
  return null;
}
