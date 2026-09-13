'use client';

import React, { useEffect, useState } from 'react';
import { calculateCountdown, CountdownTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CountdownBadgeProps {
  targetDate: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export default function CountdownBadge({ targetDate, size = 'md', compact = false }: CountdownBadgeProps) {
  const [time, setTime] = useState<CountdownTime>(() => calculateCountdown(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calculateCountdown(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (time.isPast) {
    return (
      <div
        className="glass-pill"
        style={{
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          fontSize: size === 'sm' ? '0.75rem' : '0.85rem',
        }}
      >
        <Clock size={14} />
        <span>Happening Now / Ended</span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <div
        className="glass-pill"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          color: '#F59E0B',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          fontSize: '0.78rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Clock size={13} color="#F59E0B" />
        <span style={{ fontWeight: 700 }}>
          {time.days > 0 ? `${time.days}d ` : ''}
          {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? '12px' : '8px' }}>
      <div className="countdown-box" style={{ minWidth: size === 'lg' ? '65px' : '48px', padding: size === 'lg' ? '8px 12px' : '6px 8px' }}>
        <div className="val" style={{ fontSize: size === 'lg' ? '1.5rem' : '1.15rem' }}>{pad(time.days)}</div>
        <div className="lbl" style={{ fontSize: size === 'lg' ? '0.65rem' : '0.55rem' }}>DAYS</div>
      </div>
      <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem' }}>:</span>
      <div className="countdown-box" style={{ minWidth: size === 'lg' ? '65px' : '48px', padding: size === 'lg' ? '8px 12px' : '6px 8px' }}>
        <div className="val" style={{ fontSize: size === 'lg' ? '1.5rem' : '1.15rem' }}>{pad(time.hours)}</div>
        <div className="lbl" style={{ fontSize: size === 'lg' ? '0.65rem' : '0.55rem' }}>HOURS</div>
      </div>
      <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem' }}>:</span>
      <div className="countdown-box" style={{ minWidth: size === 'lg' ? '65px' : '48px', padding: size === 'lg' ? '8px 12px' : '6px 8px' }}>
        <div className="val" style={{ fontSize: size === 'lg' ? '1.5rem' : '1.15rem' }}>{pad(time.minutes)}</div>
        <div className="lbl" style={{ fontSize: size === 'lg' ? '0.65rem' : '0.55rem' }}>MINS</div>
      </div>
      <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem' }}>:</span>
      <div className="countdown-box" style={{ minWidth: size === 'lg' ? '65px' : '48px', padding: size === 'lg' ? '8px 12px' : '6px 8px' }}>
        <div className="val" style={{ fontSize: size === 'lg' ? '1.5rem' : '1.15rem', color: '#FF5A36' }}>{pad(time.seconds)}</div>
        <div className="lbl" style={{ fontSize: size === 'lg' ? '0.65rem' : '0.55rem' }}>SECS</div>
      </div>
    </div>
  );
}
