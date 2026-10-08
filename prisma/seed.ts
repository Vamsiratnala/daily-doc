import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CITIES } from "../src/lib/geo";
import { SPECIALTIES } from "../src/lib/specialties";
import { istAt, istDateString } from "../src/lib/slots";

const prisma = new PrismaClient();

// Deterministic pseudo-random so the demo data is stable between runs.
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

const FIRST = ["Ananya", "Rahul", "Priya", "Arjun", "Sneha", "Vikram", "Lakshmi", "Karthik", "Meera", "Sanjay", "Divya", "Ravi", "Kavya", "Suresh", "Padma", "Aditya", "Neha", "Venkat", "Shreya", "Imran", "Farah", "Harish", "Deepa", "Naveen", "Swathi", "Rohit", "Bhavana", "Kiran", "Pooja", "Srinivas"];
const LAST = ["Reddy", "Sharma", "Iyer", "Rao", "Nair", "Gupta", "Menon", "Patel", "Kulkarni", "Choudhary", "Varma", "Khan", "Pillai", "Joshi", "Naidu", "Desai"];
const AREAS: Record<string, string[]> = {
  Hyderabad: ["Banjara Hills", "Madhapur", "Kukatpally", "Gachibowli", "Ameerpet", "Dilsukhnagar", "Secunderabad", "Kondapur"],
  Bengaluru: ["Indiranagar", "Koramangala", "Jayanagar", "Whitefield", "HSR Layout", "Malleshwaram"],
  Chennai: ["T. Nagar", "Adyar", "Anna Nagar", "Velachery"],
  Mumbai: ["Andheri West", "Bandra", "Powai", "Dadar"],
  Delhi: ["Saket", "Dwarka", "Lajpat Nagar", "Rohini"],
  Pune: ["Kothrud", "Baner", "Viman Nagar"],
  Vijayawada: ["Benz Circle", "Governorpet", "Patamata"],
  Visakhapatnam: ["MVP Colony", "Dwaraka Nagar", "Gajuwaka"],
};
const QUALS: Record<string, string> = {
  "General Physician": "MBBS, MD (General Medicine)",
  Pediatrician: "MBBS, MD (Pediatrics)",
  Dermatologist: "MBBS, MD (Dermatology)",
  Cardiologist: "MBBS, MD, DM (Cardiology)",
  Orthopedic: "MBBS, MS (Orthopaedics)",
  Gynecologist: "MBBS, MS (Obstetrics & Gynaecology)",
  "ENT Specialist": "MBBS, MS (ENT)",
  Dentist: "BDS, MDS",
  Gastroenterologist: "MBBS, MD, DM (Gastroenterology)",
  Psychiatrist: "MBBS, MD (Psychiatry)",
  Ophthalmologist: "MBBS, MS (Ophthalmology)",
  Neurologist: "MBBS, MD, DM (Neurology)",
};
const COMMENTS = ["Very patient and explained everything clearly.", "Clinic was clean and the wait was short.", "Good doctor, felt better in two days.", "Listened carefully, didn't push unnecessary tests.", "Friendly staff, on time.", "Bit of a wait but worth it.", "Explained in Telugu which helped my parents.", "Highly recommend for kids.", "Reasonable fee and good advice."];

