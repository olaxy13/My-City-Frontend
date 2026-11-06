'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { OrganizerEventAnalytics } from '@/types/api';
import OrganizerGuard from '@/components/organizer/OrganizerGuard';
import OrganizerNav from '@/components/organizer/OrganizerNav';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import RevenueBreakdownCard from '@/components/organizer/RevenueBreakdownCard';
import TicketTierTable from '@/components/organizer/TicketTierTable';
import SalesChart from '@/components/organizer/SalesChart';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ShoppingBag,
  Edit3,
  QrCode,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function OrganizerEventAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [analytics, setAnalytics] = useState<OrganizerEventAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getOrganizerEventAnalytics(id);
      setAnalytics(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load event analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  return (
    <OrganizerGuard>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #0a0d14)', display: 'flex', flexDirection: 'column' }}>
        <OrganizerNav />

        <main style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>
          {/* Breadcrumb / Back button */}
          <div style={{ marginBottom: '1.25rem' }}>
            <Link
              href="/organizer/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.825rem',
                color: 'var(--text-secondary, #94a3b8)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to all events</span>
            </Link>
          </div>

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
              <Loader2 size={36} style={{ color: 'var(--primary, #ff5a36)', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {!isLoading && error && (
            <div
              className="glass-card-static"
              style={{
                padding: '2.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 0.75rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#f87171' }}>Failed to load event data</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>{error}</p>
              <button
                onClick={fetchAnalytics}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && analytics && (
            <div>
              {/* Header Details */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <h1
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: 'var(--text-primary, #f8fafc)',
                        margin: 0,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {analytics.listing.title}
                    </h1>
                    <EventStatusBadge status={analytics.listing.status} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary, #94a3b8)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} style={{ color: 'var(--primary, #ff5a36)' }} />
                      {(typeof analytics.listing.city === 'object' ? (analytics.listing.city as any)?.name : analytics.listing.city) || 'Location'}
                      {analytics.listing.neighborhood && `, ${analytics.listing.neighborhood}`}
                    </span>

                    {analytics.listing.eventDetails?.startDateTime && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
                        {new Date(analytics.listing.eventDetails.startDateTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}

                    <Link
                      href={`/listings/${analytics.listing.id}`}
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent-cyan, #06b6d4)',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span>Public Listing</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <Link
                    href={`/organizer/events/${id}/attendees`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-primary, #f8fafc)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Users size={14} />
                    <span>View Attendees</span>
                  </Link>

                  <Link
                    href={`/organizer/events/${id}/orders`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-primary, #f8fafc)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <ShoppingBag size={14} />
                    <span>View Orders</span>
                  </Link>

                  <Link
                    href={`/organizer/check-in`}
                    target="_blank"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <QrCode size={14} />
                    <span>Gate Scanner</span>
                  </Link>

                  <Link
                    href={`/organizer/events/${id}/edit`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 90, 54, 0.15)',
                      border: '1px solid rgba(255, 90, 54, 0.3)',
                      color: 'var(--primary, #ff5a36)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Listing</span>
                  </Link>
                </div>
              </div>

              {/* Top 4 Stat Cards */}
              <div style={{ marginBottom: '2rem' }}>
                <RevenueBreakdownCard
                  gross={analytics.revenue.gross}
                  platformFee={analytics.revenue.platformFee}
                  organizerPayout={analytics.revenue.organizerPayout}
                  totalOrders={analytics.revenue.totalOrders}
                />
              </div>

              {/* Middle Section: Ticket Tiers & Attendance Progress */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
                className="analytics-middle-grid"
              >
                {/* Ticket Tier Breakdown */}
                <div>
                  <TicketTierTable tiers={analytics.tiers} />
                </div>

                {/* Attendance Ring Card */}
                <div
                  className="glass-card-static"
                  style={{
                    borderRadius: '16px',
                    border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                    backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Users size={18} style={{ color: 'var(--primary, #ff5a36)' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
                      Gate Check-In Rate
                    </h3>
                  </div>

                  {/* Circular progress visual */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                    <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                      <svg width="130" height="130" viewBox="0 0 130 130">
                        {/* Background circle */}
                        <circle
                          cx="65"
                          cy="65"
                          r="52"
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeWidth="10"
                        />
                        {/* Foreground circle */}
                        <circle
                          cx="65"
                          cy="65"
                          r="52"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="10"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={
                            2 * Math.PI * 52 * (1 - (analytics.attendance.checkInRate || 0) / 100)
                          }
                          strokeLinecap="round"
                          transform="rotate(-90 65 65)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
                          {analytics.attendance.checkInRate || 0}%
                        </span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                          Arrived
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Numbers */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>Checked In</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                        {analytics.attendance.checkedIn || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>Tickets Issued</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                        {analytics.attendance.totalTicketsIssued || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Sales Chart (Only for Approved listings) */}
              {analytics.listing.status === 'approved' && (
                <div>
                  <SalesChart data={analytics.salesByDay || []} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .analytics-middle-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </OrganizerGuard>
  );
}
