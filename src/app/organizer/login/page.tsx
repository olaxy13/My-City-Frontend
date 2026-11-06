'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { Compass, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function OrganizerLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.organizerRequestLink(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Unable to send magic link. Please check your email.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 90, 54, 0.12), transparent 70%), var(--bg-main, #0a0d14)',
      }}
    >
      <div
        className="glass-card-static"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          borderRadius: '24px',
          border: '1px solid var(--border-card, rgba(255, 255, 255, 0.12))',
          backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 1rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff8c42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(255, 90, 54, 0.4)',
            }}
          >
            <Compass size={28} />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 0.5rem',
              color: 'var(--text-primary, #f8fafc)',
              fontFamily: 'var(--font-heading, inherit)',
            }}
          >
            Organizer Portal
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>
            Manage your events, ticket tiers, orders & gate check-ins
          </p>
        </div>

        {/* State: Check your inbox */}
        {isSubmitted ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary, #f8fafc)',
                margin: '0 0 0.5rem',
              }}
            >
              Check your inbox!
            </h2>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              We sent a secure magic login link to <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>{email}</strong>.
              Click the link to instantly access your dashboard.
            </p>

            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary, #ff5a36)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* State: Email Entry Form */
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="organizer-email"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '0.5rem',
                }}
              >
                Your Organizer Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #64748b)',
                  }}
                />
                <input
                  id="organizer-email"
                  type="email"
                  required
                  placeholder="e.g. organizer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    color: 'var(--text-primary, #f8fafc)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', marginTop: '0.4rem', display: 'block' }}>
                The email you used when submitting your listing.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff7354)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading || !email.trim() ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(255, 90, 54, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Sending magic link...</span>
                </>
              ) : (
                <>
                  <span>Send Magic Login Link</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer links */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            textAlign: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: '0.775rem',
              color: 'var(--text-secondary, #94a3b8)',
              textDecoration: 'none',
            }}
          >
            ← Return to Citybuzz Explore
          </Link>
        </div>
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
    </div>
  );
}

