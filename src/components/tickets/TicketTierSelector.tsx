'use client';

import React, { useState } from 'react';
import { TicketTier } from '@/types/api';
import { Ticket, Users, CheckCircle2, AlertCircle, ShoppingBag, Plus, Minus, ShieldCheck, Sparkles } from 'lucide-react';
import CheckoutModal from './CheckoutModal';

interface TicketTierSelectorProps {
  listingId: string;
  listingTitle: string;
  eventDate?: string | null;
  venueAddress?: string | null;
  ticketTiers?: TicketTier[];
  contactPhone?: string | null;
}

export default function TicketTierSelector({
  listingId,
  listingTitle,
  eventDate,
  venueAddress,
  ticketTiers = [],
  contactPhone,
}: TicketTierSelectorProps) {
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(() => {
    // Default select first available tier
    return ticketTiers.find((t) => (t.totalCapacity - t.soldCount > 0) && !t.isSoldOut) || null;
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // If no ticket tiers exist for this event
  if (!ticketTiers || ticketTiers.length === 0) {
    return null;
  }

  const handleSelectTier = (tier: TicketTier) => {
    const remaining = tier.totalCapacity - tier.soldCount;
    if (remaining <= 0 || tier.isSoldOut) return;
    setSelectedTier(tier);
    // Reset quantity if it exceeds available
    setQuantity((prev) => Math.min(prev, Math.min(10, remaining)));
  };

  const currentRemaining = selectedTier ? selectedTier.totalCapacity - selectedTier.soldCount : 0;
  const maxSelectable = Math.max(1, Math.min(10, currentRemaining));

  const handleIncrement = () => {
    if (quantity < maxSelectable) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleOpenCheckout = (tier?: TicketTier) => {
    const targetTier = tier || selectedTier;
    if (!targetTier) return;
    setSelectedTier(targetTier);
    setIsModalOpen(true);
  };

  return (
    <div className="ticket-tier-container glass-card">
      {/* Header */}
      <div className="ticket-header">
        <div className="ticket-header-title">
          <div className="ticket-icon-box">
            <Ticket size={22} />
          </div>
          <div>
            <h3>Official Event Tickets</h3>
            <p>Instant digital passes delivered to your email with gate QR codes</p>
          </div>
        </div>

        <div className="paystack-trust-badge">
          <ShieldCheck size={16} />
          <span>Paystack Secured</span>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="tiers-grid">
        {ticketTiers.map((tier) => {
          const remaining = tier.totalCapacity - tier.soldCount;
          const isSoldOut = remaining <= 0 || Boolean(tier.isSoldOut);
          const isLowStock = !isSoldOut && remaining <= 10;
          const isSelected = selectedTier?.id === tier.id && !isSoldOut;

          return (
            <div
              key={tier.id}
              onClick={() => !isSoldOut && handleSelectTier(tier)}
              className={`tier-card ${isSelected ? 'tier-selected' : ''} ${isSoldOut ? 'tier-sold-out' : ''}`}
            >
              {/* Badge */}
              <div className="tier-top-row">
                <div className="tier-name-wrap">
                  <span className="tier-name">{tier.name}</span>
                  {isSelected && (
                    <span className="selected-pill">
                      <CheckCircle2 size={13} /> Selected
                    </span>
                  )}
                </div>

                <div className="tier-availability">
                  {isSoldOut ? (
                    <span className="badge-sold-out">SOLD OUT</span>
                  ) : isLowStock ? (
                    <span className="badge-low-stock">
                      <AlertCircle size={12} /> Only {remaining} left!
                    </span>
                  ) : (
                    <span className="badge-available">
                      <Sparkles size={12} /> Available
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="tier-price-row">
                <span className="currency">₦</span>
                <span className="price-amount">{tier.price.toLocaleString()}</span>
                <span className="price-unit">/ pass</span>
              </div>

              {/* Description / perks */}
              {tier.description && (
                <p className="tier-desc">{tier.description}</p>
              )}

              {/* Action Button inside card */}
              <div className="tier-card-action">
                {isSoldOut ? (
                  <button disabled className="btn-card-sold-out">
                    Sold Out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCheckout(tier);
                    }}
                    className={`btn-card-select ${isSelected ? 'active' : ''}`}
                  >
                    <ShoppingBag size={15} />
                    <span>{isSelected ? 'Proceed to Checkout' : 'Select Tier'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Order Bar if a tier is selected */}
      {selectedTier && (
        <div className="checkout-summary-bar">
          <div className="summary-left">
            <div className="summary-tier-info">
              <span className="label">Selected Tier</span>
              <strong className="tier-title">{selectedTier.name}</strong>
            </div>

            {/* Quantity Selector */}
            <div className="quantity-controls">
              <span className="qty-label">Quantity:</span>
              <div className="stepper-wrap">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="step-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-display">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= maxSelectable}
                  className="step-btn"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="summary-right">
            <div className="total-calculation">
              <span className="total-label">Total Amount</span>
              <span className="total-value">
                ₦{(selectedTier.price * quantity).toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCheckout()}
              className="btn btn-primary buy-tickets-btn glow-hover"
            >
              <ShoppingBag size={18} />
              <span>Buy {quantity} {quantity === 1 ? 'Ticket' : 'Tickets'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedTier && (
        <CheckoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          listingId={listingId}
          listingTitle={listingTitle}
          eventDate={eventDate}
          venueAddress={venueAddress}
          ticketTiers={ticketTiers}
          initialSelectedTierId={selectedTier.id}
          initialQuantity={quantity}
        />
      )}

      <style jsx>{`
        .ticket-tier-container {
          margin-top: 36px;
          margin-bottom: 36px;
          padding: 28px;
          border-radius: 24px;
          background: rgba(18, 20, 29, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 90, 54, 0.25);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 90, 54, 0.08);
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .ticket-header-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ticket-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255, 90, 54, 0.2), rgba(245, 158, 11, 0.2));
          border: 1px solid rgba(255, 90, 54, 0.4);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ticket-header-title h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .ticket-header-title p {
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .paystack-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .tier-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        .tier-card:hover:not(.tier-sold-out) {
          border-color: rgba(255, 90, 54, 0.45);
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
        }

        .tier-card.tier-selected {
          border-color: var(--primary);
          background: linear-gradient(145deg, rgba(255, 90, 54, 0.12), rgba(255, 255, 255, 0.04));
          box-shadow: 0 0 20px rgba(255, 90, 54, 0.25);
        }

        .tier-card.tier-sold-out {
          opacity: 0.6;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }

        .tier-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tier-name-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tier-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .selected-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--primary);
        }

        .badge-sold-out {
          background: rgba(148, 163, 184, 0.18);
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .badge-low-stock {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.74rem;
          font-weight: 800;
          animation: pulseSlow 2s infinite;
        }

        .badge-available {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .tier-price-row {
          display: flex;
          align-items: baseline;
          gap: 3px;
          margin-bottom: 10px;
        }

        .currency {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--primary);
        }

        .price-amount {
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .price-unit {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .tier-desc {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
          flex-grow: 1;
        }

        .tier-card-action {
          margin-top: auto;
        }

        .btn-card-select {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-card-select:hover {
          background: rgba(255, 90, 54, 0.15);
          border-color: var(--primary);
          color: var(--primary);
        }

        .btn-card-select.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          box-shadow: 0 4px 14px rgba(255, 90, 54, 0.35);
        }

        .btn-card-sold-out {
          width: 100%;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: not-allowed;
        }

        .checkout-summary-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 18px 24px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 90, 54, 0.3);
          border-radius: 18px;
          flex-wrap: wrap;
        }

        .summary-left {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .summary-tier-info {
          display: flex;
          flex-direction: column;
        }

        .summary-tier-info .label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
        }

        .summary-tier-info .tier-title {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .qty-label {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .stepper-wrap {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          overflow: hidden;
        }

        .step-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: var(--text-primary);
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .step-btn:hover:not(:disabled) {
          background: rgba(255, 90, 54, 0.2);
          color: var(--primary);
        }

        .step-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-display {
          width: 34px;
          text-align: center;
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .summary-right {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .total-calculation {
          display: flex;
          flex-direction: column;
          text-align: right;
        }

        .total-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
        }

        .total-value {
          font-size: 1.45rem;
          font-weight: 900;
          color: var(--primary);
        }

        .buy-tickets-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 26px;
          font-size: 1rem;
          font-weight: 800;
          border-radius: 14px;
          background: linear-gradient(135deg, #ff5a36 0%, #ff833e 100%);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px rgba(255, 90, 54, 0.4);
        }

        .buy-tickets-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(255, 90, 54, 0.55);
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }

        @media (max-width: 768px) {
          .ticket-tier-container {
            padding: 20px 16px;
          }
          .checkout-summary-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .summary-right {
            justify-content: space-between;
          }
          .buy-tickets-btn {
            width: 100%;
            justify-content: center;
          }
          .total-calculation {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
