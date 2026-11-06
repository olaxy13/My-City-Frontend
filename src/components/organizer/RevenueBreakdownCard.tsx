'use client';

import React from 'react';
import { Wallet, DollarSign, Percent, ShoppingBag } from 'lucide-react';

interface RevenueBreakdownProps {
  gross: number;
  platformFee: number;
  organizerPayout: number;
  totalOrders: number;
}

export default function RevenueBreakdownCard({
  gross,
  platformFee,
  organizerPayout,
  totalOrders,
}: RevenueBreakdownProps) {
  const cards = [
    {
      label: 'Gross Ticket Revenue',
      value: `₦${(gross || 0).toLocaleString()}`,
      subtext: 'Total amount paid by attendees',
      icon: DollarSign,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.12)',
    },
    {
      label: 'Platform Fee (Citybuzz)',
      value: `₦${(platformFee || 0).toLocaleString()}`,
      subtext: 'Ticket commission deducted',
      icon: Percent,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Your Net Payout',
      value: `₦${(organizerPayout || 0).toLocaleString()}`,
      subtext: 'Directly settled to your bank',
      icon: Wallet,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      highlight: true,
    },
    {
      label: 'Total Orders',
      value: (totalOrders || 0).toLocaleString(),
      subtext: 'Completed ticket checkouts',
      icon: ShoppingBag,
      color: 'var(--primary, #ff5a36)',
      bg: 'rgba(255, 90, 54, 0.12)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        width: '100%',
      }}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-card-static"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              border: card.highlight
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
              backgroundColor: card.highlight
                ? 'rgba(16, 185, 129, 0.05)'
                : 'var(--bg-card, rgba(18, 24, 38, 0.85))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>
                {card.label}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: card.bg,
                  color: card.color,
                }}
              >
                <Icon size={16} />
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: card.highlight ? '#10b981' : 'var(--text-primary, #f8fafc)',
                  fontFamily: 'var(--font-heading, inherit)',
                  lineHeight: 1.1,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-muted, #64748b)',
                  marginTop: '0.35rem',
                }}
              >
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

