type HighlightedTextProps = {
  text: string;
  query: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const term = query.trim();
  if (!term) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={index} className="rounded-sm bg-accent px-0.5 text-accent-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
