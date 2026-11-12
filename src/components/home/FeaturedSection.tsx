'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Category, ListingDetail } from '@/types/api';
import { api } from '@/lib/api-client';
import { CATEGORY_CONFIG } from '@/lib/utils';
import ListingCard from '../listings/ListingCard';
import CategoryExplorer from './CategoryExplorer';
import { EmptyStateFrame, ListingGridSkeleton } from '@/components/ui/Skeletons';
import { ArrowRight } from 'lucide-react';

/** Cards shown in the grid; Explore has the rest. */
export const GRID_SIZE = 9;

interface FeaturedSectionProps {
  listings: ListingDetail[];
  categories: Category[];
  city: string;
  isLoading?: boolean;
}

/**
 * "Trending in {city}": one grid of listings with category chips above it.
 * "All" shows the home page's listings; a category loads that category's.
 */
export default function FeaturedSection({ listings = [], categories, city, isLoading = false }: FeaturedSectionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filtered, setFiltered] = useState<ListingDetail[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const cache = useRef(new Map<string, ListingDetail[]>());
  const latest = useRef(0);

  const select = async (slug: string | null) => {
    setSelected(slug);
    if (!slug) return;

    const cached = cache.current.get(slug);
    if (cached) {
      setFiltered(cached);
      return;
    }

    const request = ++latest.current;
    setIsFiltering(true);
    try {
      const res = await api.getListings({ city, category: slug, limit: GRID_SIZE });
      const data = Array.isArray(res?.data) ? res.data : [];
      cache.current.set(slug, data);
      if (request === latest.current) setFiltered(data);
    } catch {
      if (request === latest.current) setFiltered([]);
    } finally {
      if (request === latest.current) setIsFiltering(false);
    }
  };

  const shown = (selected ? filtered : listings).slice(0, GRID_SIZE);
  const selectedLabel = selected ? CATEGORY_CONFIG[selected as keyof typeof CATEGORY_CONFIG]?.label || selected : '';
  const exploreHref = selected ? `/explore?category=${selected}` : '/explore';

  return (
    <section aria-labelledby="trending-title" style={{ margin: '48px 0' }}>
      <h2 id="trending-title" style={{ fontSize: 'var(--text-xl)', lineHeight: 1.2, marginBottom: '16px' }}>
        Trending in {city}
      </h2>

      <div style={{ marginBottom: '24px' }}>
        <CategoryExplorer categories={categories} selected={selected} onSelect={select} isLoading={isLoading} />
      </div>

      <div aria-live="polite" aria-busy={isLoading || isFiltering}>
        {isLoading || isFiltering ? (
          <ListingGridSkeleton count={6} />
        ) : shown.length === 0 ? (
          <EmptyStateFrame minHeight={260} style={{ borderRadius: 'var(--radius-xl)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
              {selected ? `Nothing in ${selectedLabel} in ${city} yet.` : `Nothing listed in ${city} yet.`}
            </p>
            <Link href="/submit" className="btn btn-secondary">
              Add one for free
            </Link>
          </EmptyStateFrame>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {shown.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '36px' }}>
        <Link href={exploreHref} className="btn btn-secondary" style={{ padding: '12px 28px' }}>
          <span>{selected ? `See all ${selectedLabel}` : `View all ${city} discoveries`}</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
