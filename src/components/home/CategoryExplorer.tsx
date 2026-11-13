'use client';

import React from 'react';
import { Category } from '@/types/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import { CategoryGridSkeleton } from '@/components/ui/Skeletons';
import {
  Compass,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
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
  /** Selected category slug, or null for "All". */
  selected: string | null;
  onSelect: (slug: string | null) => void;
  isLoading?: boolean;
}

/** One scrolling line of category chips used to filter the Trending grid. */
export default function CategoryExplorer({ categories = [], selected, onSelect, isLoading = false }: CategoryExplorerProps) {
  const safeCategories = Array.isArray(categories) ? categories : [];

  if (isLoading) return <CategoryGridSkeleton />;

  const chips = [
    { slug: null as string | null, label: 'All', Icon: LayoutGrid, count: 0 },
    ...safeCategories.map((cat) => {
      const config = CATEGORY_CONFIG[cat.slug];
      return {
        slug: cat.slug as string | null,
        label: config?.label || cat.name,
        Icon: (config && ICONS[config.iconName]) || Compass,
        count: cat.listingCount,
      };
    }),
  ];

  return (
    <div role="group" aria-label="Filter by category" className="chip-row chip-row--scroll">
      {chips.map(({ slug, label, Icon, count }) => {
        const active = selected === slug;
        return (
          <button
            key={slug ?? 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(slug)}
            className="hero-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 15px',
              borderRadius: 'var(--radius-full)',
              background: active ? 'rgba(255, 90, 54, 0.15)' : 'var(--bg-card)',
              border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            <Icon size={16} color="var(--primary)" aria-hidden />
            <span>{label}</span>
            {count > 0 && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {count}
                <span className="sr-only"> {count === 1 ? 'place' : 'places'}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
