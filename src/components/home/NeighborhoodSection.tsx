'use client';

import React from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types/api';
import { Bone } from '@/components/ui/Skeletons';
import { ArrowRight, MapPin } from 'lucide-react';

/** One large card for the busiest area plus four smaller ones. */
const MAX_AREAS = 5;

interface Area {
  name: string;
  count: number;
  photo?: string;
}

/** Prefer real photos of places (featured first); event flyers are mostly text. */
function pickPhoto(items: ListingDetail[]) {
  const withPhoto = items.filter((l) => l.thumbnailUrl);
  const places = withPhoto.filter((l) => l.listingType !== 'event');
  return (places.find((l) => l.isFeatured) || places[0] || withPhoto[0])?.thumbnailUrl;
}

/** Groups listings by neighborhood: how many there are and a photo to represent it. */
function summarise(listings: ListingDetail[]): Area[] {
  const byArea = new Map<string, ListingDetail[]>();
  for (const l of listings) {
    const name = l.neighborhood?.trim();
    if (!name) continue;
    byArea.set(name, [...(byArea.get(name) || []), l]);
  }

  return [...byArea.entries()]
    .map(([name, items]) => ({ name, count: items.length, photo: pickPhoto(items) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, MAX_AREAS);
}

interface NeighborhoodSectionProps {
  /** Listings for the current city; the areas are worked out from these. */
  listings: ListingDetail[];
  city: string;
  isLoading?: boolean;
}

/** "Explore by neighborhood": photo cards for the busiest areas, linking into Explore. */
export default function NeighborhoodSection({ listings, city, isLoading = false }: NeighborhoodSectionProps) {
  const areas = summarise(listings);
  if (!isLoading && areas.length === 0) return null;

  return (
    <section aria-labelledby="areas-title" style={{ marginTop: '48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 id="areas-title" style={{ fontSize: 'var(--text-xl)', lineHeight: 1.2 }}>
            Explore by neighborhood
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            The busiest parts of {city} right now
          </p>
        </div>
        <Link
          href="/explore"
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
          All areas <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="area-grid" role="status" aria-busy="true" aria-label="Loading neighborhoods">
          {Array.from({ length: MAX_AREAS }).map((_, i) => (
            <Bone key={i} height="100%" radius="var(--radius-lg)" style={{ minHeight: 140 }} />
          ))}
        </div>
      ) : (
        <ul className="area-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {areas.map((area, i) => (
            <li key={area.name} style={{ minWidth: 0 }}>
              <AreaCard area={area} featured={i === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AreaCard({ area, featured }: { area: Area; featured: boolean }) {
  return (
    <Link
      href={`/explore?neighborhood=${encodeURIComponent(area.name)}`}
      className="area-card"
      style={{
        position: 'relative',
        display: 'block',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        isolation: 'isolate',
        color: '#fff',
        textDecoration: 'none',
        background: 'linear-gradient(135deg, var(--primary), var(--accent-amber))',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
      }}
    >
      {area.photo && (
        <img
          src={area.photo}
          alt=""
          className="area-card__photo"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -2 }}
        />
      )}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: 'linear-gradient(180deg, rgba(10,13,20,0.05) 20%, rgba(10,13,20,0.55) 55%, rgba(10,13,20,0.92) 100%)',
        }}
      />

      {featured && (
        <span
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            padding: '5px 11px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            background: 'var(--primary)',
            boxShadow: '0 4px 14px rgba(255, 90, 54, 0.45)',
          }}
        >
          Busiest area
        </span>
      )}

      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: featured ? '20px 22px' : '14px 16px',
          display: 'block',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 800,
            fontSize: featured ? 'clamp(1.4rem, 2.6vw, 1.9rem)' : 'var(--text-md)',
            lineHeight: 1.15,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          <MapPin size={featured ? 20 : 15} color="var(--primary)" aria-hidden style={{ flexShrink: 0 }} />
          {area.name}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: '4px',
            fontSize: 'var(--text-sm)',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {area.count} {area.count === 1 ? 'place' : 'places'} to explore
        </span>
      </span>
    </Link>
  );
}
