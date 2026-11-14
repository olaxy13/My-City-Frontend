'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCity } from '@/context/CityContext';
import { api } from '@/lib/api-client';
import type { HomeData } from '@/lib/home-data';
import HomeHero from './HomeHero';
import OrganizerBanner from './OrganizerBanner';
import FeaturedSection from './FeaturedSection';
import NeighborhoodSection from './NeighborhoodSection';

/** Kept in sync with CITY_LISTINGS_LIMIT in lib/home-data (that module is server-only). */
const CITY_LISTINGS_LIMIT = 100;

/** Browser fallback: used when the server had no data yet or the visitor switches city. */
async function loadInBrowser(city: string): Promise<HomeData> {
  const [countdown, categories, listings] = await Promise.all([
    api.getUpcomingCountdown(city, 8).catch(() => []),
    api.getCategories().catch(() => []),
    // One request serves both the neighborhood counts and the Trending grid
    api.getListings({ city, limit: CITY_LISTINGS_LIMIT }).catch(() => ({ data: [] })),
  ]);
  return {
    city,
    countdownItems: Array.isArray(countdown) ? countdown : [],
    categories: Array.isArray(categories) ? categories : [],
    cityListings: Array.isArray(listings?.data) ? listings.data : [],
  };
}

/** Up to five places with photos (featured first) for the hero when no events are coming up. */
function popularPlaces(listings: HomeData['cityListings']) {
  return listings
    .filter((l) => l.listingType !== 'event' && l.thumbnailUrl)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 5);
}

interface HomePageClientProps {
  /** Data the server already fetched (from its cache), or null if the backend was too slow. */
  initialData: HomeData | null;
}

/**
 * The home page. It renders straight from the server's data; it only fetches
 * in the browser when that data is missing or belongs to another city, and the
 * hero's intro card covers that wait.
 */
export default function HomePageClient({ initialData }: HomePageClientProps) {
  const { currentCity } = useCity();
  const [data, setData] = useState<HomeData | null>(initialData);
  const latest = useRef(0);

  const ready = data?.city === currentCity;

  useEffect(() => {
    if (data?.city === currentCity) return;
    const request = ++latest.current;
    loadInBrowser(currentCity)
      .then((result) => {
        if (request === latest.current) setData(result);
      })
      .catch((err) => console.error('Failed to load homepage data:', err));
  }, [currentCity, data?.city]);

  const shown = ready ? data : null;
  const isLoading = !ready;

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* 1. Hero: search, date shortcuts and the next events (intro card until they're ready) */}
      <HomeHero
        items={shown?.countdownItems ?? []}
        places={popularPlaces(shown?.cityListings ?? [])}
        isLoading={isLoading}
      />

      {/* 2. Busiest neighborhoods */}
      <NeighborhoodSection listings={shown?.cityListings ?? []} city={currentCity} isLoading={isLoading} />

      {/* 3. Trending grid, filtered by category chips (keyed so the filter resets per city) */}
      <FeaturedSection
        key={currentCity}
        listings={shown?.cityListings ?? []}
        categories={shown?.categories ?? []}
        city={currentCity}
        isLoading={isLoading}
      />

      {/* 4. The one section for organizers and businesses */}
      <OrganizerBanner city={currentCity} />
    </div>
  );
}
