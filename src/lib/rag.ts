import "server-only";
import { FAQS } from "@/content/faqs";
import { SPECIALTIES } from "./specialties";
import { embed } from "./llm";

export type Chunk = { id: string; title: string; text: string };

function baseChunks(): Chunk[] {
  const faqs = FAQS.map((f) => ({ id: `faq:${f.id}`, title: f.q, text: `${f.q}\n${f.a}\n${f.tags ?? ""}` }));
  const services = SPECIALTIES.map((s) => ({
    id: `svc:${s.slug}`,
    title: s.name,
    text: `${s.name}: ${s.blurb}. Common problems: ${s.keywords.join(", ")}.`,
  }));
  return [...faqs, ...services];
}

const STOP = new Set(["the", "a", "an", "is", "are", "i", "my", "me", "do", "to", "of", "and", "or", "for", "in", "on", "can", "how", "what", "with", "have", "has", "it", "be", "you", "your", "does", "am", "at"]);
const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));

/** BM25 keyword retrieval, used when no embedding model is configured. */
function bm25(query: string, chunks: Chunk[], k: number) {
  const docs = chunks.map((c) => tokenize(c.text));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
  const q = tokenize(query);
  return chunks
    .map((c, i) => {
      let score = 0;
      for (const w of q) {
        const tf = docs[i].filter((x) => x === w || (w.length > 3 && x.startsWith(w))).length;
        if (!tf) continue;
        const idf = Math.log(1 + (docs.length - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
        score += (idf * tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (docs[i].length / avg)));
      }
      return { chunk: c, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

let vectorCache: { chunks: Chunk[]; vecs: number[][] } | null = null;

const cosine = (a: number[], b: number[]) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

export async function retrieve(query: string, extra: Chunk[] = [], k = 4) {
  const chunks = [...baseChunks(), ...extra];
  if (process.env.EMBED_MODEL && process.env.LLM_BASE_URL) {
    try {
      if (!vectorCache || vectorCache.chunks.length !== baseChunks().length) {
        const base = baseChunks();
        vectorCache = { chunks: base, vecs: await embed(base.map((c) => c.text)) };
      }
      const extraVecs = extra.length ? await embed(extra.map((c) => c.text)) : [];
      const [qv] = await embed([query]);
      const all = [...vectorCache.chunks, ...extra];
      const vecs = [...vectorCache.vecs, ...extraVecs];
      return all
        .map((chunk, i) => ({ chunk, score: cosine(qv, vecs[i]) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
    } catch (e) {
      console.warn("[rag] embeddings failed, falling back to BM25", e);
    }
  }
  return bm25(query, chunks, k);
}
