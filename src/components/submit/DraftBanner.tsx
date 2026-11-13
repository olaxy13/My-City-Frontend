'use client';

import React from 'react';
import { Check, ClipboardList } from 'lucide-react';

interface DraftBannerProps {
  onStartFresh: () => void;
  onContinue: () => void;
}

const buttonBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: 'var(--text-sm)',
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

export default function DraftBanner({ onStartFresh, onContinue }: DraftBannerProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.12), rgba(245, 158, 11, 0.1))',
        border: '1px solid rgba(255, 90, 54, 0.35)',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ClipboardList size={22} color="var(--primary)" aria-hidden style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            Resume your draft submission?
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            We found a saved draft from your last session — your progress has been restored.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onStartFresh}
          style={{
            ...buttonBase,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          Start fresh
        </button>
        <button
          type="button"
          onClick={onContinue}
          style={{
            ...buttonBase,
            background: 'rgba(255, 90, 54, 0.18)',
            border: '1px solid rgba(255, 90, 54, 0.4)',
            color: 'var(--primary)',
            fontWeight: 700,
          }}
        >
          Continue draft <Check size={14} strokeWidth={3} aria-hidden />
        </button>
      </div>
    </div>
  );
}
