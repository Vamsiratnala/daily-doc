"use client";

const KEY = "dd_location";

export type SavedLocation = { lat: number; lng: number; label: string };

export function getSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: SavedLocation) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {}
}
