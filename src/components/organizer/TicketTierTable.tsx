'use client';

import React from 'react';
import { OrganizerTierStats } from '@/types/api';
import { Ticket, Users } from 'lucide-react';

interface TicketTierTableProps {
  tiers: OrganizerTierStats[];
}

export default function TicketTierTable({ tiers }: TicketTierTableProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <div
        className="glass-card-static"
        style={{
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          color: 'var(--text-muted, #64748b)',
        }}
      >
        <Ticket size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <p>No ticket tiers configured for this event.</p>
      </div>
    );
  }

  return (
    <div
      className="glass-card-static"
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
        backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
      }}
    >
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ticket size={18} style={{ color: 'var(--primary, #ff5a36)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
            Ticket Tiers Performance
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
          {tiers.length} {tiers.length === 1 ? 'tier' : 'tiers'}
        </span>
      </div>

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
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.85rem 1.25rem' }}>Tier Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Price</th>
              <th style={{ padding: '0.85rem 1rem' }}>Sold</th>
              <th style={{ padding: '0.85rem 1rem' }}>Capacity</th>
              <th style={{ padding: '0.85rem 1rem' }}>Remaining</th>
              <th style={{ padding: '0.85rem 1rem' }}>Revenue</th>
              <th style={{ padding: '0.85rem 1.25rem', minWidth: '140px' }}>Availability</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => {
              const capacity = tier.totalCapacity || 0;
              const sold = tier.soldCount || 0;
              const percentSold = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
              const isSoldOut = capacity > 0 && sold >= capacity;

              return (
                <tr
                  key={tier.id}
                  style={{
                    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.04))',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                    {tier.name}
                  </td>
                  <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    {tier.price === 0 ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Free</span>
                    ) : (
                      `₦${tier.price.toLocaleString()}`
                    )}
                  </td>
                  <td style={{ padding: '1rem 1rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                    {sold.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    {capacity.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <span
                      style={{
                        color: isSoldOut ? '#ef4444' : tier.remaining < 10 ? '#f59e0b' : 'var(--text-secondary, #94a3b8)',
                        fontWeight: isSoldOut || tier.remaining < 10 ? 600 : 400,
                      }}
                    >
                      {tier.remaining !== undefined ? tier.remaining.toLocaleString() : (capacity - sold).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1rem', fontWeight: 700, color: '#10b981' }}>
                    ₦{(tier.revenue ?? (sold * tier.price)).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentSold}%`,
                            height: '100%',
                            borderRadius: '9999px',
                            backgroundColor: isSoldOut ? '#ef4444' : percentSold > 80 ? '#f59e0b' : '#10b981',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', width: '35px', textAlign: 'right' }}>
                        {percentSold}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

