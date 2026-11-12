'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';

const BENEFITS: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Zap, title: 'Free to list', text: 'No commission or ticket markups' },
  { Icon: ShieldCheck, title: 'Verified badge', text: 'After a CAC or licence check, usually within 24 hours' },
  { Icon: MessageCircle, title: 'Direct enquiries', text: 'Customers reach you on WhatsApp' },
];

/** The one place on the home page that speaks to organizers and businesses. */
export default function OrganizerBanner({ city }: { city: string }) {
  return (
    <section
      aria-labelledby="organizer-banner-title"
      style={{
        marginTop: '56px',
        padding: 'clamp(22px, 4vw, 40px)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 90, 54, 0.25)',
        background: [
          'radial-gradient(60% 120% at 0% 0%, rgba(255, 90, 54, 0.16), transparent 65%)',
          'radial-gradient(50% 120% at 100% 100%, rgba(245, 158, 11, 0.12), transparent 65%)',
          'var(--bg-secondary)',
        ].join(', '),
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(20px, 3vw, 36px)',
      }}
    >
      <div style={{ flex: '1 1 420px', minWidth: 0 }}>
        <h2
          id="organizer-banner-title"
          style={{ fontSize: 'clamp(1.35rem, 3.2vw, 1.9rem)', lineHeight: 1.2, marginBottom: '8px' }}
        >
          Hosting an event or running a business in {city}?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, marginBottom: '20px' }}>
          Get in front of locals and visitors looking for things to do.
        </p>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '14px 20px',
          }}
        >
          {BENEFITS.map(({ Icon, title, text }) => (
            <li key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  background: 'rgba(255, 90, 54, 0.14)',
                }}
              >
                <Icon size={16} />
              </span>
              <span>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {title}
                </span>
                <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/submit"
        className="btn btn-primary"
        style={{ padding: '14px 26px', fontSize: 'var(--text-md)', flex: '0 1 auto', justifyContent: 'center' }}
      >
        <span>List it for free</span>
        <ArrowRight size={18} aria-hidden />
      </Link>
    </section>
  );
}
