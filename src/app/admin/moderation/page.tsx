'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { ListingDetail, ListingStatus, ListingType } from '@/types/api';
import { CATEGORY_CONFIG, formatEventDate, formatEventTime } from '@/lib/utils';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Check,
  X,
  MessageSquare,
  Star,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Loader2,
  LogOut,
  FileText,
  MapPin,
  Phone,
  Mail,
  Compass,
  ExternalLink,
  Images,
  CalendarDays,
  Repeat,
  UtensilsCrossed,
  Building2,
  DollarSign,
  ImageOff,
  Hash,
  Copy,
} from 'lucide-react';

type ModerationTab = 'pending' | 'needs_changes' | 'approved' | 'rejected';

const TAB_CONFIG: Record<
  ModerationTab,
  { label: string; color: string; icon: React.ReactNode; badgeStyle: string }
> = {
  pending: {
    label: 'Pending Review',
    color: 'var(--accent-amber)',
    icon: <Clock size={15} />,
    badgeStyle: 'background: rgba(245, 158, 11, 0.2); color: #F59E0B;',
  },
  needs_changes: {
    label: 'Needs Changes',
    color: 'var(--accent-cyan)',
    icon: <AlertTriangle size={15} />,
    badgeStyle: 'background: rgba(6, 182, 212, 0.2); color: #06B6D4;',
  },
  approved: {
    label: 'Approved',
    color: 'var(--accent-emerald)',
    icon: <CheckCircle size={15} />,
    badgeStyle: 'background: rgba(16, 185, 129, 0.2); color: #10B981;',
  },
  rejected: {
    label: 'Rejected',
    color: '#EF4444',
    icon: <XCircle size={15} />,
    badgeStyle: 'background: rgba(239, 68, 68, 0.2); color: #EF4444;',
  },
};

