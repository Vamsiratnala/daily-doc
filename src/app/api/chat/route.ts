import { NextResponse } from "next/server";
import { z } from "zod";
import { answer } from "@/lib/assistant";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { messages, lat, lng } = parsed.data;
  const reply = await answer(messages, lat !== undefined && lng !== undefined ? { lat, lng } : undefined);
  return NextResponse.json(reply);
}
