"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES, cityByName } from "@/lib/geo";
import { getSavedLocation, saveLocation, type SavedLocation } from "./location";

export function SearchForm({ initialQuery = "", initialCity, size = "lg" }: { initialQuery?: string; initialCity?: string; size?: "lg" | "md" }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [loc, setLoc] = useState<SavedLocation | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const city = cityByName(initialCity);
    setLoc(city ? { lat: city.lat, lng: city.lng, label: city.name } : getSavedLocation() ?? { lat: CITIES[0].lat, lng: CITIES[0].lng, label: CITIES[0].name });
  }, [initialCity]);

  function locateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const l = { lat: p.coords.latitude, lng: p.coords.longitude, label: "Current location" };
        setLoc(l);
        saveLocation(l);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (loc) {
      saveLocation(loc);
      params.set("lat", loc.lat.toFixed(4));
      params.set("lng", loc.lng.toFixed(4));
      params.set("near", loc.label);
    }
    router.push(`/search?${params}`);
  }

  const big = size === "lg";
  return (
    <form onSubmit={submit} className={`card flex flex-col gap-2 p-2 sm:flex-row sm:items-center ${big ? "sm:p-2.5" : ""}`}>
      <div className="flex flex-1 items-center gap-2 px-3">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe your problem, e.g. knee pain, child fever, skin rash"
          className={`w-full bg-transparent outline-none placeholder:text-black/40 ${big ? "py-3 text-base" : "py-2 text-sm"}`}
        />
      </div>
      <div className="flex items-center gap-2 border-t border-black/5 px-2 pt-2 sm:border-l sm:border-t-0 sm:pt-0">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-coral" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg>
        <select
          value={loc?.label === "Current location" ? "__gps" : loc?.label ?? ""}
          onChange={(e) => {
            if (e.target.value === "__gps") return locateMe();
            const c = cityByName(e.target.value);
            if (c) setLoc({ lat: c.lat, lng: c.lng, label: c.name });
          }}
          className="bg-transparent py-2 text-sm font-medium outline-none"
          aria-label="Location"
        >
          <option value="__gps">{locating ? "Locating…" : "📍 Use my location"}</option>
          {CITIES.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button className={`btn-primary ${big ? "px-6 py-3" : ""}`}>Find doctors</button>
      </div>
    </form>
  );
}
