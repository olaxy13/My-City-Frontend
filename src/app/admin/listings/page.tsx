'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { ListingDetail } from '@/types/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import AdminCommissionSettingsCard from '@/components/admin/AdminCommissionSettingsCard';
import {
  DollarSign,
  Search,
  Eye,
  Camera,
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Filter,
  Loader2,
} from 'lucide-react';

export default function AdminListingsPage() {
  const router = useRouter();
  const { isAuthenticated, admin, logout, isLoading: isAuthLoading } = useAuth();

  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'event'>('event');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [selectedCommissionListing, setSelectedCommissionListing] = useState<ListingDetail | null>(null);

  // Authentication Guard once auth is done reading from storage
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadListings();
  }, [filterType, searchQuery, isAuthLoading, isAuthenticated]);

  async function loadListings(page = 1) {
    if (isAuthLoading || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.getAdminListings({
        search: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });

      let items = res.data || [];
      if (filterType === 'event') {
        items = items.filter((item) => item.listingType === 'event');
      }

      setListings(items);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load listings:', err);
      if (err?.status === 401 || err?.message?.includes('token')) {
        logout();
        router.push('/admin');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', background: 'var(--bg-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
          <Loader2 className="spin" size={24} color="var(--primary)" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--bg-main)' }}>
      {/* Sidebar Navigation */}
      <aside
        className="glass-card-static"
        style={{
          width: '260px',
          flexShrink: 0,
          borderRadius: 0,
          borderRight: '1px solid var(--border-color)',
          borderTop: 'none',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--bg-input)',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
            {admin?.name || 'Admin'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{admin?.role}</div>
        </div>

        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px', padding: '0 6px' }}>
          MANAGEMENT
        </div>

        <Link
          href="/admin/listings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 90, 54, 0.12)',
            border: '1px solid var(--border-glow)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          <DollarSign size={15} color="var(--primary)" />
          Listings & Payouts
        </Link>

        <Link
          href="/admin/moderation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}
        >
          <Clock size={15} />
          Moderation Queue
        </Link>

        <Link
          href="/admin/featured"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}
        >
          <Star size={15} color="var(--accent-amber)" />
          Featured Slider
        </Link>

        <Link
          href="/organizer/check-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}
        >
          <Camera size={15} color="#10B981" />
          Gate QR Scanner
        </Link>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => {
              logout();
              router.push('/admin');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              color: '#EF4444',
              fontWeight: 600,
              fontSize: '0.85rem',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Event Listings & Subaccount Payouts</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Configure ticketing commission (Flat Fee / %), Paystack subaccounts, and Gate PINs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Filter Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setFilterType('event')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filterType === 'event' ? 'var(--primary)' : 'transparent',
                  color: filterType === 'event' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Events Only
              </button>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filterType === 'all' ? 'var(--primary)' : 'transparent',
                  color: filterType === 'all' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                All Listings
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 34px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '220px',
                }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>
          </div>
        </div>

        {/* Listings Table / Cards */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading event listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="glass-card-static" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px' }}>
            <CalendarDays size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No listings found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Try searching with a different keyword or toggle filter to "All Listings".
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listings.map((listing) => {
              const catConfig = CATEGORY_CONFIG[listing.category] || {
                label: listing.category,
                color: 'var(--primary)',
              };

              const hasCommissionConfigured =
                listing.eventDetails?.commissionValue !== undefined &&
                listing.eventDetails?.commissionValue !== null;

              return (
                <div
                  key={listing.id}
                  className="glass-card-static"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={listing.thumbnailUrl}
                      alt={listing.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Title & Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: catConfig.color, color: '#fff' }}>
                        {catConfig.label}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} />
                        {listing.neighborhood || listing.city}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {listing.listingType}
                      </span>
                      {listing.eventDetails?.subaccountCode && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 600 }}>
                          Subaccount: {listing.eventDetails.subaccountCode}
                        </span>
                      )}
                      {listing.eventDetails?.checkInPin && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 90, 54, 0.12)', color: 'var(--primary)', fontWeight: 600 }}>
                          Gate PIN: {listing.eventDetails.checkInPin}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {listing.listingType === 'event' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '10px',
                          }}
                          onClick={() => setSelectedCommissionListing(listing)}
                        >
                          <DollarSign size={14} />
                          <span>Commission & Payout</span>
                        </button>

                        <Link
                          href={`/organizer/check-in?event=${listing.id}`}
                          className="btn btn-secondary"
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '10px',
                          }}
                          title="Open Gate Entrance Scanner"
                        >
                          <Camera size={14} color="#10B981" />
                          <span>Gate Scanner</span>
                        </Link>
                      </>
                    )}

                    <Link
                      href={`/listings/${listing.id}`}
                      target="_blank"
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.82rem', borderRadius: '10px' }}
                      title="View Public Page"
                    >
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
            <button disabled={pagination.page <= 1} onClick={() => loadListings(pagination.page - 1)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadListings(pagination.page + 1)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Commission & Subaccount Modal */}
      {selectedCommissionListing && (
        <div
          onClick={() => setSelectedCommissionListing(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                onClick={() => setSelectedCommissionListing(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                }}
              >
                <X size={15} /> Close
              </button>
            </div>

            <AdminCommissionSettingsCard
              key={selectedCommissionListing.id}
              listing={selectedCommissionListing}
              onUpdateSuccess={(updatedDetails) => {
                setListings((prev) =>
                  prev.map((l) =>
                    l.id === selectedCommissionListing.id
                      ? {
                          ...l,
                          eventDetails: {
                            ...l.eventDetails,
                            ...updatedDetails,
                          },
                        }
                      : l
                  )
                );
                setSelectedCommissionListing((prev) =>
                  prev
                    ? {
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          ...updatedDetails,
                        },
                      }
                    : null
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
