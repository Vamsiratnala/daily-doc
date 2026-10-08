"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, requireSession } from "@/lib/auth";
import { formatIST, isValidSlot } from "@/lib/slots";
import { sendWhatsApp } from "@/lib/whatsapp";
import type { FormState } from "./auth";

const BookSchema = z.object({
  doctorId: z.string(),
  startsAt: z.string().datetime(),
  problem: z.string().min(3, "Briefly describe your problem").max(500),
});

export async function bookAppointment(_: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  const doctorId = String(form.get("doctorId"));
  if (!session) redirect(`/login?next=/doctors/${doctorId}`);
  if (session.role !== "PATIENT") return { error: "Please sign in with a patient account to book" };

  const parsed = BookSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt.getTime() < Date.now()) return { error: "That time has passed, pick another slot" };

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { availability: true, user: true } });
  if (!doctor) return { error: "Doctor not found" };
  if (!isValidSlot(doctor.availability, doctor.slotMinutes, startsAt)) return { error: "That slot is not available" };

  const clash = await prisma.appointment.findFirst({ where: { doctorId, startsAt, status: { not: "CANCELLED" } } });
  if (clash) return { error: "Someone just booked that slot. Please pick another." };

  const appt = await prisma.appointment.create({
    data: { doctorId, patientId: session.userId, startsAt, problem: parsed.data.problem },
    include: { patient: true },
  });

  const when = formatIST(startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  await Promise.all([
    sendWhatsApp(
      appt.patient.phone,
      `✅ DailyDoc booking received\n${doctor.user.name} (${doctor.specialty})\n${doctor.clinicName}, ${doctor.address}\n🗓 ${when}\nFee: ₹${doctor.fee}, pay at clinic.\nRef: ${appt.id.slice(-6).toUpperCase()}`,
    ),
    sendWhatsApp(doctor.user.phone, `🆕 New booking on DailyDoc\n${appt.patient.name}, ${when}\nProblem: ${parsed.data.problem}`),
  ]);

  revalidatePath(`/doctors/${doctorId}`);
  redirect(`/dashboard?booked=${appt.id}`);
}

export async function cancelAppointment(form: FormData) {
  const session = await requireSession();
  const id = String(form.get("id"));
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { doctor: { include: { user: true } }, patient: true } });
  if (!appt) return;
  const isPatient = appt.patientId === session.userId;
  const isDoctor = appt.doctor.userId === session.userId;
  if (!isPatient && !isDoctor) return;
  if (appt.status === "CANCELLED" || appt.status === "COMPLETED") return;
  await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } });
  const when = formatIST(appt.startsAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  if (isDoctor) await sendWhatsApp(appt.patient.phone, `❌ Your DailyDoc appointment with ${appt.doctor.user.name} on ${when} was cancelled by the clinic. Please book another slot.`);
  else await sendWhatsApp(appt.doctor.user.phone, `❌ ${appt.patient.name} cancelled their ${when} appointment.`);
  revalidatePath("/dashboard");
  revalidatePath("/doctor/dashboard");
}

const ReviewSchema = z.object({
  appointmentId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function submitReview(form: FormData) {
  const session = await requireSession("PATIENT");
  const parsed = ReviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const appt = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { review: true } });
  if (!appt || appt.patientId !== session.userId || appt.status !== "COMPLETED" || appt.review) return;
  await prisma.review.create({
    data: { appointmentId: appt.id, doctorId: appt.doctorId, patientId: session.userId, rating: parsed.data.rating, comment: parsed.data.comment ?? "" },
  });
  const agg = await prisma.review.aggregate({ where: { doctorId: appt.doctorId }, _avg: { rating: true }, _count: true });
  await prisma.doctor.update({ where: { id: appt.doctorId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
  revalidatePath("/dashboard");
}
