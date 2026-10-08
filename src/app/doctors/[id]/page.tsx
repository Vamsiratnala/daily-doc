import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateSlots, formatIST } from "@/lib/slots";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { BookingPanel } from "@/components/BookingPanel";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doctor, session] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
        availability: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        reviews: { include: { patient: true }, orderBy: { createdAt: "desc" }, take: 10 },
        appointments: { where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" } }, select: { startsAt: true } },
      },
    }),
    getSession(),
  ]);
  if (!doctor) notFound();

  const days = generateSlots(doctor.availability, doctor.slotMinutes, doctor.appointments.map((a) => a.startsAt), 7);
  const hours = DAYS.map((d, i) => ({ d, blocks: doctor.availability.filter((a) => a.dayOfWeek === i) }));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${doctor.lat},${doctor.lng}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex gap-5">
            <Avatar name={doctor.user.name} size={88} />
            <div>
              <h1 className="text-2xl font-extrabold">{doctor.user.name}</h1>
              <p className="text-ink/60">{doctor.specialty} · {doctor.qualifications}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1"><Stars value={doctor.ratingAvg} /> <b>{doctor.ratingCount ? doctor.ratingAvg.toFixed(1) : "New"}</b> <span className="text-ink/50">({doctor.ratingCount} reviews)</span></span>
                <span className="chip">{doctor.experienceYears} yrs experience</span>
                <span className="chip">🗣 {doctor.languages}</span>
              </div>
            </div>
          </div>
          {doctor.bio && <p className="mt-5 text-ink/75">{doctor.bio}</p>}
          {doctor.conditions && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Treats</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {doctor.conditions.split(",").map((c) => c.trim()).filter(Boolean).map((c) => <span key={c} className="rounded-full bg-black/5 px-2.5 py-1 text-xs">{c}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card p-6">
            <p className="font-bold">🏥 {doctor.clinicName}</p>
            <p className="mt-1 text-sm text-ink/65">{doctor.address}, {doctor.city}</p>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand-700">Open in Google Maps →</a>
            <p className="mt-4 text-sm">Consultation fee <b className="text-lg">₹{doctor.fee}</b> <span className="text-ink/50">(pay at clinic)</span></p>
          </div>
          <div className="card p-6">
            <p className="mb-2 font-bold">Clinic hours</p>
            <ul className="space-y-1 text-sm">
              {hours.map((h) => (
                <li key={h.d} className="flex justify-between">
                  <span className="text-ink/60">{h.d}</span>
                  <span>{h.blocks.length ? h.blocks.map((b) => `${b.startTime}–${b.endTime}`).join(", ") : <span className="text-ink/40">Closed</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <p className="font-bold">Patient reviews</p>
          {doctor.reviews.length === 0 && <p className="mt-2 text-sm text-ink/60">No reviews yet.</p>}
          <ul className="mt-3 divide-y divide-black/5">
            {doctor.reviews.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.patient.name.split(" ")[0]}</span>
                  <span className="text-xs text-ink/50">{formatIST(r.createdAt, { dateStyle: "medium" })}</span>
                </div>
                <Stars value={r.rating} />
                {r.comment && <p className="mt-1 text-sm text-ink/70">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <BookingPanel doctorId={doctor.id} fee={doctor.fee} days={days} signedInAs={session?.role ?? null} />
      </div>
    </div>
  );
}
