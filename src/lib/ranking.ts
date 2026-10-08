import { haversineKm } from "./geo";
import { matchSpecialties } from "./specialties";

export type RankableDoctor = {
  id: string;
  specialty: string;
  conditions: string;
  ratingAvg: number;
  ratingCount: number;
  lat: number;
  lng: number;
};

export type RankBreakdown = {
  match: number;
  rating: number;
  distance: number;
  distanceKm: number | null;
  total: number;
};

export const WEIGHTS = { match: 0.5, rating: 0.3, distance: 0.2 };

// Bayesian average so a single 5-star review does not beat 200 reviews at 4.7.
const PRIOR_MEAN = 4.0;
const PRIOR_COUNT = 5;

export function bayesianRating(avg: number, count: number) {
  return (PRIOR_MEAN * PRIOR_COUNT + avg * count) / (PRIOR_COUNT + count);
}

export function rankDoctors<T extends RankableDoctor>(
  doctors: T[],
  opts: { problem?: string; lat?: number; lng?: number; maxKm?: number },
): (T & { rank: RankBreakdown })[] {
  const problem = (opts.problem ?? "").trim();
  const specialtyMatch = problem ? matchSpecialties(problem) : new Map<string, number>();
  const words = problem.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const hasLoc = opts.lat !== undefined && opts.lng !== undefined;

  const ranked = doctors.map((d) => {
    // Problem match: specialty relevance plus a bonus for conditions the doctor lists.
    let match = 0;
    if (problem) {
      match = specialtyMatch.get(d.specialty) ?? 0;
      const conds = d.conditions.toLowerCase();
      const condHits = words.filter((w) => conds.includes(w)).length;
      match = Math.min(1, match + condHits * 0.15);
    } else {
      match = 0.5;
    }

    const rating = (bayesianRating(d.ratingAvg, d.ratingCount) - 1) / 4;

    let distanceKm: number | null = null;
    let distance = 0.5;
    if (hasLoc) {
      distanceKm = haversineKm(opts.lat!, opts.lng!, d.lat, d.lng);
      // Smooth decay: ~1 at 0 km, 0.5 at 5 km, ~0.17 at 25 km.
      distance = 1 / (1 + distanceKm / 5);
    }

    const total = WEIGHTS.match * match + WEIGHTS.rating * rating + WEIGHTS.distance * distance;
    return { ...d, rank: { match, rating, distance, distanceKm, total } };
  });

  return ranked
    .filter((d) => !problem || specialtyMatch.size === 0 || d.rank.match > 0)
    .filter((d) => !opts.maxKm || d.rank.distanceKm === null || d.rank.distanceKm <= opts.maxKm)
    .sort((a, b) => b.rank.total - a.rank.total);
}
