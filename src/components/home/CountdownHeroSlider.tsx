'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CountdownSliderItem } from '@/types/api';
import { CATEGORY_CONFIG, calculateCountdown, formatEventDate, formatEventTime } from '@/lib/utils';
import { useCity } from '@/context/CityContext';
import { ArrowRight, Calendar, CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Sparkles, Utensils, MapPin } from 'lucide-react';

interface CountdownHeroSliderProps {
  items?: CountdownSliderItem[];
  isLoading?: boolean;
}

const CARD_HEIGHT = 400;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200';

/** "1d 11h", "3h 20m", "12m", or "Happening now". */
function startsIn(dateStr: string) {
  const t = calculateCountdown(dateStr);
  if (t.isPast) return 'Happening now';
  if (t.days > 0) return `Starts in ${t.days}d ${t.hours}h`;
  if (t.hours > 0) return `Starts in ${t.hours}h ${t.minutes}m`;
  return `Starts in ${Math.max(t.minutes, 1)}m`;
}

/** Re-renders every 30s so the "starts in" text stays current without a ticking clock. */
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
}

/** Compact card showing the next upcoming events one at a time. */
export default function CountdownHeroSlider({ items = [], isLoading = false }: CountdownHeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  useMinuteTick();

  const safeItems = Array.isArray(items) ? items : [];
  const total = safeItems.length;

  // Auto-advance every 6s, paused while hovered or focused
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const id = setInterval(() => setCurrentIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(id);
  }, [total, isPaused]);

  // While events load, show a real intro card rather than a grey placeholder;
  // the first event fades in over it when it arrives.
  if (isLoading) return <IntroCard />;

  if (total === 0) {
    return (
      <div
        style={{
          height: CARD_HEIGHT, // same size as the event card, so the hero doesn't shrink
          borderRadius: 'var(--radius-lg)',
          border: '1.5px dashed var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#fff',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-amber))',
            boxShadow: '0 0 0 7px rgba(255, 90, 54, 0.12), 0 10px 26px rgba(255, 90, 54, 0.3)',
          }}
        >
          <Sparkles size={26} aria-hidden />
        </div>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '6px' }}>No upcoming events yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '18px', maxWidth: 300 }}>
          Hosting something? Be the first to put it on the map.
        </p>
        <Link href="/submit" className="btn btn-primary">
          <Plus size={16} aria-hidden />
          <span>Submit an event</span>
        </Link>
      </div>
    );
  }

  const index = currentIndex % total;
  const current = safeItems[index];
  const category = current.category ? CATEGORY_CONFIG[current.category] : null;
  const categoryLabel = category?.label || current.categoryLabel || 'Event';
  const href = `/listings/${current.id}`;

  const go = (delta: number) => setCurrentIndex((i) => (i + delta + total) % total);

  return (
    <div
      role="region"
      className="fade-in"
      aria-roledescription="carousel"
      aria-label="Upcoming events"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      style={{
        position: 'relative',
        height: CARD_HEIGHT,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.28)',
        color: '#fff',
      }}
    >
      {/* Every event's photo is stacked; the current one fades in over the others */}
      {safeItems.map((item, i) => (
        <div
          key={item.id}
          aria-hidden
          className="hero-slide-photo"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${item.thumbnailUrl || FALLBACK_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === index ? 1 : 0,
            transform: i === index ? 'scale(1)' : 'scale(1.04)',
          }}
        />
      ))}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(10,13,20,0.05) 25%, rgba(10,13,20,0.7) 58%, rgba(10,13,20,0.95) 100%)',
        }}
      />

      {/* Top: label + arrows */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            letterSpacing: '0.03em',
            background: 'rgba(10, 13, 20, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            aria-hidden
            style={{ width: 8, height: 8, borderRadius: '50%', background: category?.color || 'var(--primary)' }}
          />
          {categoryLabel}
        </span>

        {total > 1 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: 'Previous event', Icon: ChevronLeft, delta: -1 },
              { label: 'Next event', Icon: ChevronRight, delta: 1 },
            ].map(({ label, Icon, delta }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => go(delta)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  background: 'rgba(10, 13, 20, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: details and one action */}
      <div
        aria-live={isPaused ? 'polite' : 'off'}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 20px 18px' }}
      >
        {/* Re-keyed per event so the text fades up with the new photo */}
        <div key={current.id} className="hero-slide-text">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '6px',
          }}
        >
          <Calendar size={14} aria-hidden />
          <span>
            {formatEventDate(current.startDateTime)} · {formatEventTime(current.startDateTime)}
            {current.neighborhood ? ` · ${current.neighborhood}` : ''}
          </span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)',
            lineHeight: 1.2,
            marginBottom: '14px',
            color: '#fff',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {current.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--accent-amber)',
            }}
          >
            <Clock size={14} aria-hidden />
            {startsIn(current.startDateTime)}
          </span>

          <Link href={href} className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 'var(--text-sm)' }}>
            <span>View event</span>
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

        </div>

        {total > 1 && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '14px' }}>
            {safeItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show event ${i + 1} of ${total}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: i === index ? 20 : 6,
                  height: 6,
                  padding: 0,
                  borderRadius: 'var(--radius-full)',
                  background: i === index ? 'var(--primary)' : 'rgba(255,255,255,0.35)',
                  transition: 'width 0.25s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Shown in the event card's place while events load: on-brand content, not a skeleton. */
function IntroCard() {
  const { currentCity } = useCity();
  const city = currentCity || 'your city';

  return (
    <div
      style={{
        position: 'relative',
        height: CARD_HEIGHT,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        isolation: 'isolate',
        color: '#fff',
        background: [
          'radial-gradient(70% 60% at 85% 15%, rgba(255, 255, 255, 0.22), transparent 60%)',
          'radial-gradient(80% 70% at 10% 100%, rgba(10, 13, 20, 0.45), transparent 70%)',
          'linear-gradient(135deg, #ff5a36 0%, #ff7a3d 45%, #f59e0b 100%)',
        ].join(', '),
        boxShadow: '0 18px 40px rgba(255, 90, 54, 0.28)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
      }}
    >
      {/* Large faint icons for texture */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: 0.16 }}>
        <CalendarDays size={150} style={{ position: 'absolute', right: -20, top: 30, transform: 'rotate(10deg)' }} />
        <Utensils size={90} style={{ position: 'absolute', right: 120, bottom: 120, transform: 'rotate(-12deg)' }} />
        <MapPin size={70} style={{ position: 'absolute', left: 40, top: 90, transform: 'rotate(-6deg)' }} />
      </div>

      <span
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          background: 'rgba(10, 13, 20, 0.25)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Sparkles size={13} aria-hidden /> This week in {city}
      </span>

      <div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 1.9rem)', lineHeight: 1.15, color: '#fff', marginBottom: '8px' }}>
          Concerts, food spots and hidden gems
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', maxWidth: 320 }}>
          Everything worth doing in {city}, in one place.
        </p>
        <Link
          href="/explore"
          className="btn"
          style={{
            padding: '9px 16px',
            fontSize: 'var(--text-sm)',
            background: '#fff',
            color: 'var(--primary)',
            fontWeight: 700,
          }}
        >
          <span>Explore {city}</span>
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
