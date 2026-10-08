import Link from "next/link";
import { Avatar } from "./Avatar";
import { Stars } from "./Stars";
import { formatKm } from "@/lib/geo";
import type { RankBreakdown } from "@/lib/ranking";

type Props = {
  doctor: {
    id: string;
    specialty: string;
    qualifications: string;
    experienceYears: number;
    clinicName: string;
    address: string;
    city: string;
    fee: number;
    ratingAvg: number;
    ratingCount: number;
    languages: string;
    user: { name: string };
    rank?: RankBreakdown;
  };
  position?: number;
  nextSlot?: string | null;
};

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-ink/60">
      <span className="w-14">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
    </div>
  );
}

export function DoctorCard({ doctor: d, position, nextSlot }: Props) {
  return (
    <Link href={`/doctors/${d.id}`} className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 sm:flex-row">
      <div className="flex flex-1 gap-4">
        <div className="relative">
          <Avatar name={d.user.name} size={64} />
          {position === 1 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white shadow">Best match</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="text-lg font-bold group-hover:text-brand-700">{d.user.name}</h3>
            <span className="chip">{d.specialty}</span>
          </div>
          <p className="text-sm text-ink/60">{d.qualifications} · {d.experienceYears} yrs exp</p>
          <p className="mt-1 truncate text-sm text-ink/70">🏥 {d.clinicName}, {d.address}, {d.city}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-1">
              <Stars value={d.ratingAvg} />
              <b>{d.ratingCount ? d.ratingAvg.toFixed(1) : "New"}</b>
              <span className="text-ink/50">({d.ratingCount})</span>
            </span>
            {d.rank?.distanceKm != null && <span className="text-ink/70">📍 {formatKm(d.rank.distanceKm)}</span>}
            <span className="text-ink/70">🗣 {d.languages}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-black/5 pt-3 sm:w-52 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        {d.rank && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink/70">Match score <span className="text-brand-700">{Math.round(d.rank.total * 100)}</span></p>
            <Bar label="Problem" value={d.rank.match} color="bg-brand-500" />
            <Bar label="Rating" value={d.rank.rating} color="bg-amber-400" />
            <Bar label="Distance" value={d.rank.distance} color="bg-coral" />
          </div>
        )}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-extrabold">₹{d.fee}</p>
            {nextSlot !== undefined && <p className="text-xs text-brand-700">{nextSlot ? `Next: ${nextSlot}` : "No slots this week"}</p>}
          </div>
          <span className="btn-primary px-3 py-2 text-xs">Book</span>
        </div>
      </div>
    </Link>
  );
}
