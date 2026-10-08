import Link from "next/link";
import { prisma } from "@/lib/db";
import { SPECIALTIES } from "@/lib/specialties";
import { SearchForm } from "@/components/SearchForm";
import { HeroTitle } from "@/components/HeroTitle";
import { Reveal } from "@/components/Reveal";
import { StatsBand } from "@/components/StatsBand";
import { DoctorCard } from "@/components/DoctorCard";
import { rankDoctors } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [doctorCount, cityRows, reviews, agg, all] = await Promise.all([
    prisma.doctor.count(),
    prisma.doctor.groupBy({ by: ["city"] }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.doctor.findMany({ include: { user: true } }),
  ]);
  const featured = rankDoctors(all, {}).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-200/50 blur-3xl" />
          <div className="absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-coral/15 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
          <span className="chip mb-5">🇮🇳 Trusted neighbourhood clinics across India</span>
          <HeroTitle />
          <p className="mt-5 max-w-2xl text-lg text-ink/65">
            Tell us what&apos;s wrong in your own words. DailyDoc ranks nearby doctors by how well they treat your problem, what patients say about them, and how far they are, then books you in seconds.
          </p>
          <Reveal delay={0.2} className="mt-8 max-w-4xl">
            <SearchForm />
          </Reveal>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink/60">
            Try:
            {["child has fever", "lower back pain", "acne and hair fall", "tooth pain", "can't sleep"].map((q) => (
              <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="rounded-full bg-white px-3 py-0.5 shadow-sm ring-1 ring-black/5 hover:ring-brand-300">{q}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">Browse by speciality</h2>
          <p className="mt-1 text-ink/60">Not sure? Just describe your problem above, or ask the assistant.</p>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SPECIALTIES.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.03}>
              <Link href={`/search?specialty=${s.slug}`} className="card flex h-full items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-300">
                <span className="text-2xl">{s.icon}</span>
                <span>
                  <span className="block font-semibold">{s.name}</span>
                  <span className="block text-xs text-ink/55">{s.blurb}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Reveal><h2 className="text-2xl font-bold sm:text-3xl">How DailyDoc picks your doctor</h2></Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { n: "50%", t: "Fits your problem", d: "We read your description and match it to the right speciality and the conditions each doctor treats.", c: "bg-brand-500" },
            { n: "30%", t: "Loved by patients", d: "Ratings come only from completed visits, adjusted so a single 5-star review can't game the list.", c: "bg-amber-400" },
            { n: "20%", t: "Close to you", d: "Use GPS or pick your city. Nearer clinics rank higher, so you don't cross the city for a cold.", c: "bg-coral" },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 0.1}>
              <div className="card h-full p-6">
                <span className={`inline-block rounded-lg px-2 py-1 text-sm font-extrabold text-white ${x.c}`}>{x.n}</span>
                <h3 className="mt-3 text-lg font-bold">{x.t}</h3>
                <p className="mt-1 text-sm text-ink/60">{x.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand-700 to-brand-900 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <StatsBand
            stats={[
              { value: doctorCount, suffix: "+", label: "Clinics listed" },
              { value: cityRows.length, label: "Cities" },
              { value: reviews, suffix: "+", label: "Verified reviews" },
              { value: agg._avg.rating ?? 0, decimals: 1, suffix: "★", label: "Average rating" },
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Reveal className="flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Top rated this week</h2>
          <Link href="/search" className="text-sm font-semibold text-brand-700">See all →</Link>
        </Reveal>
        <div className="mt-6 space-y-3">
          {featured.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.08}><DoctorCard doctor={{ ...d, rank: undefined }} /></Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <Reveal>
          <div className="card relative overflow-hidden p-8 sm:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-100 blur-2xl" />
            <div className="relative max-w-xl">
              <span className="chip">For doctors</span>
              <h2 className="mt-3 text-3xl font-extrabold">Run a small clinic? Fill your empty slots.</h2>
              <p className="mt-2 text-ink/65">List your clinic free, set your hours, and get matched with patients nearby who need exactly what you treat. Bookings land on WhatsApp.</p>
              <div className="mt-6 flex gap-3">
                <Link href="/doctor/register" className="btn-primary">List your clinic</Link>
                <Link href="/for-doctors" className="btn-outline">Learn more</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
