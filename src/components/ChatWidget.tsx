"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getSavedLocation } from "./location";

type Msg = {
  role: "user" | "assistant";
  content: string;
  doctors?: { id: string; name: string; specialty: string; clinicName: string; city: string; ratingAvg: number; fee: number }[];
  searchUrl?: string;
};

const SUGGESTIONS = ["My child has fever since 2 days", "How does ranking work?", "Can I cancel my booking?", "Toothache and bleeding gums"];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! 👋 I'm the DailyDoc assistant. Tell me what's bothering you and I'll suggest the right kind of doctor nearby, or ask me anything about booking." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const loc = getSavedLocation();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1).map(({ role, content }) => ({ role, content })), ...(loc ?? {}) }),
      });
      const data = await res.json();
      setMsgs([...next, { role: "assistant", content: data.text ?? "Sorry, something went wrong.", doctors: data.doctors, searchUrl: data.searchUrl }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "I couldn't reach the server. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-900/30"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={open ? "x" : "chat"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
            {open ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" strokeWidth={3} /></svg>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-5 py-4 text-white">
              <p className="font-bold">DailyDoc Assistant</p>
              <p className="text-xs text-white/75">Finds the right doctor. Doesn&apos;t diagnose.</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-brand-600 text-white" : "bg-[#f1f5f3] text-ink"}`}>
                    {m.content}
                  </div>
                  {m.doctors && m.doctors.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.doctors.map((d) => (
                        <Link key={d.id} href={`/doctors/${d.id}`} onClick={() => setOpen(false)} className="block rounded-xl border border-black/5 bg-white px-3 py-2 text-sm hover:border-brand-400">
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-xs text-ink/60">{d.specialty} · {d.clinicName}, {d.city} · ⭐ {d.ratingAvg.toFixed(1)} · ₹{d.fee}</p>
                        </Link>
                      ))}
                      {m.searchUrl && (
                        <Link href={m.searchUrl} onClick={() => setOpen(false)} className="block text-xs font-semibold text-brand-700">See all matching doctors →</Link>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              {busy && (
                <div className="flex gap-1 px-2 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-brand-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
              {msgs.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-800 hover:bg-brand-100">{s}</button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-black/5 p-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" className="input" />
              <button className="btn-primary px-3" disabled={busy || !input.trim()} aria-label="Send">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
