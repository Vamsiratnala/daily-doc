export type City = { name: string; lat: number; lng: number };

// Launch cities (India). Patients without GPS pick one of these.
export const CITIES: City[] = [
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Vijayawada", lat: 16.5062, lng: 80.648 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
];

export function cityByName(name?: string | null) {
  return CITIES.find((c) => c.name.toLowerCase() === (name ?? "").toLowerCase());
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
