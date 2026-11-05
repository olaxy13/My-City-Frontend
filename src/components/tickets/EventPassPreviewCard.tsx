'use client';

import React from 'react';
import { TicketTier } from '@/types/api';
import { Ticket, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface EventPassPreviewCardProps {
  listingTitle: string;
  ticketTiers: TicketTier[];
  onOpenCheckout: (tier?: TicketTier) => void;
}

export default function EventPassPreviewCard({
  listingTitle,
  ticketTiers = [],
  onOpenCheckout,
}: EventPassPreviewCardProps) {
  if (!ticketTiers || ticketTiers.length === 0) {
    return null;
  }

  // Find lowest price
  const prices = ticketTiers.map((t) => t.price);
  const minPrice = Math.min(...prices);
  const hasFree = prices.some((p) => p === 0);

  return (
    <div className="event-pass-preview-card glass-card">
      {/* Top Header */}
      <div className="preview-header">
        <div className="status-pill">
          <span className="pulse-dot" />
          <span>Registration is open</span>
        </div>

        <h3 className="preview-title">Choose your pass</h3>
        <p className="preview-subtitle">
          {hasFree
            ? 'Regular admission is free. Paid passes include reserved access and VIP perks.'
            : 'Select your pass type. Instant digital tickets with gate QR code sent to your email.'}
        </p>
      </div>

      {/* Tier Price List Preview */}
      <div className="tier-preview-list">
        {ticketTiers.map((tier) => {
          const remaining = tier.totalCapacity - tier.soldCount;
          const isSoldOut = remaining <= 0 || Boolean(tier.isSoldOut);

          return (
            <div
              key={tier.id}
              onClick={() => !isSoldOut && onOpenCheckout(tier)}
              className={`tier-preview-row ${isSoldOut ? 'sold-out' : 'available'}`}
              title={isSoldOut ? 'Sold out' : `Select ${tier.name}`}
            >
              <div className="tier-row-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="tier-row-name">{tier.name}</span>
                  <span className="tier-capacity-badge">
                    {isSoldOut
                      ? `Sold out (${tier.totalCapacity})`
                      : `${tier.soldCount} sold / ${tier.totalCapacity} cap`}
                  </span>
                </div>
                {tier.description && (
                  <span className="tier-row-perk-hint">
                    {tier.description}
                  </span>
                )}
              </div>

              <div className="tier-row-right">
                {isSoldOut ? (
                  <span className="badge-sold-out">Sold Out</span>
                ) : (
                  <span className="tier-row-price">
                    {tier.price === 0 ? 'Free' : `₦${tier.price.toLocaleString()}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Big Action CTA Button */}
      <button
        type="button"
        onClick={() => onOpenCheckout()}
        className="btn btn-primary choose-pass-btn glow-hover"
      >
        <Ticket size={18} />
        <span>Choose a ticket</span>
        <ArrowRight size={17} />
      </button>

      {/* Footer Trust Note */}
      <div className="preview-footer-note">
        <ShieldCheck size={15} color="#10B981" />
        <span>Secure registration & instant Paystack checkout</span>
      </div>

      <style jsx>{`
        .event-pass-preview-card {
          padding: 24px;
          border-radius: 20px;
          background: rgba(18, 20, 30, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
          margin-bottom: 26px;
        }

        .preview-header {
          margin-bottom: 18px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 100px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          animation: pulseGreen 1.6s infinite;
        }

        .preview-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
        }

        .preview-subtitle {
          font-size: 0.88rem;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .tier-preview-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tier-preview-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .tier-preview-row.available:hover {
          background: rgba(255, 90, 54, 0.15);
          border-color: rgba(255, 90, 54, 0.5);
          transform: translateX(3px);
        }

        .tier-preview-row.sold-out {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .tier-row-left {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .tier-row-name {
          font-weight: 800;
          font-size: 0.98rem;
          color: #ffffff;
        }

        .tier-capacity-badge {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: #93c5fd;
          letter-spacing: 0.2px;
        }

        .tier-row-perk-hint {
          font-size: 0.76rem;
          color: #cbd5e1;
        }

        .tier-row-price {
          font-size: 1.05rem;
          font-weight: 800;
          color: #ff833e;
        }

        .badge-sold-out {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .choose-pass-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          font-size: 1rem;
          font-weight: 800;
          border-radius: 14px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          border: none;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .choose-pass-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
        }

        .preview-footer-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          font-size: 0.78rem;
          color: #cbd5e1;
        }

        @keyframes pulseGreen {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
