import "server-only";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const base = () => (process.env.LLM_BASE_URL ?? "").replace(/\/$/, "");
const style = () => (process.env.LLM_API_STYLE ?? "ollama") as "ollama" | "openai";

/** The chatbot model is not fixed: endpoint and model both come from config. */
export function llmConfigured() {
  return Boolean(base() && process.env.LLM_MODEL);
}

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.LLM_API_KEY) h.Authorization = `Bearer ${process.env.LLM_API_KEY}`;
  return h;
}

/**
 * Model-agnostic provider. Works with Ollama's native API or any
 * OpenAI-compatible server (llama.cpp's llama-server, vLLM, hosted APIs).
 * Which model to run is decided purely by LLM_MODEL.
 */
export async function chatComplete(messages: ChatMessage[], timeoutMs = 30_000): Promise<string> {
  const model = process.env.LLM_MODEL;
  const signal = AbortSignal.timeout(timeoutMs);
  if (style() === "openai") {
    const res = await fetch(`${base()}/v1/chat/completions`, {
      method: "POST",
      headers: headers(),
      signal,
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 400 }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
  const res = await fetch(`${base()}/api/chat`, {
    method: "POST",
    headers: headers(),
    signal,
    body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.2, num_predict: 400 } }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message?.content ?? "";
}

export async function embed(texts: string[]): Promise<number[][]> {
  const model = process.env.EMBED_MODEL;
  if (style() === "openai") {
    const res = await fetch(`${base()}/v1/embeddings`, { method: "POST", headers: headers(), body: JSON.stringify({ model, input: texts }) });
    if (!res.ok) throw new Error(`embed ${res.status}`);
    const data = await res.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }
  const res = await fetch(`${base()}/api/embed`, { method: "POST", headers: headers(), body: JSON.stringify({ model, input: texts }) });
  if (!res.ok) throw new Error(`embed ${res.status}`);
  const data = await res.json();
  return data.embeddings;
}
