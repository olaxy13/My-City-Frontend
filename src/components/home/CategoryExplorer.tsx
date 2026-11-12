'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import { CategoryGridSkeleton } from '@/components/ui/Skeletons';
import {
  ArrowRight,
  Compass,
  GraduationCap,
  HeartPulse,
  Music,
  Palette,
  Sparkles,
  Sun,
  Trophy,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Music,
  Utensils,
  Trophy,
  Sparkles,
  Palette,
  Wine,
  Sun,
  GraduationCap,
  Compass,
  HeartPulse,
};

interface CategoryExplorerProps {
  categories: Category[];
  isLoading?: boolean;
}

/**
 * One row of category chips linking into Explore. Icons share the brand
 * colour so coral stays the single accent; the row wraps on wide screens
 * and scrolls sideways on narrow ones.
 */
export default function CategoryExplorer({ categories = [], isLoading = false }: CategoryExplorerProps) {
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <section aria-labelledby="browse-categories" style={{ margin: '40px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <h2 id="browse-categories" style={{ fontSize: 'var(--text-xl)', lineHeight: 1.2 }}>
          Browse by category
        </h2>
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
          Explore all <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <CategoryGridSkeleton />
      ) : (
        <ul className="chip-row" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {safeCategories.map((cat) => {
            const config = CATEGORY_CONFIG[cat.slug];
            const Icon = (config && ICONS[config.iconName]) || Compass;
            const label = config?.label || cat.name;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/explore?category=${cat.slug}`}
                  className="hero-chip"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={16} color="var(--primary)" aria-hidden />
                  <span>{label}</span>
                  {cat.listingCount > 0 && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                      {cat.listingCount}
                      <span className="sr-only"> {cat.listingCount === 1 ? 'place' : 'places'}</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
