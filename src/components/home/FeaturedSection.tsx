'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ListingDetail, ListingType } from '@/types/api';
import ListingCard from '../listings/ListingCard';
import { Sparkles, Calendar, UtensilsCrossed, Building2 } from 'lucide-react';

interface FeaturedSectionProps {
  listings: ListingDetail[];
  city: string;
}

export default function FeaturedSection({ listings = [], city }: FeaturedSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | ListingType>('all');
  const safeListings = Array.isArray(listings) ? listings : [];

  const filteredListings = safeListings.filter((l) => {
    if (activeTab === 'all') return true;
    return l.listingType === activeTab;
  });

  return (
    <section style={{ margin: '50px 0' }}>
      {/* Header & Filter Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Handpicked & Verified
          </div>
          <h2 style={{ fontSize: '1.85rem' }}>Trending in {city}</h2>
        </div>

        {/* Tab Pills */}
        <div className="tab-pill-container">
          <button
            onClick={() => setActiveTab('all')}
            className={`glass-pill ${activeTab === 'all' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={15} />
            <span>All</span>
            <span className="pill-badge">{safeListings.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('event')}
            className={`glass-pill ${activeTab === 'event' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <Calendar size={15} />
            <span>Events</span>
            <span className="pill-badge">{safeListings.filter((l) => l.listingType === 'event').length}</span>
          </button>
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`glass-pill ${activeTab === 'restaurant' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <UtensilsCrossed size={15} />
            <span>Dining</span>
            <span className="pill-badge">{safeListings.filter((l) => l.listingType === 'restaurant').length}</span>
          </button>
          <button
            onClick={() => setActiveTab('facility')}
            className={`glass-pill ${activeTab === 'facility' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <Building2 size={15} />
            <span>Facilities</span>
            <span className="pill-badge">{safeListings.filter((l) => l.listingType === 'facility').length}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredListings.length === 0 ? (
        <div className="glass-card-static" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No listings found in this category.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredListings.slice(0, 9).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Bottom CTA to Explore */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/explore" className="btn btn-secondary" style={{ padding: '12px 30px', fontSize: '1rem' }}>
          <span>View All {city} Discoveries</span>
          <Sparkles size={16} color="var(--primary)" />
        </Link>
      </div>
    </section>
  );
}
