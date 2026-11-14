'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, CalendarDays, CalendarRange, MapPin, Music, Search, Ticket, Utensils, type LucideIcon } from 'lucide-react';
import type { CountdownSliderItem, ListingDetail } from '@/types/api';
import { useCity } from '@/context/CityContext';
import CountdownHeroSlider from './CountdownHeroSlider';

/** Date shortcuts into Explore. Food and facilities have their own rows further down. */
const QUICK_LINKS: { label: string; href: string; Icon: LucideIcon }[] = [
  { label: 'Today', href: '/explore?date=today', Icon: Calendar },
  { label: 'This weekend', href: '/explore?date=this-weekend', Icon: CalendarDays },
  { label: 'This week', href: '/explore?date=this-week', Icon: CalendarRange },
];

interface HomeHeroProps {
  items: CountdownSliderItem[];
  /** Fills the event card with popular places when there are no upcoming events. */
  places?: ListingDetail[];
  isLoading: boolean;
}

export default function HomeHero({ items, places = [], isLoading }: HomeHeroProps) {
  const { currentCity } = useCity();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const heroRef = useRef<HTMLElement>(null);
  useHideOverlappingGhosts(heroRef);
  const city = currentCity || 'your city';

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/explore?search=${encodeURIComponent(q)}` : '/explore');
  };

  return (
    <section
      ref={heroRef}
      aria-labelledby="home-hero-title"
      style={{
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        padding: 'clamp(20px, 4vw, 44px)',
        background: [
          'radial-gradient(60% 85% at 8% 0%, rgba(255, 90, 54, 0.2), transparent 62%)',
          'radial-gradient(50% 80% at 100% 100%, rgba(245, 158, 11, 0.16), transparent 62%)',
          'var(--bg-secondary)',
        ].join(', '),
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        gap: 'clamp(24px, 4vw, 48px)',
        alignItems: 'center',
      }}
    >
      <HeroBackdrop />

      {/* Search first */}
      <div style={{ minWidth: 0 }}>
        <h1
          id="home-hero-title"
          style={{ fontSize: 'clamp(2rem, 4.6vw, 3.1rem)', lineHeight: 1.1, marginBottom: '14px' }}
        >
          What&apos;s on in <span style={{ color: 'var(--primary)' }}>{city}</span>
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-md)',
            lineHeight: 1.55,
            marginBottom: '24px',
            maxWidth: '460px',
          }}
        >
          Events, food spots and essential places, checked by our team before they go live.
        </p>

        <form
          role="search"
          onSubmit={onSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 6px 6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border-color)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
            maxWidth: '520px',
          }}
        >
          <Search size={18} color="var(--text-muted)" aria-hidden style={{ flexShrink: 0 }} />
          <label htmlFor="home-search" className="sr-only">
            Search events, food and places
          </label>
          <input
            id="home-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Concerts, amala, hospitals…"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-base)',
              padding: '10px 0',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', flexShrink: 0 }}>
            Search
          </button>
        </form>

        <nav aria-label="Quick filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          {QUICK_LINKS.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="hero-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
              }}
            >
              <Icon size={14} color="var(--primary)" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Next big event */}
      <div style={{ minWidth: 0 }}>
        <CountdownHeroSlider items={items} places={places} isLoading={isLoading} />
      </div>
    </section>
  );
}

/** Edge-only dot grid and faint icons behind the hero. */
/** Faint, tilted icons in the hero's empty spaces; positions per screen size are in globals.css. */
const GHOST_ICONS: { Icon: LucideIcon; className: string }[] = [
  { Icon: Ticket, className: 'hero-ghost hero-ghost--ticket' },
  { Icon: Music, className: 'hero-ghost hero-ghost--music' },
  { Icon: MapPin, className: 'hero-ghost hero-ghost--pin' },
  { Icon: Utensils, className: 'hero-ghost hero-ghost--food' },
  { Icon: CalendarDays, className: 'hero-ghost hero-ghost--calendar' },
];

/**
 * Hides any faint icon that would sit behind the heading, text, search box,
 * date chips or event card, re-checking whenever the hero changes size, so the
 * icons only ever fill genuinely empty space.
 */
function useHideOverlappingGhosts(hero: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = hero.current;
    if (!section) return;
    const overlaps = (a: DOMRect, b: DOMRect, pad = 8) =>
      !(a.right + pad < b.left || a.left - pad > b.right || a.bottom + pad < b.top || a.top - pad > b.bottom);
    const check = () => {
      // Text is measured line by line, so the empty space beside a short line still counts as free
      const textLines = [...section.querySelectorAll('h1, p')].flatMap((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return [...range.getClientRects()];
      });
      const blocks = [...section.querySelectorAll('form, nav a, [aria-roledescription="carousel"], .fade-in')].map((el) =>
        el.getBoundingClientRect()
      );
      const content = [...textLines, ...blocks];
      section.querySelectorAll<SVGElement>('.hero-ghost').forEach((ghost) => {
        ghost.style.visibility = 'visible';
        const r = ghost.getBoundingClientRect();
        if (r.width && content.some((c) => overlaps(r, c))) ghost.style.visibility = 'hidden';
      });
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(section);
    return () => ro.disconnect();
  }, [hero]);
}

function HeroBackdrop() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      {GHOST_ICONS.map(({ Icon, className }) => (
        <Icon key={className} className={className} strokeWidth={1.5} />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 90, 54, 0.28) 1.2px, transparent 1.6px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 70% 75% at 30% 45%, transparent 40%, #000 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 75% at 30% 45%, transparent 40%, #000 90%)',
        }}
      />
    </div>
  );
}
