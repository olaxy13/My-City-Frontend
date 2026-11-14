'use client';

import React from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types/api';
import { CATEGORY_CONFIG, formatEventDate } from '@/lib/utils';
import CountdownBadge from './CountdownBadge';
import { sizedImage } from '@/lib/images';
import { MapPin, Calendar, CalendarX, ShieldCheck, Utensils, Building2 } from 'lucide-react';

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

/** Events without an end time count as finished this long after they start. */
const DEFAULT_EVENT_LENGTH_MS = 6 * 60 * 60 * 1000;

/** True for a one-off event whose end time (or start + 6h) has passed. Recurring events never end. */
export function hasEventEnded(listing: ListingDetail) {
  const details = listing.listingType === 'event' ? listing.eventDetails : null;
  if (!details?.startDateTime || details.isRecurring) return false;
  const end = details.endDateTime
    ? new Date(details.endDateTime).getTime()
    : new Date(details.startDateTime).getTime() + DEFAULT_EVENT_LENGTH_MS;
  return Date.now() > end;
}

/** Same listings with ended events moved after everything still on; otherwise keeps the given order. */
export function activeFirst(listings: ListingDetail[]) {
  return [...listings].sort((a, b) => Number(hasEventEnded(a)) - Number(hasEventEnded(b)));
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
  const ended = hasEventEnded(listing);
  const showCountdown = !ended && !!startDate && isWithinCountdownWindow(startDate);

  const isVerified =
    (listing.legalDocumentUrls?.length ?? 0) > 0 ||
    !!listing.restaurantDetails?.cacNumber ||
    !!listing.facilityDetails?.cacNumber;

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    color: 'inherit',
    textDecoration: 'none',
  };

  const content = (
    <>
      {/* Image: one badge, plus a countdown only when the event is under a week away */}
      <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={sizedImage(listing.thumbnailUrl || FALLBACK_IMAGE, 400)}
          loading="lazy"
          decoding="async"
          alt=""
          className="hover-zoom listing-card__photo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span
          className="badge"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: ended ? 'rgba(71, 85, 105, 0.9)' : catConfig.color,
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
        {ended && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'rgba(10, 13, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <CalendarX size={13} aria-hidden />
            Ended
          </span>
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
            <div style={ended ? { ...metaRow, color: 'var(--text-muted)' } : metaRow}>
              <Calendar size={14} color={ended ? 'currentColor' : 'var(--primary)'} aria-hidden />
              <span>
                {ended ? 'Ended · ' : ''}
                {formatEventDate(startDate)}
              </span>
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
    </>
  );

  // An event that has ended isn't a link: there's nothing left to open
  if (ended) {
    return (
      <article
        className="glass-card-static listing-card--ended"
        aria-label={`${listing.title} (ended)`}
        style={cardStyle}
      >
        {content}
      </article>
    );
  }

  return (
    <Link href={href} className="glass-card" style={cardStyle}>
      {content}
    </Link>
  );
}
