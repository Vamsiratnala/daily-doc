import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatIST, istDateString } from "@/lib/slots";
import { cancelAppointment } from "@/app/actions/booking";
import { setAppointmentStatus } from "@/app/actions/doctor";
import { whatsappConfigured } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/StatusBadge";
import { Stars } from "@/components/Stars";
import { AvailabilityForm, ProfileForm } from "@/components/DoctorForms";

export const dynamic = "force-dynamic";

const TABS = [["appointments", "Appointments"], ["hours", "Clinic hours"], ["profile", "Profile"], ["reviews", "Reviews"]] as const;

export default async function DoctorDashboard({ searchParams }: { searchParams: Promise<{ tab?: string; welcome?: string }> }) {
  const session = await requireSession("DOCTOR");
  const { tab = "appointments", welcome } = await searchParams;
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.userId },
    include: {
      user: true,
      availability: true,
      appointments: { include: { patient: true }, orderBy: { startsAt: "asc" } },
      reviews: { include: { patient: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!doctor) return <p className="p-10">Doctor profile not found.</p>;

  const now = new Date();
  const today = istDateString(now);
  const active = doctor.appointments.filter((a) => a.status !== "CANCELLED");
  const upcoming = active.filter((a) => a.startsAt >= new Date(now.getTime() - 3 * 3600000) && a.status !== "COMPLETED");
  const todays = upcoming.filter((a) => istDateString(a.startsAt) === today);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const last30 = doctor.appointments.filter((a) => a.createdAt >= monthAgo);
  const completed30 = last30.filter((a) => a.status === "COMPLETED").length;

  const stats = [
    { label: "Today", value: todays.length, hint: "appointments" },
    { label: "Upcoming", value: upcoming.length, hint: "next 7 days" },
    { label: "Bookings (30d)", value: last30.length, hint: `${completed30} completed` },
    { label: "Rating", value: doctor.ratingCount ? doctor.ratingAvg.toFixed(1) : "–", hint: `${doctor.ratingCount} reviews` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {welcome && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="font-bold text-brand-800">🎉 Your clinic is live on DailyDoc.</p>
          <p className="text-sm text-brand-900/70">Patients can book you now. Check your clinic hours below, then share your profile link.</p>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{doctor.user.name}</h1>
          <p className="text-ink/60">{doctor.specialty} · {doctor.clinicName}, {doctor.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`chip ${whatsappConfigured() ? "" : "bg-amber-50 text-amber-800"}`}>
            WhatsApp alerts {whatsappConfigured() ? "on" : "in test mode"}
          </span>
          <Link href={`/doctors/${doctor.id}`} className="btn-outline">View public profile</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs text-ink/50">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-black/10">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-ink/50 hover:text-ink"}`}>{l}</Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "appointments" && (
          <div className="card overflow-hidden">
            {upcoming.length === 0 && <p className="p-8 text-center text-ink/60">No upcoming appointments yet.</p>}
            <ul className="divide-y divide-black/5">
              {upcoming.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="w-40">
                    <p className="font-semibold">{istDateString(a.startsAt) === today ? "Today" : formatIST(a.startsAt, { weekday: "short", day: "numeric", month: "short" })}</p>
                    <p className="text-sm text-ink/60">{formatIST(a.startsAt, { hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{a.patient.name} <StatusBadge status={a.status} /></p>
                    <p className="text-sm text-ink/60">{a.problem}{a.patient.phone && <> · 📞 {a.patient.phone}</>}</p>
                  </div>
                  <div className="flex gap-2">
                    {a.status === "BOOKED" && (
                      <form action={setAppointmentStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="CONFIRMED" /><button className="btn-primary py-2">Confirm</button></form>
                    )}
                    <form action={setAppointmentStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="COMPLETED" /><button className="btn-outline py-2">Mark done</button></form>
                    <form action={cancelAppointment}><input type="hidden" name="id" value={a.id} /><button className="btn-ghost py-2 text-red-600">Cancel</button></form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tab === "hours" && (
          <div className="card p-6">
            <p className="mb-2 text-sm text-ink/60">Patients can book any free slot inside these sessions, up to 7 days ahead. Times are IST.</p>
            <AvailabilityForm rules={doctor.availability} slotMinutes={doctor.slotMinutes} />
          </div>
        )}
        {tab === "profile" && (
          <div className="card p-6"><ProfileForm profile={doctor} /></div>
        )}
        {tab === "reviews" && (
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3"><Stars value={doctor.ratingAvg} size="lg" /><b className="text-xl">{doctor.ratingAvg.toFixed(1)}</b><span className="text-ink/50">from {doctor.ratingCount} reviews</span></div>
            <ul className="divide-y divide-black/5">
              {doctor.reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex justify-between text-sm"><b>{r.patient.name}</b><span className="text-ink/50">{formatIST(r.createdAt, { dateStyle: "medium" })}</span></div>
                  <Stars value={r.rating} />
                  {r.comment && <p className="text-sm text-ink/70">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
