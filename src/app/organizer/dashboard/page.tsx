'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api-client';
import { OrganizerEventSummary } from '@/types/api';
import OrganizerGuard from '@/components/organizer/OrganizerGuard';
import OrganizerNav from '@/components/organizer/OrganizerNav';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import {
  Calendar,
  MapPin,
  Ticket,
  Wallet,
  ArrowRight,
  Edit3,
  AlertTriangle,
  PlusCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState<OrganizerEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getOrganizerEvents();
      setEvents(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <OrganizerGuard>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #0a0d14)', display: 'flex', flexDirection: 'column' }}>
        <OrganizerNav />

        <main style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #f8fafc)',
                  margin: '0 0 0.35rem',
                  letterSpacing: '-0.02em',
                }}
              >
                My Events
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Overview of all your submitted events, ticket sales & payouts
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={fetchEvents}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Refresh list"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>

              <Link
                href="/submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff7354)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(255, 90, 54, 0.3)',
                }}
              >
                <PlusCircle size={16} />
                <span>Submit New Event</span>
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <Loader2 size={36} style={{ color: 'var(--primary, #ff5a36)', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div
              className="glass-card-static"
              style={{
                padding: '2rem',
                borderRadius: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 0.75rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#f87171' }}>Unable to load events</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>{error}</p>
              <button
                onClick={fetchEvents}
                style={{
                  padding: '8px 16px',
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

          {/* Empty State */}
          {!isLoading && !error && events.length === 0 && (
            <div
              className="glass-card-static"
              style={{
                padding: '4rem 2rem',
                borderRadius: '20px',
                textAlign: 'center',
                border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.15))',
                backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.5))',
              }}
            >
              <Calendar size={48} style={{ color: 'var(--primary, #ff5a36)', margin: '0 auto 1rem', opacity: 0.6 }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: '0 0 0.5rem' }}>
                No events found for this account
              </h2>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary, #94a3b8)',
                  maxWidth: '420px',
                  margin: '0 auto 1.5rem',
                }}
              >
                You haven&apos;t submitted any events under this email address yet, or they are still in the submission pipeline.
              </p>
              <Link
                href="/submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff7354)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                <PlusCircle size={16} />
                <span>Submit Your First Event</span>
              </Link>
            </div>
          )}

          {/* Events Grid */}
          {!isLoading && !error && events.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {events.map((event) => {
                const isApproved = event.status === 'approved';
                const isRejected = event.status === 'rejected';

                return (
                  <div
                    key={event.id}
                    className="glass-card-static"
                    style={{
                      borderRadius: '18px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                      backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    {/* Thumbnail banner */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '160px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        overflow: 'hidden',
                      }}
                    >
                      {event.thumbnailUrl ? (
                        <img
                          src={event.thumbnailUrl}
                          alt={event.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted, #64748b)',
                          }}
                        >
                          <Calendar size={40} style={{ opacity: 0.3 }} />
                        </div>
                      )}

                      {/* Status badge floating top-right */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <EventStatusBadge status={event.status} />
                      </div>

                      {/* City pill floating bottom-left */}
                      {event.city && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(10, 13, 20, 0.8)',
                            backdropFilter: 'blur(8px)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: 'var(--text-primary, #f8fafc)',
                          }}
                        >
                          <MapPin size={11} style={{ color: 'var(--primary, #ff5a36)' }} />
                          <span>{event.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          margin: '0 0 0.5rem',
                          color: 'var(--text-primary, #f8fafc)',
                          lineHeight: 1.3,
                        }}
                      >
                        {event.title}
                      </h3>

                      {/* Start Date */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.775rem',
                          color: 'var(--text-secondary, #94a3b8)',
                          marginBottom: '1rem',
                        }}
                      >
                        <Calendar size={13} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
                        <span>
                          {event.startDateTime
                            ? new Date(event.startDateTime).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Date not set'}
                        </span>
                      </div>

                      {/* Rejection notice if rejected */}
                      {isRejected && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontSize: '0.75rem',
                            color: '#f87171',
                            marginBottom: '1rem',
                          }}
                        >
                          <strong>Reason: </strong>
                          {event.rejectionReason || 'Check feedback in edit form.'}
                        </div>
                      )}

                      {/* Metrics (Tickets & Payout) */}
                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                          display: 'grid',
                          gridTemplateColumns: isApproved ? '1fr 1fr' : '1fr',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>Tickets Sold</div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: 'var(--text-primary, #f8fafc)',
                            }}
                          >
                            <Ticket size={14} style={{ color: 'var(--primary, #ff5a36)' }} />
                            <span>{event.totalTicketsSold ?? 0}</span>
                          </div>
                        </div>

                        {isApproved && (
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>Your Payout</div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: '#10b981',
                              }}
                            >
                              <Wallet size={14} />
                              <span>₦{(event.organizerPayout ?? 0).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{
                          marginTop: '1.25rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.65rem',
                        }}
                      >
                        <Link
                          href={`/organizer/events/${event.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 90, 54, 0.15)',
                            color: 'var(--primary, #ff5a36)',
                            border: '1px solid rgba(255, 90, 54, 0.3)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <span>Analytics</span>
                          <ArrowRight size={13} />
                        </Link>

                        <Link
                          href={`/organizer/events/${event.id}/edit`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary, #94a3b8)',
                            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      <style jsx>{`
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

