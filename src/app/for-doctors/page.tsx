import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const POINTS = [
  { i: "🎯", t: "Matched, not just listed", d: "Patients describe their problem and we send them to doctors who treat it, nearby. No paying to rank higher." },
  { i: "📲", t: "Bookings on WhatsApp", d: "Every new booking and cancellation reaches you on WhatsApp. Patients get confirmations automatically, which cuts no-shows." },
  { i: "🗓", t: "Your hours, your slots", d: "Set morning and evening sessions per day and your slot length. Double bookings are impossible." },
  { i: "⭐", t: "Reviews that build trust", d: "Only patients who completed a visit can review, so your rating reflects real care." },
  { i: "🤖", t: "An assistant that answers for you", d: "Our chatbot answers fees, timings and booking questions on the site and on WhatsApp, around the clock." },
  { i: "₹0", t: "Free for small clinics", d: "No setup fee and no commission on consultations. Patients pay you directly at the clinic." },
];

export default function ForDoctors() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Reveal className="max-w-2xl">
        <span className="chip">For doctors and small clinics</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Grow your practice without a marketing budget.</h1>
        <p className="mt-4 text-lg text-ink/65">DailyDoc brings patients from your neighbourhood who need exactly what you treat.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/doctor/register" className="btn-primary px-6 py-3">List your clinic free</Link>
          <Link href="/login" className="btn-outline px-6 py-3">Doctor sign in</Link>
        </div>
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((p, i) => (
          <Reveal key={p.t} delay={i * 0.06}>
            <div className="card h-full p-6">
              <span className="text-2xl font-extrabold">{p.i}</span>
              <h3 className="mt-2 text-lg font-bold">{p.t}</h3>
              <p className="mt-1 text-sm text-ink/60">{p.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
