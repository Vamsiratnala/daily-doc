import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-ink/60">Neighbourhood clinics, matched to your problem. Built for patients and small clinics across India.</p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Patients</p>
          <ul className="space-y-1.5 text-ink/60">
            <li><Link href="/search">Find a doctor</Link></li>
            <li><Link href="/dashboard">My appointments</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Clinics</p>
          <ul className="space-y-1.5 text-ink/60">
            <li><Link href="/for-doctors">Why DailyDoc</Link></li>
            <li><Link href="/doctor/register">List your clinic</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-black/5 py-4 text-center text-xs text-ink/50">
        In an emergency call 108 or 112. DailyDoc does not provide medical advice.
      </p>
    </footer>
  );
}
