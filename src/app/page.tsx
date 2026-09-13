'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCity } from '@/context/CityContext';
import { api } from '@/lib/api-client';
import { Category, CountdownSliderItem, ListingDetail } from '@/types/api';
import CountdownHeroSlider from '@/components/home/CountdownHeroSlider';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import FeaturedSection from '@/components/home/FeaturedSection';
import {
  ShieldCheck,
  Sparkles,
  Zap,
  MapPin,
  PlusCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const { currentCity } = useCity();

  const [countdownItems, setCountdownItems] = useState<CountdownSliderItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredListings, setFeaturedListings] = useState<ListingDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHomeData() {
      setIsLoading(true);
      try {
        const [sliderRes, catsRes, listingsRes] = await Promise.all([
          api.getUpcomingCountdown(currentCity, 8).catch(() => []),
          api.getCategories().catch(() => []),
          api.getListings({ city: currentCity, limit: 12 }).catch(() => ({ data: [] })),
        ]);

        setCountdownItems(Array.isArray(sliderRes) ? sliderRes : []);
        setCategories(Array.isArray(catsRes) ? catsRes : []);
        setFeaturedListings(Array.isArray(listingsRes?.data) ? listingsRes.data : []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadHomeData();
  }, [currentCity]);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* 1. Hero Countdown Slider */}
      <CountdownHeroSlider items={countdownItems} isLoading={isLoading} />

      {/* 2. Quick Value Proposition Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginTop: '30px',
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255, 90, 54, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              100% Free Submissions
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Zero commission or ticket markups
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Verified Business Badges
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Strict CAC & license moderation
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Real-time Event Countdown
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Never miss what is happening next
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Explorer */}
      <CategoryExplorer categories={categories} />

      {/* 4. Featured & Discoveries Grid */}
      <FeaturedSection listings={featuredListings} city={currentCity} />

      {/* 5. Submitter Banner Callout */}
      <div
        className="glass-card callout-banner"
        style={{
          marginTop: '60px',
          padding: '40px',
          borderRadius: '24px',
          background:
            'linear-gradient(135deg, rgba(255, 90, 54, 0.15) 0%, rgba(245, 158, 11, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <span className="badge badge-featured" style={{ marginBottom: '12px' }}>
            ⚡ FREE COMMUNITY DIRECTORY
          </span>
          <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 2rem)', marginBottom: '10px' }}>
            Are you hosting an event or running a business in {currentCity}?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Gain organic visibility from city locals and visitors searching for experiences. Free submission, direct WhatsApp inquiries, and fast 24-hour admin review.
          </p>
        </div>

        <Link
          href="/submit"
          className="btn btn-primary"
          style={{ padding: '14px 28px', fontSize: '1.05rem', width: '100%', maxWidth: '360px', justifyContent: 'center' }}
        >
          <PlusCircle size={20} />
          <span>Submit Your Listing For Free</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .callout-banner {
            padding: 24px 20px !important;
            margin-top: 40px !important;
            border-radius: 18px !important;
          }
          .callout-banner .btn {
            max-width: 100% !important;
            font-size: 0.95rem !important;
          }
        }
      `}</style>
    </div>
  );
}
