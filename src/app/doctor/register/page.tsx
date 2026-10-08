import { DoctorRegisterForm } from "@/components/AuthForms";

export default function DoctorRegisterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <span className="chip">For doctors</span>
      <h1 className="mt-3 text-3xl font-extrabold">List your clinic on DailyDoc</h1>
      <p className="mb-8 mt-1 text-ink/60">Takes about 3 minutes. Patients nearby can book you as soon as you finish.</p>
      <div className="card p-7"><DoctorRegisterForm /></div>
    </div>
  );
}
