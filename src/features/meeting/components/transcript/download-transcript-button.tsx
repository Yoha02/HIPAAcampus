import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toWebVtt } from "../../lib/transcript";
import type { TranscriptSegment } from "../../types";

type DownloadTranscriptButtonProps = {
  title: string;
  segments: TranscriptSegment[];
};

function toFileName(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "meeting"}-transcript.vtt`;
}

export function DownloadTranscriptButton({ title, segments }: DownloadTranscriptButtonProps) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([toWebVtt(segments)], { type: "text/vtt" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = toFileName(title);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={download}
      disabled={segments.length === 0}
      aria-label="Download transcript (.vtt)"
      title="Download transcript (.vtt)"
    >
      <Download />
    </Button>
  );
}
