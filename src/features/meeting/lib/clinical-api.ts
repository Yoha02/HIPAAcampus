import { z } from "zod";

import type { ChatReply, SourceDocument, TimedText } from "../types";

const citation = z.object({ sourceId: z.string(), passageId: z.string() });
const source: z.ZodType<SourceDocument> = z.object({
  id: z.string(),
  category: z.enum(["clinician-notes", "live-transcript", "ehr", "medical-reference"]),
  date: z.string(),
  patient: z.string().optional(),
  title: z.string(),
  kind: z.string(),
  author: z.string(),
  sections: z.array(
    z.object({
      heading: z.string().optional(),
      paragraphs: z.array(
        z.object({
          label: z.string().optional(),
          spans: z.array(z.union([z.string(), z.object({ id: z.string(), text: z.string() })])),
        }),
      ),
    }),
  ),
}) as z.ZodType<SourceDocument>;

const reply: z.ZodType<ChatReply> = z.object({
  id: z.string(),
  role: z.literal("assistant"),
  question: z.string(),
  sentences: z.array(z.object({ text: z.string(), citations: z.array(citation) })),
  sources: z.array(source),
  mode: z.literal("local-extractive"),
  graph: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(["answer", "source"]),
        label: z.string(),
        citations: z.array(citation),
      }),
    ),
    edges: z.array(
      z.object({ id: z.string(), source: z.string(), target: z.string(), label: z.string() }),
    ),
  }),
});

const bootstrapSchema = z.object({
  patient: z.object({ id: z.string(), name: z.string(), dateOfBirth: z.string() }),
  date: z.string(),
  sources: z.array(source),
  mode: z.literal("local-extractive"),
  messages: z.array(z.union([z.object({ role: z.literal("user"), text: z.string() }), reply])),
});

async function request<T>(path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
  const response = await fetch(`/api/clinical/${path}`, {
    ...(body !== undefined
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      typeof error?.error === "string" ? error.error : "The records request failed. Please retry.",
    );
  }
  const result = schema.safeParse(await response.json());
  if (!result.success) throw new Error("The records service returned an unsupported response.");
  return result.data;
}

export type ConsultationContext = { notes: string; transcript: TimedText[] };
export const loadClinicalSession = () => request("bootstrap", bootstrapSchema);
export const askClinicalQuestion = (question: string, context: ConsultationContext) =>
  request("chat", reply, { question, ...context });
export const saveSource = (document: SourceDocument) => request("sources", source, document);
export const summarizeConsultation = (context: ConsultationContext) =>
  request("summary", z.object({ bullets: z.array(z.string()) }), {
    question: "Summarize this consultation",
    ...context,
  });
