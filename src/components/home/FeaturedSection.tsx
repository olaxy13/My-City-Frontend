'use client';

import React from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types/api';
import ListingCard from '../listings/ListingCard';
import { EmptyStateFrame, ListingCardSkeleton } from '@/components/ui/Skeletons';
import { ArrowRight, Plus } from 'lucide-react';

export interface ListingRowsData {
  events: ListingDetail[];
  restaurants: ListingDetail[];
  facilities: ListingDetail[];
}

interface FeaturedSectionProps {
  rows: ListingRowsData;
  city: string;
  isLoading?: boolean;
}

/** Cards shown per row; the rest are a "See all" away. */
export const ROW_SIZE = 3;

/**
 * The home page's listings, one row per intent (events, food, essential
 * places), each linking to Explore filtered to that type.
 */
export default function FeaturedSection({ rows, city, isLoading = false }: FeaturedSectionProps) {
  const sections = [
    {
      key: 'events',
      title: 'Events coming up',
      subtitle: `Concerts, parties, sports and more in ${city}`,
      href: '/explore?type=event',
      items: rows.events,
    },
    {
      key: 'restaurants',
      title: 'Places to eat',
      subtitle: 'Restaurants, cafés and lounges worth the trip',
      href: '/explore?type=restaurant',
      items: rows.restaurants,
    },
    {
      key: 'facilities',
      title: 'Essential places',
      subtitle: 'Hospitals, hubs and services you can rely on',
      href: '/explore?type=facility',
      items: rows.facilities,
    },
  ];

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading listings">
        <span className="sr-only">Loading listings</span>
        {sections.map((s) => (
          <section key={s.key} style={{ margin: '48px 0' }} aria-hidden>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '20px' }}>{s.title}</h2>
            <div className="listing-row">
              {Array.from({ length: ROW_SIZE }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const visible = sections.filter((s) => s.items.length > 0);

  if (visible.length === 0) {
    return (
      <EmptyStateFrame minHeight={320} style={{ margin: '48px 0', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '6px' }}>Nothing listed in {city} yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Know a great event, restaurant or service? Add it for free.
        </p>
        <Link href="/submit" className="btn btn-primary">
          <Plus size={16} aria-hidden />
          <span>Submit a listing</span>
        </Link>
      </EmptyStateFrame>
    );
  }

  return (
    <>
      {visible.map((s) => (
        <section key={s.key} aria-labelledby={`row-${s.key}`} style={{ margin: '48px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2 id={`row-${s.key}`} style={{ fontSize: 'var(--text-xl)', lineHeight: 1.2 }}>
                {s.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
                {s.subtitle}
              </p>
            </div>
            <Link
              href={s.href}
              className="hover-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
              }}
            >
              See all <ArrowRight size={15} aria-hidden />
            </Link>
          </div>

          <div className="listing-row">
            {s.items.slice(0, ROW_SIZE).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
