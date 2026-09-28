import { createFileRoute } from "@tanstack/react-router";

async function forward(request: Request) {
  const path = new URL(request.url).pathname.replace("/api/clinical/", "");
  if (!["bootstrap", "chat", "sources", "summary"].includes(path)) {
    return Response.json({ error: "Unknown clinical route" }, { status: 404 });
  }
  try {
    const response = await fetch(
      `${process.env["CLINICAL_API_URL"] ?? "http://127.0.0.1:8000"}/${path}`,
      {
        method: request.method,
        headers: { "Content-Type": "application/json" },
        ...(request.method === "POST" ? { body: await request.text() } : {}),
        signal: AbortSignal.timeout(30_000),
      },
    );
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "The local records service is unavailable. Start the backend, then retry." },
      { status: 503 },
    );
  }
}

export const Route = createFileRoute("/api/clinical/$")({
  server: {
    handlers: {
      GET: ({ request }) => forward(request),
      POST: ({ request }) => forward(request),
    },
  },
});