async function main() {
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  const patient = await prisma.user.create({
    data: { name: "Vamsi Demo", email: "patient@dailydoc.in", phone: "9876543210", passwordHash: hash, role: "PATIENT" },
  });
  const reviewers = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      prisma.user.create({ data: { name: `${pick(FIRST)} ${pick(LAST)}`, email: `reviewer${i}@example.com`, passwordHash: hash, role: "PATIENT" } }),
    ),
  );

  const weights = { Hyderabad: 4, Bengaluru: 2, Chennai: 1, Mumbai: 1, Delhi: 1, Pune: 1, Vijayawada: 1, Visakhapatnam: 1 } as Record<string, number>;
  const cityPool = CITIES.flatMap((c) => Array(weights[c.name]).fill(c));

  let n = 0;
  for (const spec of SPECIALTIES) {
    for (let i = 0; i < 5; i++) {
      const city = i < 2 ? CITIES[0] : pick(cityPool);
      const area = pick(AREAS[city.name]);
      const first = pick(FIRST);
      const last = pick(LAST);
      const isDemo = n === 0;
      const user = await prisma.user.create({
        data: {
          name: `Dr. ${first} ${last}`,
          email: isDemo ? "doctor@dailydoc.in" : `dr${n}@dailydoc.in`,
          phone: `9${String(800000000 + n * 7919).slice(0, 9)}`,
          passwordHash: hash,
          role: "DOCTOR",
        },
      });
      const doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          specialty: spec.name,
          qualifications: QUALS[spec.name],
          experienceYears: 3 + Math.floor(rand() * 25),
          clinicName: `${pick([last, area, first])} ${pick(["Clinic", "Health Centre", "Care", "Polyclinic", "Family Clinic"])}`,
          address: `${1 + Math.floor(rand() * 400)}, ${pick(["Main Road", "Cross Road", "1st Floor, Sai Complex", "Opp. Bus Stop", "Near Metro Station"])}, ${area}`,
          city: city.name,
          lat: city.lat + (rand() - 0.5) * 0.18,
          lng: city.lng + (rand() - 0.5) * 0.18,
          fee: pick([200, 300, 300, 400, 500, 500, 600, 700, 800, 1000]),
          bio: `${spec.blurb}. Running a small neighbourhood clinic in ${area} focused on unhurried consultations and clear explanations.`,
          languages: pick(["English, Hindi", "English, Telugu, Hindi", "English, Kannada", "English, Tamil", "English, Marathi, Hindi", "English, Telugu"]),
          conditions: spec.keywords.slice(0, 8).join(", "),
          slotMinutes: pick([10, 15, 15, 20]),
          availability: {
            create: [1, 2, 3, 4, 5, 6, ...(rand() > 0.6 ? [0] : [])].flatMap((dayOfWeek) => [
              { dayOfWeek, startTime: pick(["09:00", "10:00"]), endTime: "13:00" },
              ...(rand() > 0.3 ? [{ dayOfWeek, startTime: pick(["16:00", "17:00"]), endTime: pick(["20:00", "21:00"]) }] : []),
            ]),
          },
        },
      });

      // Past completed visits with reviews.
      const count = Math.floor(rand() * 9) + (rand() > 0.85 ? 0 : 2);
      const bias = 3.2 + rand() * 1.8;
      let sum = 0;
      for (let r = 0; r < count; r++) {
        const rating = Math.max(1, Math.min(5, Math.round(bias + (rand() - 0.5) * 1.6)));
        sum += rating;
        const appt = await prisma.appointment.create({
          data: {
            doctorId: doctor.id,
            patientId: reviewers[r % reviewers.length].id,
            startsAt: new Date(Date.now() - (r + 1) * 86400000 * (2 + rand() * 10)),
            problem: pick(spec.keywords),
            status: "COMPLETED",
          },
        });
        await prisma.review.create({
          data: { appointmentId: appt.id, doctorId: doctor.id, patientId: appt.patientId, createdAt: appt.startsAt, rating, comment: rand() > 0.3 ? pick(COMMENTS) : "" },
        });
      }
      await prisma.doctor.update({ where: { id: doctor.id }, data: { ratingAvg: count ? sum / count : 0, ratingCount: count } });

      if (isDemo) {
        // Give the demo doctor some upcoming bookings to show on the dashboard.
        for (const [days, time, status] of [[1, "10:30", "BOOKED"], [1, "11:00", "CONFIRMED"], [2, "18:00", "BOOKED"]] as const) {
          const at = istAt(istDateString(new Date(Date.now() + days * 86400000)), time);
          await prisma.appointment.create({ data: { doctorId: doctor.id, patientId: patient.id, startsAt: at, problem: "Fever and body pain for 3 days", status } });
        }
      }
      n++;
    }
  }
  console.log(`Seeded ${n} doctors. Logins: patient@dailydoc.in / doctor@dailydoc.in, password: password123`);
}

main().finally(() => prisma.$disconnect());
