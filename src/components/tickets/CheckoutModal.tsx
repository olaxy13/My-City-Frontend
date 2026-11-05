'use client';

import React, { useState, useEffect } from 'react';
import { TicketTier, AttendeeInput } from '@/types/api';
import { api, ApiError } from '@/lib/api-client';
import { formatEventDate } from '@/lib/utils';
import {
  X,
  Ticket,
  Lock,
  User,
  Mail,
  Phone,
  Users,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  eventDate?: string | null;
  venueAddress?: string | null;
  ticketTiers: TicketTier[];
  initialSelectedTierId?: string;
  initialQuantity?: number;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  eventDate,
  venueAddress,
  ticketTiers = [],
  initialSelectedTierId,
  initialQuantity = 1,
}: CheckoutModalProps) {
  // Stepper: 'tickets' (Step 1) -> 'contact' (Step 2)
  const [step, setStep] = useState<'tickets' | 'contact'>('tickets');

  // Selected Tier & Quantity
  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    if (initialSelectedTierId && ticketTiers.some((t) => t.id === initialSelectedTierId)) {
      return initialSelectedTierId;
    }
    // Default to first available tier
    const available = ticketTiers.find((t) => t.totalCapacity - t.soldCount > 0 && !t.isSoldOut);
    return available ? available.id : ticketTiers[0]?.id || '';
  });

  const [quantity, setQuantity] = useState<number>(initialQuantity);

  // Buyer & Attendee info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isSelfAttending, setIsSelfAttending] = useState<boolean>(true);
  const [attendeeList, setAttendeeList] = useState<AttendeeInput[]>([]);

  // Submission & validation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected tier when props change or modal re-opens
  useEffect(() => {
    if (initialSelectedTierId && ticketTiers.some((t) => t.id === initialSelectedTierId)) {
      setSelectedTierId(initialSelectedTierId);
    }
  }, [initialSelectedTierId, ticketTiers]);

  // Sync attendees array dynamically when quantity or self-attending changes
  useEffect(() => {
    if (quantity === 1) {
      if (isSelfAttending) {
        setAttendeeList([]);
      } else {
        setAttendeeList((prev) => (prev.length === 1 ? prev : [{ name: '', email: '', phone: '' }]));
      }
    } else {
      // Quantity >= 2: Guests #2 to #N
      const requiredGuestCount = Math.max(0, quantity - 1);
      setAttendeeList((prev) => {
        const nextList: AttendeeInput[] = [];
        for (let i = 0; i < requiredGuestCount; i++) {
          nextList.push(prev[i] || { name: '', email: '', phone: '' });
        }
        return nextList;
      });
    }
  }, [quantity, isSelfAttending]);

  if (!isOpen) return null;

  const activeTier = ticketTiers.find((t) => t.id === selectedTierId) || ticketTiers[0];
  const remaining = activeTier ? activeTier.totalCapacity - activeTier.soldCount : 0;
  const isSoldOut = remaining <= 0 || Boolean(activeTier?.isSoldOut);
  const maxSelectable = Math.max(1, Math.min(10, remaining));

  const handleTierQuantityChange = (tierId: string, newQty: number) => {
    setSelectedTierId(tierId);
    setQuantity(newQty);
    setErrorMessage(null);
  };

  const handleAttendeeChange = (index: number, field: keyof AttendeeInput, value: string) => {
    setAttendeeList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleContinueToDetails = () => {
    if (!activeTier || quantity <= 0 || isSoldOut) {
      setErrorMessage('Please choose at least 1 available ticket to continue.');
      return;
    }
    setErrorMessage(null);
    setStep('contact');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Buyer Information
    if (!customerName.trim()) {
      setErrorMessage('Please provide your full name as the primary buyer.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your tickets.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please provide a contact phone number for ticket notifications.');
      return;
    }

    // Validate Attendees
    if (quantity === 1 && !isSelfAttending) {
      if (!attendeeList[0]?.name?.trim()) {
        setErrorMessage('Please provide the attendee name for this ticket.');
        return;
      }
    } else if (quantity >= 2) {
      for (let i = 0; i < attendeeList.length; i++) {
        if (!attendeeList[i]?.name?.trim()) {
          setErrorMessage(`Please enter the full name for Guest #${i + 2}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Build attendees payload
      let attendeesPayload: AttendeeInput[] | undefined = undefined;

      if (quantity === 1) {
        if (!isSelfAttending && attendeeList[0]) {
          attendeesPayload = [
            {
              name: attendeeList[0].name.trim(),
              email: attendeeList[0].email?.trim() || undefined,
              phone: attendeeList[0].phone?.trim() || undefined,
            },
          ];
        }
      } else {
        attendeesPayload = attendeeList.map((g) => ({
          name: g.name.trim(),
          email: g.email?.trim() || undefined,
          phone: g.phone?.trim() || undefined,
        }));
      }

      const callbackUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/tickets/confirmation`
          : undefined;

      const payload = {
        listingId,
        tierId: activeTier.id,
        quantity,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        callbackUrl,
        attendees: attendeesPayload,
      };

      const res = await api.initializeTicketOrder(payload);

      if (res && res.authorizationUrl) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cbz_last_order_ref', res.reference);
        }
        // Redirect to Paystack
        window.location.href = res.authorizationUrl;
      } else {
        throw new Error('No authorization URL received from payment provider.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Payment initialization failed. Please try again.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const totalPrice = (activeTier?.price || 0) * (quantity > 0 ? quantity : 0);

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="modal-top-bar">
          <div className="top-bar-left">
            <div className="brand-badge">
              <Ticket size={18} />
              <span>Ticket checkout</span>
            </div>

            {/* Stepper Indicator (Tix Africa style) */}
            <div className="checkout-stepper">
              <div
                className={`step-item ${step === 'tickets' ? 'active' : 'completed'}`}
                onClick={() => setStep('tickets')}
              >
                <span className="step-circle">{step === 'contact' ? '✓' : '1'}</span>
                <span className="step-label">Tickets</span>
              </div>
              <span className="step-divider" />
              <div
                className={`step-item ${step === 'contact' ? 'active' : ''}`}
                onClick={() => {
                  if (quantity > 0 && !isSoldOut) setStep('contact');
                }}
              >
                <span className="step-circle">2</span>
                <span className="step-label">Contact</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-close-modal" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Main Content: 2-Column Grid */}
        <div className="modal-main-grid">
          {/* LEFT COLUMN: STEP 1 (TICKETS) OR STEP 2 (CONTACT) */}
          <div className="modal-left-col">
            {step === 'tickets' ? (
              /* ================= STEP 1: CHOOSE TICKETS ================= */
              <div className="step-tickets-view">
                <div className="step-title-wrap">
                  <h2 className="step-title">Choose Tickets</h2>
                  <p className="step-subtitle">Select your pass type and quantity to reserve your spot.</p>
                </div>

                {errorMessage && (
                  <div className="checkout-error-banner">
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Ticket Tiers List */}
                <div className="tiers-list">
                  {ticketTiers.map((tier) => {
                    const tierRemaining = tier.totalCapacity - tier.soldCount;
                    const tierSoldOut = tierRemaining <= 0 || Boolean(tier.isSoldOut);
                    const isSelected = selectedTierId === tier.id && quantity > 0;
                    const maxForThisTier = Math.max(1, Math.min(10, tierRemaining));

                    return (
                      <div
                        key={tier.id}
                        className={`tier-card-item ${isSelected ? 'selected' : ''} ${
                          tierSoldOut ? 'sold-out' : ''
                        }`}
                        onClick={() => {
                          if (!tierSoldOut) {
                            setSelectedTierId(tier.id);
                            if (selectedTierId !== tier.id || quantity === 0) {
                              setQuantity(1);
                            }
                          }
                        }}
                      >
                        {/* Card Header Row */}
                        <div className="tier-card-header">
                          <div className="tier-name-col">
                            <h4 className="tier-name">{tier.name}</h4>
                            <div className="tier-price">
                              {tier.price === 0 ? (
                                <span className="free-text">Free</span>
                              ) : (
                                <>
                                  <span className="naira">₦</span>
                                  {tier.price.toLocaleString()}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quantity Selector Dropdown (ODS Style) */}
                          <div className="tier-qty-col" onClick={(e) => e.stopPropagation()}>
                            <label className="qty-tag">QUANTITY</label>
                            <select
                              value={selectedTierId === tier.id ? quantity : 0}
                              onChange={(e) => {
                                handleTierQuantityChange(tier.id, Number(e.target.value));
                              }}
                              disabled={tierSoldOut}
                              className="qty-select"
                            >
                              <option value="0">0</option>
                              {Array.from({ length: maxForThisTier }, (_, i) => i + 1).map((val) => (
                                <option key={val} value={val}>
                                  {val}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Description */}
                        {tier.description && (
                          <p className="tier-description">{tier.description}</p>
                        )}

                        {/* Availability / Perks / Capacity */}
                        <div className="tier-card-footer">
                          <div className="tier-capacity-badge">
                            <Users size={12} />
                            <span>
                              {tier.soldCount} sold / {tier.totalCapacity} total
                            </span>
                          </div>

                          {tierSoldOut ? (
                            <span className="badge-pill sold-out">Sold Out</span>
                          ) : tierRemaining <= 10 ? (
                            <span className="badge-pill low-stock">
                              Only {tierRemaining} left!
                            </span>
                          ) : (
                            <span className="badge-pill available">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ================= STEP 2: CONTACT & ATTENDEES ================= */
              <div className="step-contact-view">
                <button
                  type="button"
                  onClick={() => setStep('tickets')}
                  className="btn-back-step"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Choose Tickets</span>
                </button>

                <div className="step-title-wrap">
                  <h2 className="step-title">Contact & Attendee Details</h2>
                  <p className="step-subtitle">
                    Digital tickets & gate QR entrance codes will be delivered directly to your email.
                  </p>
                </div>

                {errorMessage && (
                  <div className="checkout-error-banner">
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitOrder} id="checkout-form" className="contact-form">
                  {/* Primary Buyer Details */}
                  <div className="form-section">
                    <h4 className="section-title">
                      <User size={16} />
                      <span>Primary Buyer (Contact Person)</span>
                    </h4>

                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Olamide Adeleke"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          required
                          className="form-input"
                        />
                        <small className="field-hint">Tickets & QR code sent here</small>
                      </div>

                      <div className="form-group">
                        <label>WhatsApp / Phone *</label>
                        <input
                          type="tel"
                          placeholder="08012345678"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                          className="form-input"
                        />
                        <small className="field-hint">SMS & gate check-in contact</small>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Attendee Assignment */}
                  <div className="form-section attendee-section">
                    <h4 className="section-title">
                      <Users size={16} />
                      <span>Attendee Passes ({quantity} total)</span>
                    </h4>

                    {quantity === 1 ? (
                      /* Single ticket mode */
                      <div className="single-pass-card">
                        <div className="pass-pill-header">
                          <CheckCircle2 size={16} color="#10B981" />
                          <strong>Pass #1 ({activeTier.name})</strong>
                        </div>
                        <p className="single-pass-desc">
                          Assigned to <strong>{customerName.trim() || 'Primary Buyer'}</strong> (
                          {customerEmail.trim() || 'your email'}).
                        </p>

                        <label className="checkbox-toggle">
                          <input
                            type="checkbox"
                            checked={!isSelfAttending}
                            onChange={(e) => setIsSelfAttending(!e.target.checked)}
                          />
                          <span>I am buying this ticket for someone else</span>
                        </label>

                        {!isSelfAttending && (
                          <div className="gift-recipient-wrap">
                            <div className="form-group">
                              <label>Attendee Full Name *</label>
                              <input
                                type="text"
                                placeholder="Attendee's name as on ID"
                                value={attendeeList[0]?.name || ''}
                                onChange={(e) => handleAttendeeChange(0, 'name', e.target.value)}
                                required
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label>Attendee Email (Optional)</label>
                              <input
                                type="email"
                                placeholder="attendee@example.com"
                                value={attendeeList[0]?.email || ''}
                                onChange={(e) => handleAttendeeChange(0, 'email', e.target.value)}
                                className="form-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Multi-ticket mode */
                      <div className="multi-pass-list">
                        {/* Ticket #1 (Buyer) */}
                        <div className="attendee-card primary">
                          <div className="attendee-card-top">
                            <span className="pass-number">Ticket #1</span>
                            <span className="pass-tier-tag">{activeTier.name}</span>
                          </div>
                          <div className="attendee-name-preview">
                            <strong>{customerName.trim() || 'Primary Buyer (You)'}</strong>
                            <span className="attendee-email-preview">
                              {customerEmail.trim() || 'Your contact email'}
                            </span>
                          </div>
                        </div>

                        {/* Extra Guests #2 to #N */}
                        {attendeeList.map((guest, idx) => (
                          <div key={idx} className="attendee-card guest">
                            <div className="attendee-card-top">
                              <span className="pass-number">Ticket #{idx + 2}</span>
                              <span className="pass-tier-tag">{activeTier.name}</span>
                            </div>

                            <div className="form-group" style={{ marginBottom: '8px' }}>
                              <label>Guest #{idx + 2} Full Name *</label>
                              <input
                                type="text"
                                placeholder="Full Name as on ID"
                                value={guest.name || ''}
                                onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                                required
                                className="form-input"
                              />
                            </div>

                            <div className="form-row-2">
                              <div className="form-group">
                                <label>Email (Optional)</label>
                                <input
                                  type="email"
                                  placeholder="guest@example.com"
                                  value={guest.email || ''}
                                  onChange={(e) =>
                                    handleAttendeeChange(idx, 'email', e.target.value)
                                  }
                                  className="form-input"
                                />
                              </div>
                              <div className="form-group">
                                <label>Phone (Optional)</label>
                                <input
                                  type="tel"
                                  placeholder="Phone"
                                  value={guest.phone || ''}
                                  onChange={(e) =>
                                    handleAttendeeChange(idx, 'phone', e.target.value)
                                  }
                                  className="form-input"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY (ODS & TIX STYLE) */}
          <div className="modal-right-col">
            <div className="order-summary-card">
              <span className="summary-label">ORDER SUMMARY</span>
              <h3 className="summary-event-title">{listingTitle}</h3>

              <div className="summary-event-meta">
                {eventDate && (
                  <div className="meta-row">
                    <Calendar size={13} />
                    <span>{formatEventDate(eventDate)}</span>
                  </div>
                )}
                {venueAddress && (
                  <div className="meta-row">
                    <MapPin size={13} />
                    <span>{venueAddress}</span>
                  </div>
                )}
              </div>

              <div className="summary-divider" />

              {/* Selected Tier Lines */}
              <div className="summary-lines-box">
                {quantity > 0 ? (
                  <div className="summary-line">
                    <span className="line-desc">
                      {quantity} x {activeTier?.name}
                    </span>
                    <strong className="line-price">
                      {activeTier?.price === 0 ? 'Free' : `₦${totalPrice.toLocaleString()}`}
                    </strong>
                  </div>
                ) : (
                  <p className="empty-summary-text">Please, choose a ticket type to continue</p>
                )}
              </div>

              <div className="summary-divider" />

              {/* Totals Breakdown */}
              <div className="totals-breakdown">
                <div className="subtotal-row">
                  <span>Tickets</span>
                  <span>{totalPrice === 0 ? 'Free' : `₦${totalPrice.toLocaleString()}`}</span>
                </div>
                <div className="subtotal-row">
                  <span>Service fees</span>
                  <span className="fee-waived">Included</span>
                </div>
                <div className="total-highlight-row">
                  <span>Total</span>
                  <span className="final-total">
                    {totalPrice === 0 ? 'Free' : `₦${totalPrice.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <p className="summary-live-hint">
                Your total updates as you change ticket quantities.
              </p>

              {/* Action Buttons based on Step */}
              {step === 'tickets' ? (
                <button
                  type="button"
                  onClick={handleContinueToDetails}
                  disabled={quantity <= 0 || isSoldOut}
                  className="btn-action-primary glow-hover"
                >
                  <span>Continue to details</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="btn-action-primary glow-hover"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      <span>Connecting to Paystack...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      <span>Proceed to Payment</span>
                    </>
                  )}
                </button>
              )}

              {/* Security & Delivery Assurance */}
              <div className="checkout-trust-badge">
                <ShieldCheck size={16} color="#10B981" />
                <span>Paystack 256-bit SSL encrypted • Instant QR pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
        }

        .checkout-modal-dialog {
          width: 100%;
          max-width: 960px;
          max-height: 92vh;
          background: #10121d;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(255, 90, 54, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Top Bar */
        .modal-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 26px;
          background: rgba(18, 20, 32, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 16px;
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .brand-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 1.05rem;
          color: #fff;
        }

        .brand-badge :global(svg) {
          color: var(--primary);
        }

        .checkout-stepper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          opacity: 0.55;
          transition: opacity 0.2s;
        }

        .step-item.active {
          opacity: 1;
        }

        .step-item.completed {
          opacity: 1;
        }

        .step-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-item.active .step-circle {
          background: var(--primary);
          box-shadow: 0 0 10px rgba(255, 90, 54, 0.5);
        }

        .step-item.completed .step-circle {
          background: #10b981;
          color: #fff;
        }

        .step-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
        }

        .step-divider {
          width: 20px;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-close-modal {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-close-modal:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
        }

        /* Main Grid */
        .modal-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          overflow: hidden;
          flex: 1;
        }

        .modal-left-col {
          padding: 28px;
          overflow-y: auto;
          max-height: calc(92vh - 74px);
        }

        .modal-right-col {
          background: #141624;
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          padding: 28px 24px;
          overflow-y: auto;
          max-height: calc(92vh - 74px);
        }

        /* Step Titles */
        .step-title-wrap {
          margin-bottom: 22px;
        }

        .step-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 4px;
        }

        .step-subtitle {
          font-size: 0.88rem;
          color: #cbd5e1;
        }

        .checkout-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          font-size: 0.86rem;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .btn-back-step {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 16px;
          padding: 0;
        }

        /* Tier Cards (ODS Style) */
        .tiers-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tier-card-item {
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tier-card-item:hover {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.06);
        }

        .tier-card-item.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
        }

        .tier-card-item.sold-out {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tier-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 8px;
        }

        .tier-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 2px;
        }

        .tier-price {
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--primary);
        }

        .tier-price .naira {
          font-size: 1rem;
          margin-right: 2px;
        }

        .free-text {
          color: #10b981;
        }

        .tier-qty-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .qty-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #cbd5e1;
          letter-spacing: 0.5px;
        }

        .qty-select {
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          color: #fff;
          padding: 6px 14px;
          font-size: 0.95rem;
          font-weight: 800;
          outline: none;
          cursor: pointer;
          min-width: 65px;
          text-align: center;
        }

        .tier-card-item.selected .qty-select {
          border-color: #10b981;
          background: #064e3b;
        }

        .qty-select option {
          background: #1a1d2d;
          color: #fff;
        }

        .tier-description {
          font-size: 0.86rem;
          color: #cbd5e1;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .tier-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tier-capacity-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-pill {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-pill.available {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .badge-pill.low-stock {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        .badge-pill.sold-out {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        /* Step 2 Form Styles */
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .form-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 16px;
        }

        .section-title :global(svg) {
          color: var(--primary);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #f1f5f9;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 10px;
          color: #fff;
          font-size: 0.92rem;
          outline: none;
        }

        .form-input:focus {
          border-color: var(--primary);
        }

        .field-hint {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* Attendee Cards */
        .single-pass-card {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 12px;
          padding: 14px;
        }

        .pass-pill-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #10b981;
          margin-bottom: 4px;
        }

        .single-pass-desc {
          font-size: 0.84rem;
          color: #cbd5e1;
          margin-bottom: 10px;
        }

        .checkbox-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #fff;
          cursor: pointer;
          user-select: none;
        }

        .gift-recipient-wrap {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .multi-pass-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .attendee-card {
          padding: 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .attendee-card.primary {
          background: rgba(255, 90, 54, 0.08);
          border-color: rgba(255, 90, 54, 0.25);
        }

        .attendee-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .pass-number {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--primary);
        }

        .pass-tier-tag {
          font-size: 0.72rem;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-weight: 700;
        }

        .attendee-name-preview strong {
          display: block;
          font-size: 0.95rem;
          color: #fff;
        }

        .attendee-email-preview {
          font-size: 0.8rem;
          color: #cbd5e1;
        }

        /* Order Summary Column */
        .order-summary-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .summary-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #10b981;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }

        .summary-event-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .summary-event-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #cbd5e1;
        }

        .summary-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 16px 0;
        }

        .summary-lines-box {
          min-height: 48px;
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: #fff;
        }

        .summary-line strong {
          font-size: 1rem;
          color: #10b981;
        }

        .empty-summary-text {
          font-size: 0.85rem;
          color: #cbd5e1;
          font-style: italic;
        }

        .totals-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .subtotal-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #cbd5e1;
        }

        .fee-waived {
          color: #10b981;
          font-weight: 700;
        }

        .total-highlight-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .total-highlight-row span {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
        }

        .final-total {
          font-size: 1.4rem !important;
          font-weight: 900 !important;
          color: #10b981 !important;
        }

        .summary-live-hint {
          font-size: 0.75rem;
          color: #cbd5e1;
          margin-top: 10px;
          margin-bottom: 20px;
        }

        .btn-action-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-action-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
        }

        .btn-action-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .checkout-trust-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 14px;
          font-size: 0.74rem;
          color: #cbd5e1;
          text-align: center;
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 860px) {
          .checkout-modal-dialog {
            max-height: 94vh;
            height: 94vh;
            border-radius: 18px;
          }
          .modal-main-grid {
            display: flex;
            flex-direction: column;
            grid-template-columns: none;
            overflow-y: auto;
            flex: 1;
            -webkit-overflow-scrolling: touch;
          }
          .modal-left-col {
            overflow: visible;
            max-height: none;
            flex-shrink: 0;
            padding: 20px 18px;
          }
          .modal-right-col {
            overflow: visible;
            max-height: none;
            flex-shrink: 0;
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px 18px 48px;
          }
          .form-row-2 {
            grid-template-columns: 1fr;
          }
          .modal-top-bar {
            padding: 14px 18px;
          }
        }
      `}</style>
    </div>
  );
}
