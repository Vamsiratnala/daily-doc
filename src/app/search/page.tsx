import Link from "next/link";
import { prisma } from "@/lib/db";
import { rankDoctors } from "@/lib/ranking";
import { matchSpecialties, specialtyBySlug, SPECIALTIES } from "@/lib/specialties";
import { CITIES, cityByName } from "@/lib/geo";
import { generateSlots } from "@/lib/slots";
import { SearchForm } from "@/components/SearchForm";
import { DoctorCard } from "@/components/DoctorCard";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | undefined>>;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const spec = sp.specialty ? specialtyBySlug(sp.specialty) : undefined;
  const city = cityByName(sp.near);
  const lat = sp.lat ? Number(sp.lat) : city?.lat ?? CITIES[0].lat;
  const lng = sp.lng ? Number(sp.lng) : city?.lng ?? CITIES[0].lng;
  const near = sp.near ?? CITIES[0].name;
  const sort = sp.sort ?? "best";
  const maxKm = sp.within ? Number(sp.within) : undefined;

  const doctors = await prisma.doctor.findMany({
    where: spec ? { specialty: spec.name } : undefined,
    include: { user: true, availability: true, appointments: { where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" } }, select: { startsAt: true } } },
  });

  let ranked = rankDoctors(doctors, { problem: q || undefined, lat, lng, maxKm });
  if (sort === "rating") ranked = [...ranked].sort((a, b) => b.rank.rating - a.rank.rating);
  if (sort === "distance") ranked = [...ranked].sort((a, b) => (a.rank.distanceKm ?? 0) - (b.rank.distanceKm ?? 0));
  if (sort === "fee") ranked = [...ranked].sort((a, b) => a.fee - b.fee);
  const results = ranked.slice(0, 30);

  const detected = q ? [...matchSpecialties(q).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s) : [];

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/search?${p}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchForm initialQuery={q} size="md" />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="space-y-5 lg:w-60 lg:shrink-0">
          {detected.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">We think you need</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detected.map((s, i) => <span key={s} className={i === 0 ? "chip bg-brand-600 text-white" : "chip"}>{s}</span>)}
              </div>
            </div>
          )}
          <div className="card p-4 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Sort by</p>
            {[["best", "Best match"], ["rating", "Rating"], ["distance", "Distance"], ["fee", "Lowest fee"]].map(([k, l]) => (
              <Link key={k} href={link({ sort: k })} className={`block rounded-lg px-2 py-1.5 ${sort === k ? "bg-brand-50 font-semibold text-brand-800" : "hover:bg-black/5"}`}>{l}</Link>
            ))}
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">Distance</p>
            {[[undefined, "Any"], ["5", "Within 5 km"], ["10", "Within 10 km"], ["25", "Within 25 km"]].map(([k, l]) => (
              <Link key={l} href={link({ within: k })} className={`block rounded-lg px-2 py-1.5 ${sp.within === k ? "bg-brand-50 font-semibold text-brand-800" : "hover:bg-black/5"}`}>{l}</Link>
            ))}
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">Speciality</p>
            <Link href={link({ specialty: undefined })} className={`block rounded-lg px-2 py-1.5 ${!spec ? "bg-brand-50 font-semibold text-brand-800" : "hover:bg-black/5"}`}>All</Link>
            {SPECIALTIES.map((s) => (
              <Link key={s.slug} href={link({ specialty: s.slug })} className={`block rounded-lg px-2 py-1.5 ${spec?.slug === s.slug ? "bg-brand-50 font-semibold text-brand-800" : "hover:bg-black/5"}`}>{s.name}</Link>
            ))}
          </div>
        </aside>

        <section className="flex-1">
          <p className="mb-3 text-sm text-ink/60">
            <b className="text-ink">{ranked.length}</b> doctors{q && <> for &ldquo;{q}&rdquo;</>}{spec && <> in {spec.name}</>} near <b className="text-ink">{near}</b>
          </p>
          <div className="space-y-3">
            {results.map((d, i) => {
              const days = generateSlots(d.availability, d.slotMinutes, d.appointments.map((a) => a.startsAt), 7);
              const first = days.find((x) => x.slots.length);
              return <DoctorCard key={d.id} doctor={d} position={sort === "best" ? i + 1 : undefined} nextSlot={first ? `${first.label}, ${first.slots[0].label}` : null} />;
            })}
            {results.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-lg font-semibold">No doctors found</p>
                <p className="mt-1 text-sm text-ink/60">Try a wider distance or describe your problem differently.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
