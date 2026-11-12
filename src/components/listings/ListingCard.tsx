'use client';

import React from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types/api';
import { CATEGORY_CONFIG, formatEventDate } from '@/lib/utils';
import CountdownBadge from './CountdownBadge';
import { MapPin, Calendar, ShieldCheck, Utensils, Building2 } from 'lucide-react';

interface ListingCardProps {
  listing: ListingDetail;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800';
const COUNTDOWN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** True when the date is in the future but less than a week away. */
function isWithinCountdownWindow(dateStr: string) {
  const msAway = new Date(dateStr).getTime() - Date.now();
  return msAway > 0 && msAway <= COUNTDOWN_WINDOW_MS;
}

const metaRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

/**
 * A listing in a grid. The whole card links to the detail page, where the
 * contact (WhatsApp) and directions actions live.
 */
export default function ListingCard({ listing }: ListingCardProps) {
  const catConfig = CATEGORY_CONFIG[listing.category] || {
    label: listing.category,
    color: '#FF5A36',
  };

  const href = `/listings/${listing.id}`;
  const startDate = listing.listingType === 'event' ? listing.eventDetails?.startDateTime : undefined;
  const showCountdown = !!startDate && isWithinCountdownWindow(startDate);

  const isVerified =
    (listing.legalDocumentUrls?.length ?? 0) > 0 ||
    !!listing.restaurantDetails?.cacNumber ||
    !!listing.facilityDetails?.cacNumber;

  return (
    <Link
      href={href}
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      {/* Image: one badge, plus a countdown only when the event is under a week away */}
      <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={listing.thumbnailUrl || FALLBACK_IMAGE}
          alt=""
          className="hover-zoom"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span
          className="badge"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: catConfig.color,
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {catConfig.label}
        </span>
        {showCountdown && (
          <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
            <CountdownBadge targetDate={startDate!} compact />
          </div>
        )}
      </div>

      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <h3
          style={{
            fontSize: 'var(--text-lg)',
            lineHeight: 1.3,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <span>{listing.title}</span>
          {isVerified && (
            <ShieldCheck
              size={16}
              color="var(--accent-emerald)"
              aria-label="Verified business"
              style={{ flexShrink: 0, marginTop: '3px' }}
            >
              <title>Verified business</title>
            </ShieldCheck>
          )}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <MapPin size={13} aria-hidden style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.neighborhood}, {listing.city}
          </span>
        </div>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {listing.description}
        </p>

        {/* Key fact for the listing type, pinned to the bottom of the card */}
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          {startDate && (
            <div style={metaRow}>
              <Calendar size={14} color="var(--primary)" aria-hidden />
              <span>{formatEventDate(startDate)}</span>
            </div>
          )}

          {listing.listingType === 'restaurant' && listing.restaurantDetails && (
            <div style={{ ...metaRow, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Utensils size={14} color="var(--primary)" aria-hidden />
                {listing.restaurantDetails.cuisineType}
              </span>
              {listing.restaurantDetails.priceRange && (
                <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                  {listing.restaurantDetails.priceRange}
                </span>
              )}
            </div>
          )}

          {listing.listingType === 'facility' && listing.facilityDetails && (
            <div style={metaRow}>
              <Building2 size={14} color="var(--primary)" aria-hidden />
              <span>{listing.facilityDetails.facilityCategory}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
