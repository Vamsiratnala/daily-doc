import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";

export async function Navbar() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1 text-sm">
          <Link href="/search" className="btn-ghost hidden sm:inline-flex">Find doctors</Link>
          {!session && <Link href="/for-doctors" className="btn-ghost hidden sm:inline-flex">For doctors</Link>}
          {session ? (
            <>
              <Link href={session.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard"} className="btn-ghost">
                {session.role === "DOCTOR" ? "Clinic dashboard" : "My appointments"}
              </Link>
              <form action={logout}>
                <button className="btn-outline">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Sign in</Link>
              <Link href="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
