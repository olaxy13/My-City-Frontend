'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCity } from '@/context/CityContext';
import { api } from '@/lib/api-client';
import { Category, CountdownSliderItem, ListingDetail } from '@/types/api';
import HomeHero from '@/components/home/HomeHero';
import OrganizerBanner from '@/components/home/OrganizerBanner';
import FeaturedSection from '@/components/home/FeaturedSection';
import NeighborhoodSection from '@/components/home/NeighborhoodSection';

const CITY_LISTINGS_LIMIT = 100;

export default function HomePage() {
  const { currentCity } = useCity();

  const [countdownItems, setCountdownItems] = useState<CountdownSliderItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cityListings, setCityListings] = useState<ListingDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    async function loadHomeData() {
      try {
        const [sliderRes, catsRes, listingsRes] = await Promise.all([
          api.getUpcomingCountdown(currentCity, 8).catch(() => []),
          api.getCategories().catch(() => []),
          // One request serves both the neighborhood counts and the Trending grid
          api.getListings({ city: currentCity, limit: CITY_LISTINGS_LIMIT }).catch(() => ({ data: [] })),
        ]);

        if (requestId !== requestIdRef.current) return;

        setCountdownItems(Array.isArray(sliderRes) ? sliderRes : []);
        setCategories(Array.isArray(catsRes) ? catsRes : []);
        setCityListings(Array.isArray(listingsRes?.data) ? listingsRes.data : []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData();
  }, [currentCity]);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* 1. Hero: search, date shortcuts and the next events */}
      <HomeHero items={countdownItems} isLoading={isLoading} />

      {/* 2. Busiest neighborhoods */}
      <NeighborhoodSection listings={cityListings} city={currentCity} isLoading={isLoading} />

      {/* 3. Trending grid, filtered by category chips (keyed so the filter resets per city) */}
      <FeaturedSection
        key={currentCity}
        listings={cityListings}
        categories={categories}
        city={currentCity}
        isLoading={isLoading}
      />

      {/* 4. The one section for organizers and businesses */}
      <OrganizerBanner city={currentCity} />
    </div>
  );
}
