'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { ListingDetail } from '@/types/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import {
  Star,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  ShieldAlert,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

export default function FeaturedAdminPage() {
  const router = useRouter();
  const { isAuthenticated, admin, logout } = useAuth();

  const [featuredListings, setFeaturedListings] = useState<ListingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    setIsLoading(true);
    try {
      const res = await api.getAdminListings({ status: 'approved', limit: 50 });
      const featured = (res.data || [])
        .filter((l) => l.isFeatured)
        .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
      setFeaturedListings(featured);
    } catch (err) {
      console.error('Failed to load featured listings:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    const newList = [...featuredListings];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    setFeaturedListings(newList);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const orderedIds = featuredListings.map((l) => l.id);
      await api.reorderFeatured(orderedIds);
      setSaveMessage('Hero slider order saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      await loadFeatured();
    } catch (err: any) {
      setSaveMessage('Failed to save order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeatured = async (listing: ListingDetail) => {
    try {
      await api.toggleFeatured(listing.id, !listing.isFeatured, listing.featuredOrder || 0);
      await loadFeatured();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 76px)' }}>
      {/* Sidebar */}
      <aside
        className="glass-card-static"
        style={{
          width: '260px',
          flexShrink: 0,
          borderRadius: 0,
          borderRight: '1px solid var(--border-color)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-input)', marginBottom: '16px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>{admin?.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{admin?.role}</div>
        </div>

        <Link href="/admin/moderation" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', borderRadius: '10px' }}>
          <Clock size={15} color="var(--accent-amber)" />
          Moderation Queue
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(255, 90, 54, 0.12)',
            border: '1px solid var(--border-glow)',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
          }}
        >
          <Star size={15} color="var(--accent-amber)" />
          Featured Slider
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { logout(); router.push('/admin'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', color: '#EF4444', fontWeight: 600, fontSize: '0.85rem', width: '100%' }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
              ⭐ Hero Countdown Slider Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Push events to the homepage countdown hero slider. Featured events appear first sorted by date; others fill automatically.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saveMessage && (
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: saveMessage.includes('success') ? '#10B981' : '#EF4444' }}>
                {saveMessage}
              </div>
            )}
            <button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.9rem' }}
            >
              {isSaving ? <Loader2 size={16} className="glow-animation" /> : <Star size={16} />}
              <span>Save Slider Order</span>
            </button>
          </div>
        </div>

        {/* Featured Logic Explanation */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '28px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--accent-amber)' }}>Slider Logic:</strong> Featured (pushed) events appear first in the slider, sorted by soonest upcoming <code>startDateTime</code>. Remaining slots fill automatically with the next upcoming events. Toggle "Featured" off to remove an event from the pushed slots.
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={32} color="var(--primary)" className="glow-animation" />
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="glass-card-static" style={{ padding: '60px', textAlign: 'center', borderRadius: '20px' }}>
            <Star size={40} color="var(--text-muted)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Pushed Featured Events</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The slider populates automatically with the soonest upcoming events. Use the Moderation page to push specific events to the top of the slider.
            </p>
            <Link href="/admin/moderation" className="btn btn-primary">
              Go to Moderation Queue
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {featuredListings.map((listing, idx) => {
              const catConfig = CATEGORY_CONFIG[listing.category] || { label: listing.category, color: '#FF5A36' };
              return (
                <div
                  key={listing.id}
                  className="glass-card-static"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent)',
                  }}
                >
                  {/* Order Indicator */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Thumbnail */}
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={listing.thumbnailUrl} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Title & Meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.title}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: catConfig.color, color: '#fff' }}>
                        {catConfig.label}
                      </span>
                      {listing.eventDetails?.startDateTime && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          📅 {new Date(listing.eventDetails.startDateTime).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reorder Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      style={{ padding: '4px 8px', borderRadius: '6px', background: idx === 0 ? 'transparent' : 'var(--bg-input)', opacity: idx === 0 ? 0.3 : 1, color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                      title="Move up in slider"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === featuredListings.length - 1}
                      style={{ padding: '4px 8px', borderRadius: '6px', background: idx === featuredListings.length - 1 ? 'transparent' : 'var(--bg-input)', opacity: idx === featuredListings.length - 1 ? 0.3 : 1, color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                      title="Move down in slider"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Remove from Featured */}
                  <button
                    onClick={() => handleToggleFeatured(listing)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: 'var(--accent-amber)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Remove from featured slider"
                  >
                    <ToggleRight size={16} />
                    <span>Featured</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
