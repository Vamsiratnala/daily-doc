import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-7">
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        <p className="mb-6 text-sm text-ink/60">Sign in to book and manage appointments.</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
