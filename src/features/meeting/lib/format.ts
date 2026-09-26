export function formatElapsed(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function matchesSearch(text: string, search: string): boolean {
  const term = search.trim().toLowerCase();
  return !term || text.toLowerCase().includes(term);
}
