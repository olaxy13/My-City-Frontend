'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCity } from '@/context/CityContext';
import { api } from '@/lib/api-client';
import { Category, CountdownSliderItem, ListingDetail } from '@/types/api';
import HomeHero from '@/components/home/HomeHero';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import OrganizerBanner from '@/components/home/OrganizerBanner';
import FeaturedSection, { ROW_SIZE, type ListingRowsData } from '@/components/home/FeaturedSection';

export default function HomePage() {
  const { currentCity } = useCity();

  const [countdownItems, setCountdownItems] = useState<CountdownSliderItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listingRows, setListingRows] = useState<ListingRowsData>({ events: [], restaurants: [], facilities: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    async function loadHomeData() {
      try {
        // Local YYYY-MM-DD, so the events row only shows today onwards
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const HERO_EVENTS = 8;

        const listingsOfType = (type: string, extra: { startDate?: string; limit?: number } = {}) =>
          api
            .getListings({ city: currentCity, type, limit: ROW_SIZE, ...extra })
            .then((res) => (Array.isArray(res?.data) ? res.data : []))
            .catch((): ListingDetail[] => []);

        const [sliderRes, catsRes, events, restaurants, facilities] = await Promise.all([
          api.getUpcomingCountdown(currentCity, HERO_EVENTS).catch(() => []),
          api.getCategories().catch(() => []),
          // Over-fetch so the row still fills after removing the hero's events
          listingsOfType('event', { startDate: today, limit: ROW_SIZE + HERO_EVENTS }),
          listingsOfType('restaurant'),
          listingsOfType('facility'),
        ]);

        if (requestId !== requestIdRef.current) return;

        const heroEvents = Array.isArray(sliderRes) ? sliderRes : [];
        const inHero = new Set(heroEvents.map((e) => e.id));

        setCountdownItems(heroEvents);
        setCategories(Array.isArray(catsRes) ? catsRes : []);
        setListingRows({
          // The hero already shows these; the row only adds other upcoming events
          events: events.filter((e) => !inHero.has(e.id)).slice(0, ROW_SIZE),
          restaurants,
          facilities,
        });
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
      {/* 1. Search-first hero with the next upcoming events */}
      <HomeHero items={countdownItems} isLoading={isLoading} />

      {/* 2. Category chips */}
      <CategoryExplorer categories={categories} isLoading={isLoading} />

      {/* 3. Listings, one row per intent */}
      <FeaturedSection rows={listingRows} city={currentCity} isLoading={isLoading} />

      {/* 4. The one section for organizers and businesses */}
      <OrganizerBanner city={currentCity} />
    </div>
  );
}
