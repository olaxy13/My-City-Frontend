// Server-side only: imported by the home page server component.
import type { Category, CountdownSliderItem, ListingDetail, PaginatedResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/** Cached responses are refreshed at most this often (seconds), per city. */
const REVALIDATE_SECONDS = 300;

/**
 * How long the page waits for the backend before giving up and letting the
 * browser load the data instead (the intro card shows meanwhile). The request
 * keeps running, so a slow, waking backend still fills the cache for the next
 * visitor.
 */
const WAIT_MS = 3500;

/** How many of the city's listings the home page needs (neighborhoods + Trending). */
export const CITY_LISTINGS_LIMIT = 100;

export interface HomeData {
  city: string;
  countdownItems: CountdownSliderItem[];
  categories: Category[];
  cityListings: ListingDetail[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS, tags: ['home'] },
  });
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return res.json() as Promise<T>;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

/**
 * Everything the home page shows for a city, from the server-side cache.
 * Returns null when the backend is unreachable or too slow; the page then
 * falls back to loading in the browser.
 */
export async function getHomeData(city: string): Promise<HomeData | null> {
  const q = encodeURIComponent(city);
  const all = Promise.all([
    getJson<CountdownSliderItem[]>(`/listings/upcoming-countdown?city=${q}&limit=8`),
    getJson<Category[]>('/categories'),
    getJson<PaginatedResponse<ListingDetail>>(`/listings?city=${q}&limit=${CITY_LISTINGS_LIMIT}`),
  ]);
  // Avoid an unhandled rejection if the request fails after the timeout wins
  all.catch(() => {});

  try {
    const result = await withTimeout(all, WAIT_MS);
    if (!result) return null;
    const [countdown, categories, listings] = result;
    return {
      city,
      countdownItems: Array.isArray(countdown) ? countdown : [],
      categories: Array.isArray(categories) ? categories : [],
      cityListings: Array.isArray(listings?.data) ? listings.data : [],
    };
  } catch {
    return null;
  }
}
