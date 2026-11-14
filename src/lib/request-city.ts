// Server-side only: used by the root layout and the home page.
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import type { City } from '@/types/api';
import { CITY_STORAGE_KEY, DEFAULT_CITY, cityFromCookie } from '@/lib/city';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/** Approximate centres of cities the platform covers or plans to. */
const CITY_COORDS: Record<string, [lat: number, lon: number]> = {
  abeokuta: [7.1475, 3.3619],
  lagos: [6.5244, 3.3792],
  ibadan: [7.3775, 3.947],
  abuja: [9.0765, 7.3986],
  'port harcourt': [4.8156, 7.0498],
  kano: [12.0022, 8.592],
  'benin city': [6.335, 5.6037],
  enugu: [6.4584, 7.5464],
  ilorin: [8.4966, 4.5421],
  osogbo: [7.7827, 4.5418],
  akure: [7.2571, 5.2058],
  'ijebu ode': [6.8194, 3.9173],
};

/** Used when the backend's city list can't be loaded. */
const FALLBACK_ACTIVE = ['Abeokuta', 'Lagos'];

/** Names of cities that are live, from the backend (cached for an hour). */
async function getActiveCityNames(): Promise<string[]> {
  try {
    const res = await Promise.race([
      fetch(`${API_BASE_URL}/cities`, { next: { revalidate: 3600, tags: ['cities'] } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (!res || !res.ok) return FALLBACK_ACTIVE;
    const cities = (await res.json()) as City[];
    const active = Array.isArray(cities) ? cities.filter((c) => c.isActive).map((c) => c.name) : [];
    return active.length ? active : FALLBACK_ACTIVE;
  } catch {
    return FALLBACK_ACTIVE;
  }
}

function distanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * The visitor's approximate location from the hosting provider's IP lookup.
 * Vercel sends these headers on every request; elsewhere (and locally) they
 * are missing and detection is skipped.
 */
async function visitorLocation(): Promise<{ country?: string; coords?: [number, number] }> {
  const h = await headers();
  const country = h.get('x-vercel-ip-country')?.toUpperCase();
  const lat = parseFloat(h.get('x-vercel-ip-latitude') ?? '');
  const lon = parseFloat(h.get('x-vercel-ip-longitude') ?? '');
  return { country, coords: Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : undefined };
}

/**
 * The city to show for this request: the visitor's saved choice (cookie) if
 * they made one; otherwise, for visitors in Nigeria, the active city nearest
 * to their IP location; otherwise the default. Memoised per request so the
 * layout and the page agree.
 */
export const getRequestCity = cache(async (): Promise<string> => {
  const saved = (await cookies()).get(CITY_STORAGE_KEY)?.value;
  if (saved) return cityFromCookie(saved);

  const { country, coords } = await visitorLocation();
  if (country !== 'NG' || !coords) return DEFAULT_CITY;

  const candidates = (await getActiveCityNames())
    .map((name) => ({ name, at: CITY_COORDS[name.toLowerCase()] }))
    .filter((c): c is { name: string; at: [number, number] } => Boolean(c.at));
  if (!candidates.length) return DEFAULT_CITY;

  candidates.sort((a, b) => distanceKm(coords, a.at) - distanceKm(coords, b.at));
  return candidates[0].name;
});
