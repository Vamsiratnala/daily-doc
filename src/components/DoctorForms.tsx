"use client";

import { useActionState, useState } from "react";
import { saveAvailability, saveProfile } from "@/app/actions/doctor";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Rule = { dayOfWeek: number; startTime: string; endTime: string };

function Note({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">✓ {state.ok}</p>;
  return null;
}

export function AvailabilityForm({ rules, slotMinutes }: { rules: Rule[]; slotMinutes: number }) {
  const [state, action, pending] = useActionState(saveAvailability, undefined);
  const initial = DAYS.map((_, d) => {
    const r = rules.filter((x) => x.dayOfWeek === d);
    return [
      { on: Boolean(r[0]), start: r[0]?.startTime ?? "10:00", end: r[0]?.endTime ?? "13:00" },
      { on: Boolean(r[1]), start: r[1]?.startTime ?? "17:00", end: r[1]?.endTime ?? "20:00" },
    ];
  });
  const [grid, setGrid] = useState(initial);
  const toggle = (d: number, b: number) => setGrid((g) => g.map((row, i) => (i === d ? row.map((blk, j) => (j === b ? { ...blk, on: !blk.on } : blk)) : row)));

  return (
    <form action={action} className="space-y-4">
      <div className="divide-y divide-black/5">
        {DAYS.map((day, d) => (
          <div key={day} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
            <span className="w-28 font-medium">{day}</span>
            {[0, 1].map((b) => (
              <div key={b} className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${grid[d][b].on ? "border-brand-300 bg-brand-50/50" : "border-black/10 opacity-60"}`}>
                <input type="checkbox" name={`on-${d}-${b}`} checked={grid[d][b].on} onChange={() => toggle(d, b)} className="accent-brand-600" aria-label={`${day} ${b ? "evening" : "morning"}`} />
                <span className="w-16 text-xs text-ink/60">{b ? "Evening" : "Morning"}</span>
                <input type="time" name={`start-${d}-${b}`} defaultValue={grid[d][b].start} className="rounded-md bg-transparent text-sm" />
                <span>–</span>
                <input type="time" name={`end-${d}-${b}`} defaultValue={grid[d][b].end} className="rounded-md bg-transparent text-sm" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Slot length
          <select name="slotMinutes" defaultValue={slotMinutes} className="input ml-2 inline-block w-auto py-1.5">
            {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save hours"}</button>
      </div>
      <Note state={state} />
    </form>
  );
}

type Profile = { clinicName: string; address: string; fee: number; qualifications: string; experienceYears: number; languages: string; conditions: string; bio: string };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div><label className="label">Clinic name</label><input name="clinicName" defaultValue={profile.clinicName} className="input" /></div>
      <div><label className="label">Fee (₹)</label><input name="fee" type="number" defaultValue={profile.fee} className="input" /></div>
      <div className="sm:col-span-2"><label className="label">Address</label><input name="address" defaultValue={profile.address} className="input" /></div>
      <div><label className="label">Qualifications</label><input name="qualifications" defaultValue={profile.qualifications} className="input" /></div>
      <div><label className="label">Experience (years)</label><input name="experienceYears" type="number" defaultValue={profile.experienceYears} className="input" /></div>
      <div><label className="label">Languages</label><input name="languages" defaultValue={profile.languages} className="input" /></div>
      <div><label className="label">Conditions you treat</label><input name="conditions" defaultValue={profile.conditions} className="input" /></div>
      <div className="sm:col-span-2"><label className="label">Bio</label><textarea name="bio" rows={3} defaultValue={profile.bio} className="input" /></div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
        <Note state={state} />
      </div>
    </form>
  );
}
