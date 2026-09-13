'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CountdownSliderItem } from '@/types/api';
import { CATEGORY_CONFIG, formatEventDate, formatEventTime } from '@/lib/utils';
import CountdownBadge from '../listings/CountdownBadge';
import AddToCalendarMenu from '../listings/AddToCalendarMenu';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  Ticket,
} from 'lucide-react';

interface CountdownHeroSliderProps {
  items?: CountdownSliderItem[];
  isLoading?: boolean;
}

export default function CountdownHeroSlider({ items = [], isLoading = false }: CountdownHeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const safeItems = Array.isArray(items) ? items : [];
  const total = safeItems.length;

  // Auto-slide effect (5000ms) with pause on hover
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  // Bound index safely
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, total]);

  if (isLoading) {
    return (
      <div
        className="glass-card-static"
        style={{
          minHeight: '420px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Sparkles size={36} color="var(--primary)" className="glow-animation" style={{ marginBottom: '12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
            Curating upcoming Abeokuta events...
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div
        className="glass-card-static"
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.08), rgba(245, 158, 11, 0.04))',
        }}
      >
        <Sparkles size={40} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>No Upcoming Events Right Now</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Be the first to host or promote an exciting event in Abeokuta!
        </p>
        <Link href="/submit" className="btn btn-primary">
          + Submit Event Listing
        </Link>
      </div>
    );
  }

  const safeIndex = (currentIndex % total + total) % total;
  const current = safeItems[safeIndex];

  if (!current) {
    return null;
  }

  const catConfig = (current.category ? CATEGORY_CONFIG[current.category] : null) || {
    label: current.categoryLabel || current.category || 'Event',
    color: '#FF5A36',
    bgGradient: 'linear-gradient(135deg, #FF5A36, #FF833E)',
    glowColor: 'rgba(255, 90, 54, 0.4)',
    iconName: 'Sparkles',
  };

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % total);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + total) % total);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '480px',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: 'var(--hero-shadow)',
      }}
    >
      {/* Background Image with Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${current.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.6s ease-in-out',
        }}
      >
        {/* Darkening / Tinting Gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10, 13, 20, 0.45) 0%, rgba(10, 13, 20, 0.88) 65%, #0a0d14 100%)',
          }}
        />
      </div>

      {/* Decorative Glow Orb */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 90, 54, 0.28) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Foreground Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: 'clamp(20px, 4vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '480px',
          height: '100%',
        }}
      >
        {/* Top Row: Category Tag & Location */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#ffffff',
                background: catConfig.bgGradient,
                boxShadow: '0 4px 14px rgba(255, 90, 54, 0.35)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={13} />
              <span>{catConfig.label}</span>
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MapPin size={13} color="var(--primary)" />
              <span>{current.neighborhood || current.city}</span>
            </span>
          </div>

          {/* Slide Progress Counter */}
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.75)',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 12px',
              borderRadius: '20px',
              backdropFilter: 'blur(8px)',
            }}
          >
            {safeIndex + 1} / {total}
          </div>
        </div>

        {/* Center: Title & Live Countdown Box */}
        <div style={{ margin: '30px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-amber)',
              fontSize: '0.9rem',
              fontWeight: 700,
              marginBottom: '10px',
            }}
          >
            <Calendar size={16} />
            <span>
              {formatEventDate(current.startDateTime)} • {formatEventTime(current.startDateTime)}
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.7rem, 3.8vw, 2.7rem)',
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '16px',
              textShadow: '0 4px 15px rgba(0,0,0,0.6)',
            }}
          >
            {current.title}
          </h1>

          {/* Large Countdown Clock */}
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'inline-block',
              maxWidth: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚡ Live Countdown to Event
            </div>
            <CountdownBadge targetDate={current.startDateTime} size="lg" />
          </div>
        </div>

        {/* Bottom Row: Actions & Navigation Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Action CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {current.externalLink ? (
              <a
                href={current.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.95rem' }}
              >
                <Ticket size={16} />
                <span>Get Tickets / Register</span>
              </a>
            ) : null}

            <Link
              href={`/listings/${current.id}`}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
            >
              <span>Full Details</span>
              <ExternalLink size={15} />
            </Link>

            {/* Smart Add To Calendar Menu (No Signup Required) */}
            <AddToCalendarMenu
              title={current.title}
              description={current.description || ''}
              startDateTime={current.startDateTime}
              endDateTime={current.endDateTime}
              location={`${current.neighborhood || ''}, ${current.city || 'Abeokuta'}`}
              variant="outline"
            />
          </div>

          {/* Slider Pagination Controls & Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {safeItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: idx === safeIndex ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: idx === safeIndex ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.25s ease',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            {total > 1 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={prevSlide}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  aria-label="Next slide"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
