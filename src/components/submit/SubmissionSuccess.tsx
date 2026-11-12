'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Copy, ExternalLink, KeyRound } from 'lucide-react';

interface SubmissionSuccessProps {
  id: string;
  editToken: string;
  email: string;
}

export default function SubmissionSuccess({ id, editToken, email }: SubmissionSuccessProps) {
  const path = `/resubmit/${id}?editToken=${editToken}`;
  // Only rendered after a client-side submit, so window is available
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the link is still visible to copy by hand */
    }
  };

  return (
    <div
      className="glass-card-static"
      style={{
        padding: '40px 30px',
        borderRadius: 'var(--radius-xl)',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}
    >
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981, #34D399)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
        }}
      >
        <CheckCircle size={38} aria-hidden />
      </div>

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>Submission Successfully Received!</h2>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-md)',
          lineHeight: 1.6,
          maxWidth: '560px',
          margin: '0 auto 24px auto',
        }}
      >
        Your submission has been placed into our moderation queue. Our team reviews all details and verified documents
        within 24 hours. A confirmation email has been dispatched to <strong>{email}</strong>.
      </p>

      {/* Revision link */}
      <div
        style={{
          background: 'var(--bg-input)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px dashed var(--border-color)',
          maxWidth: '520px',
          margin: '0 auto 30px auto',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            color: 'var(--accent-amber)',
            marginBottom: '4px',
          }}
        >
          <KeyRound size={13} aria-hidden /> SUBMISSION REVISION LINK
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
          Bookmark this link! Submissions cannot be edited while under active moderation. If our review team requests
          any adjustments or additional details, this link will unlock so you can revise and resubmit:
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--bg-card)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: 'var(--text-sm)',
              wordBreak: 'break-all',
              color: 'var(--primary)',
            }}
          >
            {fullUrl}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: 'var(--text-sm)', flexShrink: 0 }}
            aria-label="Copy revision link"
          >
            <Copy size={14} aria-hidden />
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-secondary">
          Back to Homepage
        </Link>
        <Link href={path} className="btn btn-primary">
          <span>Check Submission Status</span>
          <ExternalLink size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
