'use client';

import React from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types/api';
import {
  CATEGORY_CONFIG,
  getWhatsAppLink,
  getDirectionsLink,
  formatEventDate,
} from '@/lib/utils';
import CountdownBadge from './CountdownBadge';
import {
  MapPin,
  MessageCircle,
  Navigation,
  Calendar,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Star,
} from 'lucide-react';

interface ListingCardProps {
  listing: ListingDetail;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const catConfig = CATEGORY_CONFIG[listing.category] || {
    label: listing.category,
    color: '#FF5A36',
    bgGradient: 'linear-gradient(135deg, #FF5A36, #FF833E)',
  };

  const isEvent = listing.listingType === 'event';
  const isRestaurant = listing.listingType === 'restaurant';
  const isFacility = listing.listingType === 'facility';

  const hasCac =
    (listing.legalDocumentUrls && listing.legalDocumentUrls.length > 0) ||
    listing.restaurantDetails?.cacNumber ||
    listing.facilityDetails?.cacNumber;

  const whatsAppUrl = getWhatsAppLink(listing.contactPhone, listing.title);
  const directionsUrl = getDirectionsLink(
    listing.latitude,
    listing.longitude,
    listing.address,
    listing.neighborhood,
    listing.city
  );

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Thumbnail & Badges */}
      <div style={{ position: 'relative', width: '100%', height: '210px', overflow: 'hidden' }}>
        <Link href={`/listings/${listing.id}`}>
          <img
            src={listing.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
            alt={listing.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Link>

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Listing Type & Category */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span
              className="badge"
              style={{
                background: catConfig.color,
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {catConfig.label}
            </span>
            {listing.isFeatured && (
              <span className="badge badge-featured">
                <Star size={11} fill="#000" style={{ marginRight: '2px' }} />
                Featured
              </span>
            )}
          </div>

          {/* CAC Verified Badge */}
          {hasCac && (
            <span
              className="glass-pill badge-cac"
              style={{ padding: '3px 8px', fontSize: '0.7rem', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}
              title="Verified Registration & License"
            >
              <ShieldCheck size={13} color="#10B981" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {/* Countdown Badge on Image Bottom */}
        {isEvent && listing.eventDetails?.startDateTime && (
          <div style={{ position: 'absolute', bottom: '10px', left: '12px', zIndex: 2 }}>
            <CountdownBadge targetDate={listing.eventDetails.startDateTime} compact />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Location / Neighborhood Tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            <MapPin size={14} />
            <span>
              {listing.neighborhood}, {listing.city}
            </span>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '1.15rem', lineHeight: 1.3, marginBottom: '8px' }}>
            <Link
              href={`/listings/${listing.id}`}
              style={{
                color: 'var(--text-primary)',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            >
              {listing.title}
            </Link>
          </h3>

          {/* Description Snippet */}
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '16px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {listing.description}
          </p>

          {/* Type-Specific Highlights */}
          <div style={{ marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {isEvent && listing.eventDetails && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
                <Calendar size={14} color="var(--primary)" />
                <span>{formatEventDate(listing.eventDetails.startDateTime)}</span>
              </div>
            )}

            {isRestaurant && listing.restaurantDetails && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  🍴 {listing.restaurantDetails.cuisineType}
                </span>
                {listing.restaurantDetails.priceRange && (
                  <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {listing.restaurantDetails.priceRange}
                  </span>
                )}
              </div>
            )}

            {isFacility && listing.facilityDetails && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                <span>🏥 {listing.facilityDetails.facilityCategory}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: listing.contactPhone ? '1fr 1fr' : '1fr',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {listing.contactPhone ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ fontSize: '0.82rem', padding: '8px 10px' }}
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>
          ) : null}

          <Link
            href={`/listings/${listing.id}`}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
          >
            <span>View Details</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
