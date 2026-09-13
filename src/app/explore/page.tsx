'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCity } from '@/context/CityContext';
import { api } from '@/lib/api-client';
import { Category, ListingDetail, ListingType, CategorySlug } from '@/types/api';
import ListingCard from '@/components/listings/ListingCard';
import {
  CATEGORY_CONFIG,
  ABEKOULA_NEIGHBORHOODS,
} from '@/lib/utils';
import {
  Search,
  Filter,
  X,
  Sparkles,
  Calendar,
  MapPin,
  UtensilsCrossed,
  Building2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentCity } = useCity();

  // State from URL or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState<string>(searchParams.get('type') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [neighborhood, setNeighborhood] = useState<string>(searchParams.get('neighborhood') || '');
  const [datePreset, setDatePreset] = useState<string>(searchParams.get('date') || '');
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Load Categories on mount
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch listings whenever filters change
  useEffect(() => {
    async function fetchResults() {
      setIsLoading(true);
      try {
        const res = await api.getListings({
          city: currentCity,
          type: type || undefined,
          category: category || undefined,
          neighborhood: neighborhood || undefined,
          date: datePreset || undefined,
          search: search.trim() || undefined,
          page,
          limit: 12,
        });

        setListings(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch filtered listings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [currentCity, type, category, neighborhood, datePreset, search, page]);

  const handleResetFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setNeighborhood('');
    setDatePreset('');
    setPage(1);
    router.push('/explore');
  };

  const hasActiveFilters = !!(search || type || category || neighborhood || datePreset);

  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '80px' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
          Discover {currentCity}
        </div>
        <h1 style={{ fontSize: '2.2rem', lineHeight: 1.2, marginBottom: '8px' }}>
          Explore Events, Dining & Places
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Find what to do, where to eat, and essential services happening right now around {currentCity}.
        </p>
      </div>

      {/* Main Grid: Sidebar Filters + Results */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '30px',
        }}
        className="explore-layout"
      >
        {/* Filter Sidebar */}
        <aside
          className="glass-card-static sidebar-panel"
          style={{
            padding: '24px',
            borderRadius: '20px',
            alignSelf: 'start',
            position: 'sticky',
            top: '90px',
            maxHeight: 'calc(100vh - 110px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.1rem' }}>
              <Filter size={18} color="var(--primary)" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Keyword Search</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Title, food, venue..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: '38px' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Listing Type Filter */}
          <div style={{ marginBottom: '22px' }}>
            <label className="form-label">Type of Place</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'All Types', val: '' },
                { label: '🎉 Events & Festivals', val: 'event' },
                { label: '🍲 Food & Dining', val: 'restaurant' },
                { label: '🏥 Essential Facilities', val: 'facility' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    setType(item.val);
                    setPage(1);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    fontWeight: type === item.val ? 700 : 500,
                    background: type === item.val ? 'var(--primary)' : 'var(--bg-input)',
                    color: type === item.val ? '#ffffff' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Presets (Visible especially for events or all) */}
          <div style={{ marginBottom: '22px' }}>
            <label className="form-label">Event Date Filter</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Any Date', val: '' },
                { label: 'Today', val: 'today' },
                { label: 'Tomorrow', val: 'tomorrow' },
                { label: 'This Weekend', val: 'this-weekend' },
                { label: 'This Week', val: 'this-week' },
                { label: 'This Month', val: 'this-month' },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => {
                    setDatePreset(d.val);
                    setPage(1);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: datePreset === d.val ? 700 : 500,
                    background: datePreset === d.val ? 'var(--accent-amber)' : 'var(--bg-input)',
                    color: datePreset === d.val ? '#000000' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Neighborhood Filter */}
          <div style={{ marginBottom: '22px' }}>
            <label className="form-label">Neighborhood</label>
            <select
              className="form-select"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Neighborhoods</option>
              {ABEKOULA_NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="form-label">Categories</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              <button
                onClick={() => {
                  setCategory('');
                  setPage(1);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: category === '' ? 700 : 500,
                  background: category === '' ? 'rgba(255, 90, 54, 0.15)' : 'transparent',
                  color: category === '' ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                All Categories
              </button>
              {categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat.slug] || { label: cat.name, color: '#FF5A36' };
                const isCatActive = category === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      setCategory(cat.slug);
                      setPage(1);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: isCatActive ? 700 : 500,
                      background: isCatActive ? 'rgba(255, 90, 54, 0.15)' : 'transparent',
                      color: isCatActive ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <span>{config.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({cat.listingCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <section>
          {/* Active Filter Pills Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{listings.length}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> results in{' '}
              <strong>{currentCity}</strong>
            </div>

            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="btn btn-secondary mobile-filter-btn"
              style={{ display: 'none', padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <Filter size={15} />
              <span>Toggle Filters</span>
            </button>
          </div>

          {/* Listing Grid */}
          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="glass-card-static"
                  style={{ height: '360px', borderRadius: '18px', background: 'var(--bg-secondary)', opacity: 0.5 }}
                />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div
              className="glass-card-static"
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '20px',
              }}
            >
              <Sparkles size={40} color="var(--primary)" style={{ marginBottom: '14px' }} />
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No matches found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                We couldn't find any places matching your exact filter criteria in {currentCity}. Try resetting filters or browsing other categories.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {listings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '50px',
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-secondary"
                style={{ opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn btn-secondary"
                style={{ opacity: page >= pagination.totalPages ? 0.4 : 1, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          .explore-layout {
            grid-template-columns: 280px 1fr !important;
          }
        }
        @media (max-width: 899px) {
          .mobile-filter-btn {
            display: flex !important;
          }
          .sidebar-panel {
            display: ${isMobileFilterOpen ? 'block' : 'none'} !important;
            position: static !important;
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <Sparkles size={32} color="var(--primary)" className="glow-animation" />
          <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading City Explorer...</div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
