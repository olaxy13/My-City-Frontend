import { getHomeData } from '@/lib/home-data';
import { getRequestCity } from '@/lib/request-city';
import HomePageClient from '@/components/home/HomePageClient';

/**
 * Home page. The server works out the visitor's city (their saved choice, or
 * the nearest active city to their IP location) and loads
 * that city's events, categories and listings from a cache refreshed every few
 * minutes, so the page usually arrives with real content. If the backend is
 * asleep, getHomeData gives up after a few seconds and the browser loads the
 * data instead, with the hero's intro card showing meanwhile.
 */
export default async function HomePage() {
  const city = await getRequestCity();
  const initialData = await getHomeData(city);

  return <HomePageClient initialData={initialData} />;
}
