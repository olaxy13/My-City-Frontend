'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { Compass, Calendar, Settings, LogOut, ArrowLeft, User } from 'lucide-react';

export default function OrganizerNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { organizerEmail, logout } = useOrganizerAuth();

  const handleLogout = () => {
    logout();
    router.push('/organizer/login');
  };

  const isEventsActive = pathname?.startsWith('/organizer/dashboard') || pathname?.startsWith('/organizer/events');
  const isSettingsActive = pathname?.startsWith('/organizer/settings');

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        padding: '0.85rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Left: Brand + Back to main site */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            href="/organizer/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'var(--text-primary, #f8fafc)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff8c42)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(255, 90, 54, 0.35)',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                City<span style={{ color: 'var(--primary, #ff5a36)' }}>buzz</span>
              </div>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: 'var(--accent-amber, #f59e0b)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Organizer Hub
              </span>
            </div>
          </Link>

          <span style={{ color: 'var(--border-color)', height: '20px', width: '1px', background: 'var(--border-color)' }} />

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary, #94a3b8)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            title="Return to public discovery platform"
          >
            <ArrowLeft size={13} />
            <span>Main Site</span>
          </Link>
        </div>

        {/* Right Navigation Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/organizer/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isEventsActive ? '#fff' : 'var(--text-secondary, #94a3b8)',
              backgroundColor: isEventsActive ? 'rgba(255, 90, 54, 0.15)' : 'transparent',
              border: isEventsActive ? '1px solid rgba(255, 90, 54, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <Calendar size={15} style={{ color: isEventsActive ? 'var(--primary, #ff5a36)' : 'inherit' }} />
            <span>My Events</span>
          </Link>

          <Link
            href="/organizer/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isSettingsActive ? '#fff' : 'var(--text-secondary, #94a3b8)',
              backgroundColor: isSettingsActive ? 'rgba(255, 90, 54, 0.15)' : 'transparent',
              border: isSettingsActive ? '1px solid rgba(255, 90, 54, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <Settings size={15} style={{ color: isSettingsActive ? 'var(--primary, #ff5a36)' : 'inherit' }} />
            <span>Settings</span>
          </Link>

          {organizerEmail && (
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #94a3b8)',
              }}
              className="organizer-email-pill"
            >
              <User size={12} />
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {organizerEmail}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-muted, #64748b)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Log out from organizer session"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <style jsx>{`
        @media (min-width: 768px) {
          .organizer-email-pill {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}

