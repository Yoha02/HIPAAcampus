export function TranscribingIndicator() {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-3 text-sm text-muted-foreground">
      <span />
      <span className="flex items-center gap-1">
        Transcribing
        <span className="flex gap-0.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-1 animate-pulse rounded-full bg-muted-foreground"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}
