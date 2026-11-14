import { cookies } from 'next/headers';
import { CITY_STORAGE_KEY, cityFromCookie } from '@/lib/city';
import { getHomeData } from '@/lib/home-data';
import HomePageClient from '@/components/home/HomePageClient';

/**
 * Home page. The server reads the visitor's city from the cookie and loads
 * that city's events, categories and listings from a cache refreshed every few
 * minutes, so the page usually arrives with real content. If the backend is
 * asleep, getHomeData gives up after a few seconds and the browser loads the
 * data instead, with the hero's intro card showing meanwhile.
 */
export default async function HomePage() {
  const city = cityFromCookie((await cookies()).get(CITY_STORAGE_KEY)?.value);
  const initialData = await getHomeData(city);

  return <HomePageClient initialData={initialData} />;
}
