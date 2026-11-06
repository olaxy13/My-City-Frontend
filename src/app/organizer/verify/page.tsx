'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function VerifyTokenHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { loginWithToken } = useOrganizerAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous in-memory lock to prevent React StrictMode or re-renders from firing multiple requests
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token found in this link. Please request a new magic link.');
      return;
    }

    if (verifyingRef.current) return;
    verifyingRef.current = true;

    async function handleVerification() {
      try {
        await loginWithToken(token!);
        setStatus('success');
        setTimeout(() => {
          router.replace('/organizer/dashboard');
        }, 800);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.message || 'This login link is invalid, expired, or has already been used. Please request a fresh link.'
        );
      }
    }

    handleVerification();
  }, [token]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'var(--bg-main, #0a0d14)',
      }}
    >
      <div
        className="glass-card-static"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          textAlign: 'center',
          border: '1px solid var(--border-card, rgba(255, 255, 255, 0.1))',
          backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
        }}
      >
        {status === 'verifying' && (
          <div>
            <Loader2
              size={40}
              style={{
                color: 'var(--primary, #ff5a36)',
                margin: '0 auto 1.25rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: '0 0 0.5rem' }}>
              Verifying your access...
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
              Checking your magic link credentials. One moment please.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: '0 0 0.5rem' }}>
              Authenticated!
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
              Redirecting you to your events dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#ef4444',
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: '0 0 0.5rem' }}>
              Link Expired or Invalid
            </h2>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              {errorMessage}
            </p>

            <Link
              href="/organizer/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff7354)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                width: '100%',
              }}
            >
              <RefreshCw size={15} />
              <span>Request a New Magic Link</span>
            </Link>
          </div>
        )}
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

export default function OrganizerVerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--bg-main, #0a0d14)',
          }}
        >
          <Loader2 size={36} style={{ color: 'var(--primary, #ff5a36)', animation: 'spin 1s linear infinite' }} />
        </div>
      }
    >
      <VerifyTokenHandler />
    </Suspense>
  );
}

