'use client';

import React from 'react';
import Link from 'next/link';
import { Category, CategorySlug } from '@/types/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import {
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
} from 'lucide-react';

interface CategoryExplorerProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory?: (slug: CategorySlug) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Music: <Music size={22} />,
  Utensils: <Utensils size={22} />,
  Trophy: <Trophy size={22} />,
  Sparkles: <Sparkles size={22} />,
  Palette: <Palette size={22} />,
  Wine: <Wine size={22} />,
  Sun: <Sun size={22} />,
  GraduationCap: <GraduationCap size={22} />,
  Compass: <Compass size={22} />,
  HeartPulse: <HeartPulse size={22} />,
};

export default function CategoryExplorer({ categories = [], selectedCategory, onSelectCategory }: CategoryExplorerProps) {
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div style={{ margin: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Curated Categories
          </div>
          <h2 style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>What are you looking for today?</h2>
        </div>
        <Link href="/explore" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
          View All →
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '14px',
        }}
      >
        {safeCategories.map((cat) => {
          const config = CATEGORY_CONFIG[cat.slug] || {
            label: cat.name,
            iconName: 'Compass',
            color: '#FF5A36',
            bgGradient: 'linear-gradient(135deg, #FF5A36, #FF833E)',
            glowColor: 'rgba(255, 90, 54, 0.4)',
          };

          const isSelected = selectedCategory === cat.slug;

          const content = (
            <div
              className="glass-card"
              style={{
                padding: '18px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${config.color}` : '1px solid var(--border-card)',
                boxShadow: isSelected ? `0 8px 25px ${config.glowColor}` : 'var(--card-shadow)',
                background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: config.bgGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: `0 6px 16px ${config.glowColor}`,
                }}
              >
                {ICON_MAP[config.iconName] || <Compass size={22} />}
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {config.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {cat.listingCount} {cat.listingCount === 1 ? 'place' : 'places'}
                </div>
              </div>
            </div>
          );

          if (onSelectCategory) {
            return (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                style={{ textAlign: 'inherit', background: 'none', border: 'none', padding: 0 }}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={cat.slug} href={`/explore?category=${cat.slug}`}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
