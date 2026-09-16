'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        paddingTop: '60px',
        paddingBottom: '40px',
        marginTop: '80px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '50px',
          }}
        >
          {/* Col 1: Brand info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF5A36, #FF833E)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Compass size={20} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                City<span style={{ color: 'var(--primary)' }}>Discovery</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
              The curated discovery directory connecting locals and visitors with the best happenings, verified restaurants, and essential facilities across Abeokuta.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
              <ShieldCheck size={18} />
              <span>100% Admin Curation & CAC Verification</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', color: 'var(--text-primary)' }}>
              Explore
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li>
                <Link href="/explore?type=event" style={{ color: 'var(--text-secondary)' }}>
                  🎉 Upcoming Events & Festivals
                </Link>
              </li>
              <li>
                <Link href="/explore?type=restaurant" style={{ color: 'var(--text-secondary)' }}>
                  🍲 Top Restaurants & Amala Spots
                </Link>
              </li>
              <li>
                <Link href="/explore?type=facility" style={{ color: 'var(--text-secondary)' }}>
                  🏥 Medical & Public Facilities
                </Link>
              </li>
              <li>
                <Link href="/explore?category=nightlife" style={{ color: 'var(--text-secondary)' }}>
                  🍸 Lounges & Nightlife
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Neighborhoods */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', color: 'var(--text-primary)' }}>
              Abeokuta Neighborhoods
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Ibara', 'Oke-Mosan', 'Kuto', 'Panseke', 'Ikija', 'Idi-Aba', 'Camp/FUNAAB'].map((n) => (
                <Link
                  key={n}
                  href={`/explore?neighborhood=${encodeURIComponent(n)}`}
                  className="glass-pill"
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  <MapPin size={12} color="var(--primary)" />
                  {n}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 4: For Businesses & Creators */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', color: 'var(--text-primary)' }}>
              For Organizers & Businesses
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Listing is 100% free! Reach thousands of city residents looking for activities today.
            </p>
            <Link href="/submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.88rem', padding: '9px 14px' }}>
              <Sparkles size={16} />
              Submit Your Place/Event
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '25px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © {new Date().getFullYear()} City Discovery Platform. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Built with <Heart size={14} color="#FF5A36" fill="#FF5A36" /> for Abeokuta & Nigerian Cities.
          </div>
        </div>
      </div>
    </footer>
  );
}
