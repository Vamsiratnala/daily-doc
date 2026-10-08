"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useActionState, useState } from "react";
import { bookAppointment } from "@/app/actions/booking";
import type { SlotDay } from "@/lib/slots";

export function BookingPanel({ doctorId, fee, days, signedInAs }: { doctorId: string; fee: number; days: SlotDay[]; signedInAs: "PATIENT" | "DOCTOR" | null }) {
  const [state, action, pending] = useActionState(bookAppointment, undefined);
  const firstOpen = Math.max(0, days.findIndex((d) => d.slots.length));
  const [day, setDay] = useState(firstOpen);
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <form action={action} className="card p-5">
      <p className="text-lg font-bold">Book a visit</p>
      <p className="text-sm text-ink/60">₹{fee} · pay at clinic · WhatsApp confirmation</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {days.map((d, i) => (
          <button
            type="button"
            key={d.date}
            onClick={() => { setDay(i); setSlot(null); }}
            className={`shrink-0 rounded-xl border px-3 py-2 text-center text-xs transition ${i === day ? "border-brand-600 bg-brand-600 text-white" : "border-black/10 hover:border-brand-400"}`}
          >
            <span className="block font-semibold">{d.label}</span>
            <span className={i === day ? "text-white/80" : "text-ink/50"}>{d.slots.length} slots</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto">
        {days[day]?.slots.map((s) => (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            key={s.iso}
            data-slot
            onClick={() => setSlot(s.iso)}
            className={`rounded-lg border py-2 text-xs font-medium transition ${slot === s.iso ? "border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-500/30" : "border-black/10 hover:border-brand-400"}`}
          >
            {s.label}
          </motion.button>
        ))}
        {days[day]?.slots.length === 0 && <p className="col-span-3 py-6 text-center text-sm text-ink/50">No open slots this day.</p>}
      </div>

      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="startsAt" value={slot ?? ""} />
      <label className="label mt-4" htmlFor="problem">What&apos;s the problem?</label>
      <textarea id="problem" name="problem" rows={3} required minLength={3} className="input" placeholder="e.g. Fever and sore throat since 2 days" />

      {state?.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      {signedInAs === "DOCTOR" ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">You&apos;re signed in as a doctor. Use a patient account to book.</p>
      ) : signedInAs === null ? (
        <Link href={`/login?next=/doctors/${doctorId}`} className="btn-primary mt-4 w-full">Sign in to book</Link>
      ) : (
        <button className="btn-primary mt-4 w-full py-3" disabled={!slot || pending}>
          {pending ? "Booking…" : slot ? "Confirm booking" : "Pick a time slot"}
        </button>
      )}
    </form>
  );
}
