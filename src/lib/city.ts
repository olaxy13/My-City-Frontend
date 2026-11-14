/** Shared by the browser (localStorage + cookie) and the server (cookie). */
export const CITY_STORAGE_KEY = 'city_discovery_selected_city';
export const DEFAULT_CITY = 'Abeokuta';

/** Reads the city cookie value sent with a request, falling back to the default. */
export function cityFromCookie(value: string | undefined): string {
  if (!value) return DEFAULT_CITY;
  try {
    return decodeURIComponent(value) || DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
}

/** Mirrors the chosen city into a cookie so the server can render that city's data. */
export function writeCityCookie(city: string) {
  try {
    document.cookie = `${CITY_STORAGE_KEY}=${encodeURIComponent(city)}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookies unavailable — the browser will fetch the data itself
  }
}
