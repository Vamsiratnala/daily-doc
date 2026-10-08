import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatIST } from "@/lib/slots";
import { cancelAppointment } from "@/app/actions/booking";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { ReviewForm } from "@/components/ReviewForm";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";

export default async function PatientDashboard({ searchParams }: { searchParams: Promise<{ booked?: string }> }) {
  const session = await requireSession("PATIENT");
  const { booked } = await searchParams;
  const appts = await prisma.appointment.findMany({
    where: { patientId: session.userId },
    include: { doctor: { include: { user: true } }, review: true },
    orderBy: { startsAt: "asc" },
  });
  const now = Date.now();
  const upcoming = appts.filter((a) => a.startsAt.getTime() >= now && a.status !== "CANCELLED" && a.status !== "COMPLETED");
  const past = appts.filter((a) => !upcoming.includes(a)).reverse();
  const justBooked = booked ? appts.find((a) => a.id === booked) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Hi, {session.name.split(" ")[0]} 👋</h1>
      <p className="text-ink/60">Your appointments</p>

      {justBooked && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="font-bold text-brand-800">✅ Booked! {justBooked.doctor.user.name}, {formatIST(justBooked.startsAt, { weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
          <p className="text-sm text-brand-900/70">We&apos;ve sent the details to your WhatsApp. Ref {justBooked.id.slice(-6).toUpperCase()}.</p>
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold">Upcoming</h2>
      {upcoming.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-ink/60">No upcoming visits.</p>
          <Link href="/search" className="btn-primary mt-4">Find a doctor</Link>
        </div>
      )}
      <div className="space-y-3">
        {upcoming.map((a) => (
          <div key={a.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="rounded-xl bg-brand-600 px-4 py-3 text-center text-white">
              <p className="text-xs uppercase">{formatIST(a.startsAt, { month: "short" })}</p>
              <p className="text-2xl font-extrabold leading-none">{formatIST(a.startsAt, { day: "numeric" })}</p>
              <p className="text-xs">{formatIST(a.startsAt, { hour: "numeric", minute: "2-digit" })}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/doctors/${a.doctorId}`} className="font-bold hover:text-brand-700">{a.doctor.user.name}</Link>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm text-ink/60">{a.doctor.specialty} · {a.doctor.clinicName}, {a.doctor.address}</p>
              <p className="text-sm text-ink/60">For: {a.problem} · ₹{a.doctor.fee} at clinic</p>
            </div>
            <form action={cancelAppointment}>
              <input type="hidden" name="id" value={a.id} />
              <button className="btn-outline text-red-600 hover:border-red-300 hover:text-red-700">Cancel</button>
            </form>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-bold">Past</h2>
          <div className="space-y-3">
            {past.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="flex items-center gap-4">
                  <Avatar name={a.doctor.user.name} size={44} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="font-semibold">{a.doctor.user.name}</span><StatusBadge status={a.status} /></div>
                    <p className="text-sm text-ink/60">{formatIST(a.startsAt)} · {a.problem}</p>
                  </div>
                  {a.review && <Stars value={a.review.rating} />}
                </div>
                {a.status === "COMPLETED" && !a.review && <ReviewForm appointmentId={a.id} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
