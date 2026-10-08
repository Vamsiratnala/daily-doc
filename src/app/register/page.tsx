import { PatientRegisterForm } from "@/components/AuthForms";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-7">
        <h1 className="text-2xl font-extrabold">Create your account</h1>
        <p className="mb-6 text-sm text-ink/60">Free for patients. Book in under a minute.</p>
        <PatientRegisterForm next={next} />
      </div>
    </div>
  );
}
