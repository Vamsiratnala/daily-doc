import { NextResponse } from "next/server";
import { answer } from "@/lib/assistant";
import { sendWhatsApp } from "@/lib/whatsapp";

// Meta webhook verification handshake.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Incoming WhatsApp messages are answered by the same assistant as the website.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
  for (const m of messages) {
    if (m.type !== "text") continue;
    const reply = await answer([{ role: "user", content: m.text.body }]);
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const links = reply.doctors.map((d) => `• ${d.name} (${d.specialty}, ${d.city}) ⭐${d.ratingAvg.toFixed(1)} ₹${d.fee}\n  ${base}/doctors/${d.id}`).join("\n");
    await sendWhatsApp(m.from, links ? `${reply.text}\n\n${links}` : reply.text);
  }
  return NextResponse.json({ ok: true });
}
