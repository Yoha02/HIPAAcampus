import { FileUp } from "lucide-react";
import { useState, type DragEvent, type FormEvent } from "react";

import { UnderlineTabs } from "@/components/shared/underline-tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { readFileText, sourceFromText } from "../../lib/source-from-text";
import type { SourceCategory, SourceDocument } from "../../types";
import { SourceCategoryPicker } from "./source-category-picker";
import { SourceConnectors } from "./source-connectors";

type Mode = "upload" | "paste" | "connectors";

const MODES: { value: Mode; label: string }[] = [
  { value: "upload", label: "Upload file" },
  { value: "paste", label: "Paste text" },
  { value: "connectors", label: "Connectors" },
];

type UploadedFile = { name: string; text: string | null };

type AddSourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (source: SourceDocument) => void;
};

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "");

export function AddSourceDialog({ open, onOpenChange, onAdd }: AddSourceDialogProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SourceCategory>("clinician-notes");
  const [pasted, setPasted] = useState("");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setMode("upload");
    setTitle("");
    setCategory("clinician-notes");
    setPasted("");
    setFile(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const takeFile = async (picked: File | undefined) => {
    if (!picked) return;
    setFile({ name: picked.name, text: await readFileText(picked) });
    setTitle((current) => current || stripExtension(picked.name));
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void takeFile(event.dataTransfer.files[0]);
  };

  const canAdd =
    (mode === "upload" && file !== null) || (mode === "paste" && pasted.trim().length > 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    const source =
      mode === "upload" && file
        ? sourceFromText({
            title: title.trim() || stripExtension(file.name),
            category,
            kind: "Uploaded file",
            text: file.text ?? `Preview isn't available for ${file.name} yet.`,
          })
        : sourceFromText({
            title: title.trim() || "Pasted text",
            category,
            kind: "Pasted text",
            text: pasted,
          });
    onAdd(source);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a source</DialogTitle>
          <DialogDescription>
            Sources you add appear in this record and can be cited in chat answers.
          </DialogDescription>
        </DialogHeader>

        <UnderlineTabs options={MODES} value={mode} onChange={setMode} />

        {mode === "connectors" ? (
          <SourceConnectors />
        ) : (
          <form id="add-source-form" onSubmit={submit} className="space-y-4">
            {mode === "upload" ? (
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center text-sm transition-colors",
                  isDragging ? "border-primary bg-accent/40" : "border-input hover:bg-muted/60",
                )}
              >
                <FileUp className="size-5 text-muted-foreground" />
                {file ? (
                  <span className="font-medium">{file.name}</span>
                ) : (
                  <span>
                    <span className="font-medium">Choose a file</span> or drag it here
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Text files show their full contents. Other files are listed by name.
                </span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(event) => void takeFile(event.target.files?.[0])}
                />
              </label>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="source-text">Text</Label>
                <Textarea
                  id="source-text"
                  value={pasted}
                  onChange={(event) => setPasted(event.target.value)}
                  placeholder="Paste a note, lab result, or reference excerpt"
                  className="min-h-32"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="source-title">Title</Label>
              <Input
                id="source-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. John Doe Visit Notes"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <SourceCategoryPicker value={category} onChange={setCategory} />
            </div>
          </form>
        )}

        {mode !== "connectors" && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-source-form" disabled={!canAdd}>
              Add source
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
