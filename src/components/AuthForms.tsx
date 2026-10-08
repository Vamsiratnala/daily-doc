"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, registerDoctor, registerPatient } from "@/app/actions/auth";
import { CITIES } from "@/lib/geo";
import { SPECIALTIES } from "@/lib/specialties";

function ErrorNote({ error }: { error?: string }) {
  return error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required className="input" /></div>
      <ErrorNote error={state?.error} />
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-ink/60">New here? <Link href={`/register${next ? `?next=${next}` : ""}`} className="font-semibold text-brand-700">Create a patient account</Link> or <Link href="/doctor/register" className="font-semibold text-brand-700">list your clinic</Link></p>
      <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">Demo: patient@dailydoc.in or doctor@dailydoc.in, password <b>password123</b></p>
    </form>
  );
}

export function PatientRegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerPatient, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required className="input" /></div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
      <div>
        <label className="label" htmlFor="phone">WhatsApp number</label>
        <input id="phone" name="phone" required className="input" placeholder="98765 43210" />
        <p className="mt-1 text-xs text-ink/50">Booking confirmations are sent here.</p>
      </div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} className="input" /></div>
      <ErrorNote error={state?.error} />
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
      <p className="text-center text-sm text-ink/60">Already have an account? <Link href="/login" className="font-semibold text-brand-700">Sign in</Link></p>
    </form>
  );
}

export function DoctorRegisterForm() {
  const [state, action, pending] = useActionState(registerDoctor, undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  function pin() {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => setLocating(false),
    );
  }

  return (
    <form action={action} className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">1. About you</legend>
        <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required className="input" placeholder="Dr. Ananya Reddy" /></div>
        <div>
          <label className="label" htmlFor="specialty">Speciality</label>
          <select id="specialty" name="specialty" required className="input">
            {SPECIALTIES.map((s) => <option key={s.slug}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="qualifications">Qualifications</label><input id="qualifications" name="qualifications" required className="input" placeholder="MBBS, MD (General Medicine)" /></div>
        <div><label className="label" htmlFor="experienceYears">Years of experience</label><input id="experienceYears" name="experienceYears" type="number" min={0} defaultValue={5} required className="input" /></div>
        <div><label className="label" htmlFor="languages">Languages spoken</label><input id="languages" name="languages" className="input" placeholder="English, Telugu, Hindi" /></div>
        <div><label className="label" htmlFor="conditions">Conditions you treat</label><input id="conditions" name="conditions" className="input" placeholder="diabetes, thyroid, fever" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bio">Short bio</label><textarea id="bio" name="bio" rows={3} className="input" /></div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">2. Your clinic</legend>
        <div><label className="label" htmlFor="clinicName">Clinic name</label><input id="clinicName" name="clinicName" required className="input" /></div>
        <div><label className="label" htmlFor="fee">Consultation fee (₹)</label><input id="fee" name="fee" type="number" min={0} defaultValue={400} required className="input" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="address">Address</label><input id="address" name="address" required className="input" placeholder="Plot 12, Road No. 3, Banjara Hills" /></div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <select id="city" name="city" required className="input">{CITIES.map((c) => <option key={c.name}>{c.name}</option>)}</select>
        </div>
        <div>
          <span className="label">Exact location</span>
          <button type="button" onClick={pin} className="btn-outline w-full">{coords ? `📍 Pinned (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : locating ? "Locating…" : "📍 Pin clinic location (at clinic)"}</button>
          {coords && <><input type="hidden" name="lat" value={coords.lat} /><input type="hidden" name="lng" value={coords.lng} /></>}
          <p className="mt-1 text-xs text-ink/50">Optional. Without it we use the city centre.</p>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">3. Account</legend>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="phone">WhatsApp number for bookings</label><input id="phone" name="phone" required className="input" placeholder="98765 43210" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} required className="input" /></div>
      </fieldset>

      <ErrorNote error={state?.error} />
      <button className="btn-primary w-full py-3 sm:w-auto sm:px-10" disabled={pending}>{pending ? "Creating your listing…" : "List my clinic for free"}</button>
      <p className="text-xs text-ink/50">We start you with Mon–Sat 10:00–13:00 and 17:00–20:00. You can change your hours in the dashboard.</p>
    </form>
  );
}