export default function ModerationPage() {
  const router = useRouter();
  const { isAuthenticated, admin, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<ModerationTab>('pending');
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [tabCounts, setTabCounts] = useState<Record<ModerationTab, number>>({
    pending: 0,
    needs_changes: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'changes' | null;
    listingId: string;
  }>({ type: null, listingId: '' });
  const [actionNotes, setActionNotes] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    loadListings();
  }, [activeTab, searchQuery]);

  async function loadListings(page = 1) {
    setIsLoading(true);
    try {
      const res = await api.getAdminListings({
        status: activeTab,
        search: searchQuery.trim() || undefined,
        page,
        limit: 12,
      });
      setListings(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load admin listings:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Load tab counts
  useEffect(() => {
    async function loadCounts() {
      const tabs: ModerationTab[] = ['pending', 'needs_changes', 'approved', 'rejected'];
      const counts: Record<ModerationTab, number> = {
        pending: 0,
        needs_changes: 0,
        approved: 0,
        rejected: 0,
      };
      await Promise.all(
        tabs.map(async (tab) => {
          try {
            const res = await api.getAdminListings({ status: tab, limit: 1 });
            counts[tab] = res.pagination?.total || 0;
          } catch {
            // ignore
          }
        })
      );
      setTabCounts(counts);
    }
    loadCounts();
  }, [listings]);

  const openDrawer = async (listing: ListingDetail) => {
    setSelectedListing(listing);
    setIsDrawerLoading(true);
    try {
      const detail = await api.getAdminListingDetail(listing.id);
      setSelectedListing(detail);
    } catch {
      // use existing data
    } finally {
      setIsDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedListing(null);
    setActionModal({ type: null, listingId: '' });
    setActionNotes('');
    setActionError('');
  };

  const openActionModal = (type: 'approve' | 'reject' | 'changes', listingId: string) => {
    setActionModal({ type, listingId });
    setActionNotes('');
    setActionError('');
  };

  const handleAction = async () => {
    if (!actionModal.type || !actionModal.listingId) return;

    if ((actionModal.type === 'reject' || actionModal.type === 'changes') && !actionNotes.trim()) {
      setActionError('Please enter a reason / notes before submitting.');
      return;
    }

    setIsActionLoading(true);
    setActionError('');

    try {
      if (actionModal.type === 'approve') {
        await api.approveListing(actionModal.listingId);
      } else if (actionModal.type === 'reject') {
        await api.rejectListing(actionModal.listingId, actionNotes.trim());
      } else if (actionModal.type === 'changes') {
        await api.requestChanges(actionModal.listingId, actionNotes.trim());
      }

      closeDrawer();
      await loadListings();
    } catch (err: any) {
      setActionError(err.message || 'Action failed. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTogglePublish = async (listing: ListingDetail) => {
    try {
      await api.togglePublishStatus(listing.id, !listing.isPublished);
      setSelectedListing((prev) => prev ? { ...prev, isPublished: !prev.isPublished } : null);
      await loadListings();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleToggleFeatured = async (listing: ListingDetail) => {
    try {
      await api.toggleFeatured(listing.id, !listing.isFeatured);
      setSelectedListing((prev) => prev ? { ...prev, isFeatured: !prev.isFeatured } : null);
      await loadListings();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 76px)', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
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
        {/* Admin Info */}
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
          MODERATION QUEUE
        </div>

        {(['pending', 'needs_changes', 'approved', 'rejected'] as ModerationTab[]).map((tab) => {
          const cfg = TAB_CONFIG[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => {
                setActiveTab(tab);
                closeDrawer();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255, 90, 54, 0.12)' : 'transparent',
                border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }}>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                {cfg.label}
              </div>
              {tabCounts[tab] > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
          <Link
            href="/admin/featured"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <Star size={15} color="var(--accent-amber)" />
            Featured Slider
          </Link>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { logout(); router.push('/admin'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              color: '#EF4444',
              fontWeight: 600,
              fontSize: '0.85rem',
              width: '100%',
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Moderation Area */}
      <main style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
              {TAB_CONFIG[activeTab].label}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {pagination.total} total listings • Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '220px', fontSize: '0.85rem' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button onClick={() => loadListings()} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Listings Table */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={32} color="var(--primary)" className="glow-animation" />
          </div>
        ) : listings.length === 0 ? (
          <div className="glass-card-static" style={{ padding: '60px', textAlign: 'center', borderRadius: '20px' }}>
            <ShieldAlert size={40} color="var(--text-muted)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
              No {TAB_CONFIG[activeTab].label} Listings
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              All caught up! No listings are waiting in this queue.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listings.map((listing) => {
              const catConfig = CATEGORY_CONFIG[listing.category] || { label: listing.category, color: '#FF5A36' };
              return (
                <div
                  key={listing.id}
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    border: selectedListing?.id === listing.id ? '1.5px solid var(--primary)' : '1px solid var(--border-card)',
                    transform: 'none',
                  }}
                  onClick={() => openDrawer(listing)}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
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

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: catConfig.color, color: '#fff' }}>
                        {catConfig.label}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} />
                        {listing.neighborhood}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {listing.listingType}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(listing.createdAt).toLocaleDateString('en-NG')}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {listing.isPublished !== undefined && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: listing.isPublished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: listing.isPublished ? '#10B981' : 'var(--text-muted)' }}>
                        {listing.isPublished ? 'LIVE' : 'HIDDEN'}
                      </span>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={(e) => { e.stopPropagation(); openDrawer(listing); }}
                    >
                      <Eye size={14} />
                      Review
                    </button>
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

      {/* Review Drawer */}
      {selectedListing && (
        <aside
          className="glass-card-static"
          style={{
            width: '480px',
            flexShrink: 0,
            borderRadius: 0,
            borderLeft: '1px solid var(--border-color)',
            padding: '0',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky Drawer Header */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
                Full Listing Review
              </div>
              <h3 style={{ fontSize: '1.05rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedListing.title}
              </h3>
            </div>
            <button onClick={closeDrawer} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '12px', marginTop: '2px' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '20px', flex: 1 }}>
            {isDrawerLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Loader2 size={28} color="var(--primary)" className="glow-animation" />
                <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading full details...</div>
              </div>
            ) : (
              <>
                {/* Cover Thumbnail */}
                <div
                  style={{
                    width: '100%',
                    height: '220px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    marginBottom: '14px',
                    background: 'var(--bg-secondary)',
                    position: 'relative',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {selectedListing.thumbnailUrl ? (
                    <img
                      src={selectedListing.thumbnailUrl}
                      alt={selectedListing.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'zoom-in',
                      }}
                      onClick={() => setLightboxUrl(selectedListing.thumbnailUrl)}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <ImageOff size={32} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        No cover image uploaded
                      </span>
                    </div>
                  )}
                  {selectedListing.thumbnailUrl && (
                    <div
                      onClick={() => setLightboxUrl(selectedListing.thumbnailUrl)}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={12} /> Click to zoom
                    </div>
                  )}
                </div>

                {/* Status & Type Badges Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background:
                        selectedListing.listingType === 'event'
                          ? 'rgba(244,63,94,0.15)'
                          : selectedListing.listingType === 'restaurant'
                          ? 'rgba(249,115,22,0.15)'
                          : 'rgba(16,185,129,0.15)',
                      color:
                        selectedListing.listingType === 'event'
                          ? '#f43f5e'
                          : selectedListing.listingType === 'restaurant'
                          ? '#f97316'
                          : '#10b981',
                      border: `1px solid ${
                        selectedListing.listingType === 'event'
                          ? 'rgba(244,63,94,0.3)'
                          : selectedListing.listingType === 'restaurant'
                          ? 'rgba(249,115,22,0.3)'
                          : 'rgba(16,185,129,0.3)'
                      }`,
                    }}
                  >
                    {selectedListing.listingType}
                  </span>
                  {selectedListing.categoryLabel && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--bg-input)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {selectedListing.categoryLabel}
                    </span>
                  )}
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background:
                        selectedListing.status === 'approved'
                          ? 'rgba(16,185,129,0.15)'
                          : selectedListing.status === 'pending'
                          ? 'rgba(245,158,11,0.15)'
                          : selectedListing.status === 'needs_changes'
                          ? 'rgba(6,182,212,0.15)'
                          : 'rgba(239,68,68,0.15)',
                      color:
                        selectedListing.status === 'approved'
                          ? '#10b981'
                          : selectedListing.status === 'pending'
                          ? '#f59e0b'
                          : selectedListing.status === 'needs_changes'
                          ? '#06b6d4'
                          : '#ef4444',
                    }}
                  >
                    ● {selectedListing.status.toUpperCase().replace('_', ' ')}
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: selectedListing.isPublished
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(148,163,184,0.15)',
                      color: selectedListing.isPublished ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    {selectedListing.isPublished ? '● LIVE' : '● HIDDEN'}
                  </span>
                  {selectedListing.isFeatured && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                      }}
                    >
                      ⭐ FEATURED
                    </span>
                  )}
                </div>

                {/* Core Location & Listing Details */}
                <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em' }}>
                    LOCATION & IDENTIFICATION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'City', value: selectedListing.city },
                      { label: 'Neighborhood', value: selectedListing.neighborhood },
                      { label: 'Exact Address', value: selectedListing.address },
                      {
                        label: 'GPS Coordinates',
                        value: selectedListing.latitude && selectedListing.longitude
                          ? `${Number(selectedListing.latitude).toFixed(5)}, ${Number(selectedListing.longitude).toFixed(5)}`
                          : undefined,
                        mono: true,
                        small: true,
                      },
                      { label: 'Listing ID', value: selectedListing.id, mono: true, small: true },
                      { label: 'Submitted Date', value: new Date(selectedListing.createdAt).toLocaleString('en-NG') },
                    ].filter((r) => r.value).map((row) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all', fontFamily: (row as any).mono ? 'monospace' : 'inherit', fontSize: (row as any).small ? '0.73rem' : 'inherit', color: 'var(--text-primary)' }}>
                          {row.value}
                        </span>
                      </div>
                    ))}

                    {/* Google Maps link */}
                    <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                      <a
                        href={
                          selectedListing.latitude && selectedListing.longitude
                            ? `https://www.google.com/maps/search/?api=1&query=${selectedListing.latitude},${selectedListing.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedListing.title}, ${selectedListing.neighborhood || ''}, ${selectedListing.city}`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        <MapPin size={12} /> Open Location in Google Maps
                      </a>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                    DESCRIPTION
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', whiteSpace: 'pre-line' }}>
                    {selectedListing.description}
                  </p>
                </div>

                {/* Submitter Info & Contacts */}
                <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em' }}>
                    SUBMITTER & CONTACT CHANNELS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Submitter:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedListing.submitterName || 'Not specified'}</strong>
                    </div>

                    {selectedListing.submitterEmail && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                        <a href={`mailto:${selectedListing.submitterEmail}`} style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {selectedListing.submitterEmail}
                        </a>
                      </div>
                    )}

                    {selectedListing.submitterPhone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Submitter Phone:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a href={`tel:${selectedListing.submitterPhone}`} style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} /> {selectedListing.submitterPhone}
                          </a>
                          <a
                            href={`https://wa.me/${selectedListing.submitterPhone.replace(/[^0-9]/g, '').startsWith('0') ? `234${selectedListing.submitterPhone.replace(/[^0-9]/g, '').slice(1)}` : selectedListing.submitterPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedListing.submitterName}! Regarding your listing "${selectedListing.title}" on City Discovery:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#25D366', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedListing.contactPhone && selectedListing.contactPhone !== selectedListing.submitterPhone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Listing Public Phone:</span>
                        <a href={`tel:${selectedListing.contactPhone}`} style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {selectedListing.contactPhone}
                        </a>
                      </div>
                    )}

                    {selectedListing.contactEmail && selectedListing.contactEmail !== selectedListing.submitterEmail && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Listing Public Email:</span>
                        <a href={`mailto:${selectedListing.contactEmail}`} style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {selectedListing.contactEmail}
                        </a>
                      </div>
                    )}

                    {selectedListing.externalLink && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Website / Link:</span>
                        <a
                          href={selectedListing.externalLink.startsWith('http') ? selectedListing.externalLink : `https://${selectedListing.externalLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          <ExternalLink size={12} /> {selectedListing.externalLink}
                        </a>
                      </div>
                    )}

                    {/* Submitter Edit Token & Link */}
                    {selectedListing.editToken && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          SUBMITTER DIRECT EDIT URL
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/resubmit/${selectedListing.id}?editToken=${selectedListing.editToken}`}
                            style={{
                              flex: 1,
                              fontSize: '0.72rem',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-muted)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/resubmit/${selectedListing.id}?editToken=${selectedListing.editToken}`
                              );
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiedLink ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                            {copiedLink ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                {selectedListing.eventDetails && (
                  <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f43f5e', marginBottom: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={13} /> EVENT SCHEDULE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Start Date & Time</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedListing.eventDetails.startDateTime
                            ? `${formatEventDate(selectedListing.eventDetails.startDateTime)} at ${formatEventTime(selectedListing.eventDetails.startDateTime)}`
                            : '—'}
                        </span>
                      </div>
                      {selectedListing.eventDetails.endDateTime && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>End Date & Time</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {`${formatEventDate(selectedListing.eventDetails.endDateTime)} at ${formatEventTime(selectedListing.eventDetails.endDateTime)}`}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Recurring</span>
                        <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: selectedListing.eventDetails.isRecurring ? '#f59e0b' : 'var(--text-muted)' }}>
                          {selectedListing.eventDetails.isRecurring ? <><Repeat size={12} /> Yes (Recurring)</> : 'No (One-off)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Restaurant Details */}
                {selectedListing.restaurantDetails && (
                  <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f97316', marginBottom: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UtensilsCrossed size={13} /> RESTAURANT DETAILS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem' }}>
                      {[
                        { label: 'Cuisine', value: selectedListing.restaurantDetails.cuisineType },
                        { label: 'Price Range', value: selectedListing.restaurantDetails.priceRange },
                        { label: 'Operating Hours', value: selectedListing.restaurantDetails.operatingHours },
                        { label: 'Menu Link', value: selectedListing.restaurantDetails.menuLink },
                        { label: 'CAC Registration Number', value: selectedListing.restaurantDetails.cacNumber },
                        { label: 'Operating License Number', value: selectedListing.restaurantDetails.licenseNumber },
                      ].filter((r) => r.value).map((row) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                          <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facility Details */}
                {selectedListing.facilityDetails && (
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', marginBottom: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={13} /> FACILITY DETAILS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem' }}>
                      {[
                        { label: 'Facility Category', value: selectedListing.facilityDetails.facilityCategory },
                        { label: 'Operating Hours', value: selectedListing.facilityDetails.operatingHours },
                        { label: '24/7 Emergency Line', value: selectedListing.facilityDetails.emergencyContact },
                        { label: 'CAC Registration Number', value: selectedListing.facilityDetails.cacNumber },
                        { label: 'Health / Practice License', value: selectedListing.facilityDetails.licenseNumber },
                      ].filter((r) => r.value).map((row) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                          <span style={{ fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery Images */}
                {selectedListing.images && selectedListing.images.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Images size={13} /> GALLERY PHOTOS ({selectedListing.images.length})
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                        Click to enlarge
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {selectedListing.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          onClick={() => setLightboxUrl(img.imageUrl)}
                          style={{
                            aspectRatio: '1/1',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: 'var(--bg-secondary)',
                            cursor: 'zoom-in',
                            position: 'relative',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <img
                            src={img.imageUrl}
                            alt={`Gallery ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Documents */}
                {selectedListing.legalDocumentUrls && selectedListing.legalDocumentUrls.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={13} /> LEGAL & VERIFICATION DOCUMENTS ({selectedListing.legalDocumentUrls.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedListing.legalDocumentUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            color: 'var(--accent-emerald)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <FileText size={16} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Verification Document #{idx + 1}
                            </span>
                          </div>
                          <ExternalLink size={14} style={{ flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes / Rejection Reason (if any) */}
                {(selectedListing.adminNotes || selectedListing.rejectionReason) && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', marginBottom: '8px', letterSpacing: '0.06em' }}>
                      PREVIOUS ADMIN NOTES
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {selectedListing.adminNotes || selectedListing.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Action Modal inside Drawer */}
                {actionModal.type && actionModal.listingId === selectedListing.id && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px', color: actionModal.type === 'approve' ? '#10B981' : actionModal.type === 'reject' ? '#EF4444' : '#06B6D4' }}>
                      {actionModal.type === 'approve' ? '✅ Confirm Approval' : actionModal.type === 'reject' ? '❌ Rejection Reason' : '📝 Request Changes Notes'}
                    </div>
                    {(actionModal.type === 'reject' || actionModal.type === 'changes') && (
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder={actionModal.type === 'reject' ? 'Provide a clear, professional rejection reason...' : 'Describe what needs to be corrected or improved...'}
                        value={actionNotes}
                        onChange={(e) => { setActionNotes(e.target.value); setActionError(''); }}
                        style={{ marginBottom: '10px', fontSize: '0.85rem' }}
                      />
                    )}
                    {actionError && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '8px' }}>{actionError}</div>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleAction}
                        disabled={isActionLoading}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: actionModal.type === 'approve' ? 'linear-gradient(135deg, #10B981, #34D399)' : actionModal.type === 'reject' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #06B6D4, #0284C7)' }}
                      >
                        {isActionLoading ? <Loader2 size={14} className="glow-animation" /> : <Check size={14} />}
                        {isActionLoading ? 'Processing...' : 'Confirm'}
                      </button>
                      <button onClick={() => setActionModal({ type: null, listingId: '' })} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Moderation Action Buttons */}
                {selectedListing.status !== 'approved' && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em' }}>MODERATION ACTIONS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => openActionModal('approve', selectedListing.id)}
                        className="btn"
                        style={{ padding: '10px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.15))', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', fontWeight: 700 }}
                      >
                        <CheckCircle size={16} />
                        <span>Approve & Publish Listing</span>
                      </button>
                      <button
                        onClick={() => openActionModal('changes', selectedListing.id)}
                        className="btn"
                        style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', fontWeight: 700 }}
                      >
                        <MessageSquare size={16} />
                        <span>Request Changes from Submitter</span>
                      </button>
                      <button
                        onClick={() => openActionModal('reject', selectedListing.id)}
                        className="btn"
                        style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', fontWeight: 700 }}
                      >
                        <XCircle size={16} />
                        <span>Reject Submission</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Publish Toggle & Featured Toggle (for approved listings) */}
                {selectedListing.status === 'approved' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.06em' }}>
                      VISIBILITY & FEATURED
                    </div>

                    <button
                      onClick={() => handleTogglePublish(selectedListing)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        {selectedListing.isPublished ? 'Currently LIVE (Published)' : 'Currently HIDDEN (Unpublished)'}
                      </span>
                      {selectedListing.isPublished ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                    </button>

                    {(selectedListing.listingType === 'event') && (
                      <button
                        onClick={() => handleToggleFeatured(selectedListing)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: selectedListing.isFeatured ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                          border: selectedListing.isFeatured ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: selectedListing.isFeatured ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                          {selectedListing.isFeatured ? '⭐ Featured in Hero Slider' : 'Not Featured (Auto-ordered)'}
                        </span>
                        {selectedListing.isFeatured ? <ToggleRight size={22} color="var(--accent-amber)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      )}
      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 10,
              }}
            >
              <X size={20} />
            </button>
            <img
              src={lightboxUrl}
              alt="Expanded preview"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
