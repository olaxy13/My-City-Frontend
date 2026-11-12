'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { OrganizerOrder, PaginatedResponse } from '@/types/api';
import OrganizerGuard from '@/components/organizer/OrganizerGuard';
import OrganizerNav from '@/components/organizer/OrganizerNav';
import { EmptyStateFrame, EMPTY_STATE_MIN_HEIGHT, TableSkeleton } from '@/components/ui/Skeletons';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import {
  ArrowLeft,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default function OrganizerOrdersPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useOrganizerAuth();

  const [orders, setOrders] = useState<OrganizerOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchOrders = async (targetPage = 1) => {
    if (!id) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getOrganizerOrders(id, { page: targetPage, limit: 20 });
      // In case backend wraps in { data, pagination } or directly returns
      const orderList = (res as any)?.data || (Array.isArray(res) ? res : []);
      const pageInfo = (res as any)?.pagination || {
        page: targetPage,
        limit: 20,
        total: orderList.length,
        totalPages: 1,
      };

      if (requestId !== requestIdRef.current) return;
      setOrders(orderList);
      setPagination(pageInfo);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || 'Failed to load orders. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }
  };

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    setHasLoaded(false);
    fetchOrders(1);
  }, [id, isAuthLoading, isAuthenticated]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchOrders(newPage);
  };

  return (
    <OrganizerGuard>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #0a0d14)', display: 'flex', flexDirection: 'column' }}>
        <OrganizerNav />

        <main style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>
          {/* Top Bar */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              href={`/organizer/events/${id}`}
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
              <span>Back to Event Analytics</span>
            </Link>

            <button
              onClick={() => fetchOrders(pagination.page)}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={isLoading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
              <ShoppingBag size={20} style={{ color: 'var(--primary, #ff5a36)' }} />
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #f8fafc)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Event Orders
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
              Complete record of ticket checkout transactions, platform commissions and payout splits
            </p>
          </div>

          {(isLoading || !hasLoaded) && orders.length === 0 && !error ? (
            <TableSkeleton rows={8} />
          ) : error && orders.length === 0 && hasLoaded ? (
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
              <h3 style={{ margin: '0 0 0.5rem', color: '#f87171' }}>Unable to load orders</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>{error}</p>
              <button
                onClick={() => fetchOrders(pagination.page)}
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
          ) : orders.length === 0 ? (
            <EmptyStateFrame
              minHeight={EMPTY_STATE_MIN_HEIGHT.table}
              style={{
                borderRadius: '16px',
                border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
              }}
            >
              <ShoppingBag size={40} style={{ marginBottom: '1rem', color: 'var(--primary, #ff5a36)', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--text-primary, #f8fafc)', margin: '0 0 0.5rem' }}>No orders yet</h3>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', margin: 0 }}>
                Orders will appear here as attendees purchase tickets.
              </p>
            </EmptyStateFrame>
          ) : (
            <div
              className="glass-card-static"
              style={{
                borderRadius: '16px',
                border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                overflow: 'hidden',
                opacity: isLoading ? 0.55 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                        color: 'var(--text-muted, #64748b)',
                        fontSize: '0.725rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <th style={{ padding: '0.85rem 1.25rem' }}>Reference</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Tickets</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Total</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Platform Fee</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Your Payout</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const isPaid = order.status === 'PAID';
                      const isPending = order.status === 'PENDING';
                      const isFailed = order.status === 'FAILED';

                      const itemsSummary = (order.items || [])
                        .map((it) => `${it.quantity}x ${it.tierName}`)
                        .join(', ');

                      return (
                        <tr
                          key={order.id || order.reference}
                          style={{
                            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.04))',
                          }}
                        >
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <code
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                fontSize: '0.75rem',
                                color: 'var(--text-primary, #f8fafc)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {order.reference}
                            </code>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                              {order.customerName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>
                              {order.customerEmail}
                            </div>
                            {order.customerPhone && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
                                {order.customerPhone}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.8rem', maxWidth: '200px' }}>
                            {itemsSummary || '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                            ₦{(order.totalAmount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#f59e0b', fontSize: '0.8rem' }}>
                            ₦{(order.commission || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#10b981' }}>
                            ₦{(order.organizerAmount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {isPaid ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.725rem',
                                  fontWeight: 600,
                                  color: '#10b981',
                                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                              >
                                <CheckCircle2 size={12} />
                                PAID
                              </span>
                            ) : isPending ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.725rem',
                                  fontWeight: 600,
                                  color: '#f59e0b',
                                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                }}
                              >
                                <Clock size={12} />
                                PENDING
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.725rem',
                                  fontWeight: 600,
                                  color: '#ef4444',
                                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                }}
                              >
                                <XCircle size={12} />
                                FAILED
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.75rem' }}>
                            {order.paidAt
                              ? new Date(order.paidAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders total)
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        color: pagination.page <= 1 ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.775rem',
                      }}
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        color: pagination.page >= pagination.totalPages ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.775rem',
                      }}
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
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

