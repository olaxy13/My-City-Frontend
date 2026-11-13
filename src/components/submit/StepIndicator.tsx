'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { StepDef } from './submission';

interface StepIndicatorProps {
  steps: StepDef[];
  /** 1-based current step. */
  current: number;
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol
      aria-label="Form progress"
      style={{
        listStyle: 'none',
        padding: 0,
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}
    >
      {steps.map((s, i) => {
        const num = i + 1;
        const isCurrent = num === current;
        const isDone = num < current;
        return (
          <li
            key={s.key}
            aria-current={isCurrent ? 'step' : undefined}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isCurrent ? 'var(--primary)' : isDone ? 'var(--accent-emerald)' : 'var(--bg-input)',
                color: isCurrent || isDone ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 'var(--text-base)',
                boxShadow: isCurrent ? '0 0 15px var(--primary-glow)' : 'none',
                border: '1.5px solid var(--border-color)',
              }}
            >
              {isDone ? <Check size={18} strokeWidth={3} aria-label="Done" /> : num}
            </div>
            <span
              className="step-indicator-label"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: num <= current ? 'var(--text-primary)' : 'var(--text-muted)',
                marginTop: '6px',
              }}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
