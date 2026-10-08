import "server-only";
import { prisma } from "./db";
import { chatComplete, llmConfigured, type ChatMessage } from "./llm";
import { retrieve, type Chunk } from "./rag";
import { matchSpecialties } from "./specialties";
import { rankDoctors } from "./ranking";

export type AssistantReply = {
  text: string;
  doctors: { id: string; name: string; specialty: string; clinicName: string; city: string; ratingAvg: number; fee: number }[];
  searchUrl?: string;
  sources: string[];
  mode: "llm" | "retrieval";
};

const EMERGENCY = /(chest pain.*(sweat|breath)|can'?t breathe|unconscious|heavy bleeding|stroke|suicid|heart attack|seizure now)/i;

const SYSTEM = `You are DailyDoc's assistant, helping patients in India find and book clinic doctors.
Rules:
- Answer ONLY using the CONTEXT below. If the answer is not there, say you are not sure and suggest contacting the clinic.
- Never diagnose or suggest medicines. You may suggest which type of specialist to see.
- For emergencies tell them to call 108 or 112 immediately.
- Be brief: at most 4 short sentences. Reply in the user's language if they write in Hindi or Telugu.`;

export async function answer(history: ChatMessage[], loc?: { lat: number; lng: number }): Promise<AssistantReply> {
  const question = history.filter((m) => m.role === "user").at(-1)?.content.trim() ?? "";
  if (EMERGENCY.test(question)) {
    return {
      text: "This could be an emergency. Please call 108 (ambulance) or 112 right now, or go to the nearest hospital emergency department. Don't wait for a clinic appointment.",
      doctors: [],
      sources: ["faq:emergency"],
      mode: "retrieval",
    };
  }

  // Symptom-aware doctor suggestions from live data.
  const specialties = [...matchSpecialties(question).entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  let doctors: AssistantReply["doctors"] = [];
  const extra: Chunk[] = [];
  if (specialties.length) {
    const rows = await prisma.doctor.findMany({ where: { specialty: { in: specialties.slice(0, 2) } }, include: { user: true } });
    doctors = rankDoctors(rows, { problem: question, ...loc })
      .slice(0, 3)
      .map((d) => ({ id: d.id, name: d.user.name, specialty: d.specialty, clinicName: d.clinicName, city: d.city, ratingAvg: d.ratingAvg, fee: d.fee }));
    extra.push(...doctors.map((d) => ({
      id: `doc:${d.id}`,
      title: d.name,
      text: `${d.name}, ${d.specialty} at ${d.clinicName}, ${d.city}. Rating ${d.ratingAvg.toFixed(1)}. Fee ₹${d.fee}.`,
    })));
  }

  const hits = await retrieve(question, extra, 4);
  const context = hits.map((h) => `[${h.chunk.title}] ${h.chunk.text}`).join("\n\n");
  const searchUrl = specialties.length ? `/search?q=${encodeURIComponent(question)}` : undefined;

  if (llmConfigured()) {
    try {
      const text = await chatComplete([
        { role: "system", content: `${SYSTEM}\n\nCONTEXT:\n${context || "(nothing relevant found)"}` },
        ...history.slice(-8),
      ]);
      if (text.trim()) return { text: text.trim(), doctors, searchUrl, sources: hits.map((h) => h.chunk.id), mode: "llm" };
    } catch (e) {
      console.warn("[assistant] model call failed, using retrieval answer", e);
    }
  }

  // Retrieval-only fallback: answer from the best FAQ, plus specialist suggestion.
  let text: string;
  if (specialties.length) {
    text = `From what you describe, a ${specialties[0]} is a good place to start${specialties[1] ? ` (or a ${specialties[1]})` : ""}. Here are top-rated doctors near you. I can't diagnose, so please consult the doctor.`;
  } else {
    const faq = hits.find((h) => h.chunk.id.startsWith("faq:"));
    text = faq
      ? faq.chunk.text.split("\n")[1]
      : "I can help you find the right doctor or answer questions about booking, fees, cancellations and WhatsApp updates. Try describing your problem, like \"my child has a fever\".";
  }
  return { text, doctors, searchUrl, sources: hits.map((h) => h.chunk.id), mode: "retrieval" };
}
