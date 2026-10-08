"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatIST } from "@/lib/slots";
import { sendWhatsApp } from "@/lib/whatsapp";
import type { FormState } from "./auth";

async function myDoctor() {
  const session = await requireSession("DOCTOR");
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.userId }, include: { user: true } });
  if (!doctor) throw new Error("Doctor profile missing");
  return doctor;
}

export async function setAppointmentStatus(form: FormData) {
  const doctor = await myDoctor();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (!["CONFIRMED", "COMPLETED"].includes(status)) return;
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { patient: true } });
  if (!appt || appt.doctorId !== doctor.id || appt.status === "CANCELLED") return;
  await prisma.appointment.update({ where: { id }, data: { status } });
  const when = formatIST(appt.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  if (status === "CONFIRMED") {
    await sendWhatsApp(appt.patient.phone, `👍 ${doctor.user.name} confirmed your appointment on ${when} at ${doctor.clinicName}, ${doctor.address}.`);
  } else {
    await sendWhatsApp(appt.patient.phone, `Thanks for visiting ${doctor.clinicName}. Please rate your visit with ${doctor.user.name} on DailyDoc, it helps other patients. 🙏`);
  }
  revalidatePath("/doctor/dashboard");
}

const time = z.string().regex(/^\d{2}:\d{2}$/);

export async function saveAvailability(_: FormState, form: FormData): Promise<FormState> {
  const doctor = await myDoctor();
  const rules: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
  for (let day = 0; day < 7; day++) {
    for (const block of [0, 1]) {
      if (form.get(`on-${day}-${block}`) !== "on") continue;
      const startTime = String(form.get(`start-${day}-${block}`));
      const endTime = String(form.get(`end-${day}-${block}`));
      if (!time.safeParse(startTime).success || !time.safeParse(endTime).success || startTime >= endTime) {
        return { error: "Each session needs a start time before its end time" };
      }
      rules.push({ dayOfWeek: day, startTime, endTime });
    }
  }
  const slotMinutes = z.coerce.number().int().min(5).max(120).safeParse(form.get("slotMinutes"));
  if (!slotMinutes.success) return { error: "Slot length must be between 5 and 120 minutes" };
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { doctorId: doctor.id } }),
    prisma.availability.createMany({ data: rules.map((r) => ({ ...r, doctorId: doctor.id })) }),
    prisma.doctor.update({ where: { id: doctor.id }, data: { slotMinutes: slotMinutes.data } }),
  ]);
  revalidatePath("/doctor/dashboard");
  return { ok: "Hours saved" };
}

const ProfileSchema = z.object({
  clinicName: z.string().min(2),
  address: z.string().min(5),
  fee: z.coerce.number().int().min(0).max(100000),
  qualifications: z.string().min(2),
  experienceYears: z.coerce.number().int().min(0).max(70),
  languages: z.string(),
  conditions: z.string(),
  bio: z.string().max(2000),
});

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const doctor = await myDoctor();
  const parsed = ProfileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: `Check ${parsed.error.issues[0].path.join(".")}` };
  await prisma.doctor.update({ where: { id: doctor.id }, data: parsed.data });
  revalidatePath("/doctor/dashboard");
  revalidatePath(`/doctors/${doctor.id}`);
  return { ok: "Profile saved" };
}
