"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";
import { cityByName } from "@/lib/geo";
import { SPECIALTIES } from "@/lib/specialties";

export type FormState = { error?: string; ok?: string } | undefined;

const phone = z.string().regex(/^[+\d][\d\s-]{9,15}$/, "Enter a valid mobile number");

const PatientSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  phone,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerPatient(_: FormState, form: FormData): Promise<FormState> {
  const parsed = PatientSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email: email.toLowerCase() } })) return { error: "An account with this email already exists" };
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), phone: parsed.data.phone, passwordHash: await bcrypt.hash(password, 10), role: "PATIENT" },
  });
  await startSession({ userId: user.id, role: "PATIENT", name: user.name });
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

const DoctorSchema = PatientSchema.extend({
  specialty: z.enum(SPECIALTIES.map((s) => s.name) as [string, ...string[]]),
  qualifications: z.string().min(2, "Enter your qualifications"),
  experienceYears: z.coerce.number().int().min(0).max(70),
  clinicName: z.string().min(2, "Enter your clinic name"),
  address: z.string().min(5, "Enter the clinic address"),
  city: z.string().refine((c) => cityByName(c), "Choose a city"),
  fee: z.coerce.number().int().min(0).max(100000),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  conditions: z.string().optional(),
  languages: z.string().optional(),
  bio: z.string().optional(),
});

export async function registerDoctor(_: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => v !== ""));
  const parsed = DoctorSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } })) return { error: "An account with this email already exists" };
  const city = cityByName(d.city)!;
  const user = await prisma.user.create({
    data: {
      name: d.name.startsWith("Dr") ? d.name : `Dr. ${d.name}`,
      email: d.email.toLowerCase(),
      phone: d.phone,
      passwordHash: await bcrypt.hash(d.password, 10),
      role: "DOCTOR",
      doctor: {
        create: {
          specialty: d.specialty,
          qualifications: d.qualifications,
          experienceYears: d.experienceYears,
          clinicName: d.clinicName,
          address: d.address,
          city: city.name,
          // Use the clinic's GPS pin if given, otherwise the city centre.
          lat: d.lat ?? city.lat,
          lng: d.lng ?? city.lng,
          fee: d.fee,
          conditions: d.conditions ?? "",
          languages: d.languages ?? "English",
          bio: d.bio ?? "",
          // Sensible default hours: Mon-Sat 10:00-13:00 and 17:00-20:00.
          availability: {
            create: [1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
              { dayOfWeek, startTime: "10:00", endTime: "13:00" },
              { dayOfWeek, startTime: "17:00", endTime: "20:00" },
            ]),
          },
        },
      },
    },
  });
  await startSession({ userId: user.id, role: "DOCTOR", name: user.name });
  redirect("/doctor/dashboard?welcome=1");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Wrong email or password" };
  await startSession({ userId: user.id, role: user.role as "PATIENT" | "DOCTOR", name: user.name });
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") ? next : user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}
