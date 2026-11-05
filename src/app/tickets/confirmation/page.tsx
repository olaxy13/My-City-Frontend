'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { api, ApiError } from '@/lib/api-client';
import { VerifyTicketPaymentResponse, TicketPassItem } from '@/types/api';
import { formatEventDate } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  MapPin,
  Ticket,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Mail,
  Loader2,
  MessageCircle,
} from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference') || '';

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<VerifyTicketPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  useEffect(() => {
    if (!reference) {
      setError('No payment reference provided in URL.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function verify() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.verifyTicketOrder(reference);
        if (isMounted) {
          setData(res);
          if (res.isSuccess) {
            // Trigger glorious confetti celebration
            triggerConfetti();
          } else {
            setError(res.message || 'Payment verification could not be completed.');
          }
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        if (isMounted) {
          const msg =
            err instanceof ApiError
              ? err.message
              : err?.message || 'Payment could not be verified.';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  const triggerConfetti = () => {
    try {
      // First burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5A36', '#FF833E', '#10B981', '#F59E0B', '#6366F1'],
      });

      // Second burst shortly after
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF5A36', '#10B981', '#FFD700'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF5A36', '#10B981', '#FFD700'],
        });
      }, 350);
    } catch (e) {
      // Confetti fail silently if not supported
    }
  };

  const handleCopyReference = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // State 1: Verifying with Paystack Skeleton
  if (isLoading) {
    return (
      <div className="container" style={{ padding: '90px 20px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '48px 24px', borderRadius: '24px' }}>
          <div className="verify-spinner-wrap">
            <Loader2 size={48} className="spin-animation" color="var(--primary)" />
            <ShieldCheck size={24} className="shield-overlay" color="#10B981" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '24px', marginBottom: '8px' }}>
            Confirming your payment and generating tickets...
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto' }}>
            Please wait while we confirm your Paystack transaction and issue your entrance passes.
          </p>

          <div className="reference-tag" style={{ marginTop: '24px' }}>
            <span>Reference:</span>
            <code>{reference || 'Loading...'}</code>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Error State (400 Bad Request or Failed Verification)
  if (error || !data || !data.isSuccess) {
    return (
      <div className="container" style={{ padding: '80px 20px', maxWidth: '680px', margin: '0 auto' }}>
        <div className="glass-card error-card" style={{ padding: '40px 28px', borderRadius: '24px', textAlign: 'center' }}>
          <div className="error-icon-box">
            <AlertTriangle size={36} color="#EF4444" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '18px', marginBottom: '10px' }}>
            Payment Verification Notice
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 24px auto' }}>
            Payment could not be verified. If you were debited, please do not worry—our team is here to assist and ensure you get your tickets.
          </p>

          {/* Reference Card */}
          <div className="ref-copy-box">
            <div className="ref-text">
              <span className="ref-label">Transaction Reference:</span>
              <strong className="ref-value">{reference || 'N/A'}</strong>
            </div>
            <button onClick={handleCopyReference} className="btn-copy">
              {copiedRef ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              <span>{copiedRef ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Action Support Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
            <a
              href={`https://wa.me/2348000000000?text=${encodeURIComponent(`Hello Citybuzz support, I have a query about my ticket payment reference: ${reference}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: '12px 20px' }}
            >
              <MessageCircle size={18} />
              <span>Contact Support</span>
            </a>

            <Link href="/explore" className="btn btn-outline" style={{ padding: '12px 20px' }}>
              <span>Return to Explore</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Payment Successful State
  const order = data.order;
  const listing = order?.listing;
  const eventTitle = listing?.title || 'Citybuzz Event';
  const eventDate = (listing as any)?.eventDetails?.startDateTime;
  const venueAddress = listing?.address || `${listing?.neighborhood || ''}, ${listing?.city || ''}`;
  const tickets: TicketPassItem[] = data.tickets || [];

  return (
    <div className="container confirmation-page" style={{ paddingTop: '32px', paddingBottom: '90px', maxWidth: '820px' }}>
      {/* Printable Confirmation Card */}
      <div className="glass-card confirmation-card printable-ticket-area">
        {/* Success Banner */}
        <div className="success-banner">
          <div className="success-icon-bubble">
            <CheckCircle2 size={36} color="#fff" />
          </div>
          <div>
            <div className="success-badge">
              <Sparkles size={14} />
              <span>Payment Successful & Verified</span>
            </div>
            <h1 className="success-headline">You're Going to {eventTitle}!</h1>
            <p className="success-sub">
              Tickets and unique QR codes have been emailed to your inbox. Present your QR code at the gate.
            </p>
          </div>
        </div>

        {/* Reference & Event Meta Strip */}
        <div className="event-meta-strip">
          <div className="meta-item">
            <span className="meta-label">Event Details</span>
            <strong className="meta-value">{eventTitle}</strong>
          </div>

          {eventDate && (
            <div className="meta-item">
              <span className="meta-label">Date & Time</span>
              <strong className="meta-value">
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {formatEventDate(eventDate)}
              </strong>
            </div>
          )}

          {venueAddress && (
            <div className="meta-item">
              <span className="meta-label">Venue</span>
              <strong className="meta-value">
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {venueAddress}
              </strong>
            </div>
          )}

          <div className="meta-item ref-item">
            <span className="meta-label">Order Reference</span>
            <div className="meta-ref-wrap">
              <code>{reference}</code>
              <button onClick={handleCopyReference} className="btn-icon-copy" title="Copy Reference">
                {copiedRef ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="tickets-section">
          <div className="tickets-section-header">
            <div className="tickets-title-box">
              <Ticket size={20} color="var(--primary)" />
              <h3>Your Digital Admission Passes ({tickets.length || order?.items?.[0]?.quantity || 1})</h3>
            </div>
            <span className="gate-instructions">Present QR codes at the gate entrance for check-in</span>
          </div>

          <div className="tickets-grid">
            {tickets.length > 0 ? (
              tickets.map((ticket, idx) => {
                const qrSrc =
                  ticket.qrDataUrl ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.ticketCode)}`;

                return (
                  <div key={idx} className="ticket-pass-card">
                    {/* Left details */}
                    <div className="pass-details">
                      <div className="pass-tier-badge">{ticket.tierName || 'General Admission'}</div>
                      <h4 className="pass-attendee-name">{ticket.attendeeName}</h4>
                      <div className="pass-ticket-code">
                        <span>Code:</span>
                        <strong>{ticket.ticketCode}</strong>
                      </div>
                      <div className="pass-event-title">{eventTitle}</div>
                    </div>

                    {/* QR Code image */}
                    <div className="pass-qr-box">
                      <img
                        src={qrSrc}
                        alt={`QR code for ${ticket.ticketCode}`}
                        className="pass-qr-img"
                        width={140}
                        height={140}
                      />
                      <span className="qr-hint">Scan at entrance</span>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback if tickets array was packaged directly
              <div className="ticket-pass-card">
                <div className="pass-details">
                  <div className="pass-tier-badge">Official Admission</div>
                  <h4 className="pass-attendee-name">{order?.customerName}</h4>
                  <div className="pass-ticket-code">
                    <span>Reference:</span>
                    <strong>{reference}</strong>
                  </div>
                  <div className="pass-event-title">{eventTitle}</div>
                </div>

                <div className="pass-qr-box">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reference)}`}
                    alt="Ticket QR Code"
                    className="pass-qr-img"
                    width={140}
                    height={140}
                  />
                  <span className="qr-hint">Scan at entrance</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Receipt Details */}
        <div className="receipt-footer">
          <div className="receipt-row">
            <span>Primary Buyer:</span>
            <strong>{order?.customerName} ({order?.customerEmail})</strong>
          </div>
          {order?.totalAmount && (
            <div className="receipt-row">
              <span>Total Paid:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                ₦{order.totalAmount.toLocaleString()}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar (Hidden in Print) */}
      <div className="confirmation-actions no-print">
        <button onClick={handlePrint} className="btn btn-secondary print-btn">
          <Printer size={18} />
          <span>Print / Save Passes as PDF</span>
        </button>

        {listing?.id && (
          <Link href={`/listings/${listing.id}`} className="btn btn-primary">
            <span>View Event Page</span>
            <ArrowRight size={16} />
          </Link>
        )}

        <Link href="/explore" className="btn btn-outline">
          <span>Explore More Events</span>
        </Link>
      </div>

      <style jsx>{`
        .confirmation-card {
          border-radius: 24px;
          background: rgba(18, 20, 30, 0.85);
          border: 1px solid rgba(255, 90, 54, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 90, 54, 0.1);
          overflow: hidden;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 32px 32px 28px 32px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(255, 90, 54, 0.15) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }

        .success-icon-bubble {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          flex-shrink: 0;
        }

        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .success-headline {
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 900;
          color: #fff;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .success-sub {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .event-meta-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          padding: 24px 32px;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .meta-value {
          font-size: 0.92rem;
          color: var(--text-primary);
          word-break: break-word;
        }

        .meta-ref-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-ref-wrap code {
          background: rgba(255, 255, 255, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--primary);
        }

        .btn-icon-copy {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .tickets-section {
          padding: 32px;
        }

        .tickets-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tickets-title-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tickets-title-box h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .gate-instructions {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .tickets-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .ticket-pass-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
          border: 1px dashed rgba(255, 90, 54, 0.4);
          border-radius: 18px;
          padding: 24px;
          gap: 20px;
          flex-wrap: wrap;
          position: relative;
        }

        .pass-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .pass-tier-badge {
          display: inline-block;
          align-self: flex-start;
          padding: 4px 12px;
          border-radius: 100px;
          background: rgba(255, 90, 54, 0.15);
          border: 1px solid rgba(255, 90, 54, 0.4);
          color: var(--primary);
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pass-attendee-name {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .pass-ticket-code {
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .pass-ticket-code strong {
          color: #fff;
          font-family: monospace;
          letter-spacing: 1px;
          margin-left: 6px;
        }

        .pass-event-title {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .pass-qr-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: #fff;
          padding: 12px;
          border-radius: 14px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .pass-qr-img {
          display: block;
          width: 140px;
          height: 140px;
          object-fit: contain;
        }

        .qr-hint {
          font-size: 0.68rem;
          font-weight: 800;
          color: #111;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .receipt-footer {
          padding: 20px 32px;
          background: rgba(0, 0, 0, 0.35);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .confirmation-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .print-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* Error States */
        .error-card {
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 20px 60px rgba(239, 68, 68, 0.15);
        }

        .error-icon-box {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: rgba(239, 68, 68, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .ref-copy-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 480px;
          margin: 0 auto;
        }

        .ref-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .ref-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .ref-value {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-family: monospace;
        }

        .btn-copy {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .verify-spinner-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
        }

        .verify-spinner-wrap :global(.shield-overlay) {
          position: absolute;
        }

        .reference-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 100px;
          font-size: 0.84rem;
          color: var(--text-secondary);
        }

        .reference-tag code {
          color: var(--primary);
        }

        :global(.spin-animation) {
          animation: spin 1.2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Clean Print Styles for Tickets */
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .no-print, header, nav, footer, .btn {
            display: none !important;
          }
          .confirmation-page {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .confirmation-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: #fff !important;
            color: #000 !important;
          }
          .success-banner {
            background: #f0fdf4 !important;
            color: #000 !important;
          }
          .success-headline {
            color: #000 !important;
          }
          .pass-attendee-name {
            color: #000 !important;
          }
          .ticket-pass-card {
            border: 2px dashed #000 !important;
            background: #fff !important;
            color: #000 !important;
            page-break-inside: avoid;
          }
          .pass-ticket-code strong {
            color: #000 !important;
          }
        }

        @media (max-width: 600px) {
          .success-banner {
            padding: 24px 20px;
          }
          .event-meta-strip {
            padding: 20px;
          }
          .tickets-section {
            padding: 20px;
          }
          .ticket-pass-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .pass-details {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

export default function TicketConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
          <Loader2 size={40} className="spin-animation" color="var(--primary)" />
          <div style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading confirmation...</div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
