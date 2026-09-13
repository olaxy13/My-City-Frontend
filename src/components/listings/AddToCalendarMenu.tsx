'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ExternalLink, ChevronDown } from 'lucide-react';
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadIcsFile } from '@/lib/utils';

interface AddToCalendarMenuProps {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string | null;
  location?: string | null;
  variant?: 'outline' | 'primary' | 'secondary' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

export default function AddToCalendarMenu({
  title,
  description = '',
  startDateTime,
  endDateTime,
  location,
  variant = 'outline',
  className = '',
  style,
}: AddToCalendarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const googleUrl = getGoogleCalendarUrl(title, description, startDateTime, endDateTime, location);
  const outlookUrl = getOutlookCalendarUrl(title, description, startDateTime, endDateTime, location);

  const handleDownloadIcs = () => {
    downloadIcsFile(title, description, startDateTime, endDateTime, location);
    setIsOpen(false);
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn btn-primary';
      case 'secondary':
        return 'btn btn-secondary';
      case 'compact':
        return 'btn btn-outline';
      case 'outline':
      default:
        return 'btn btn-outline';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${getButtonClass()} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          ...(variant === 'outline'
            ? { color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '10px 18px' }
            : {}),
          ...style,
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Calendar size={16} />
        <span>Add to Calendar</span>
        <ChevronDown size={14} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 100,
            minWidth: '240px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              padding: '6px 12px 8px 12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-light)',
              marginBottom: '6px',
            }}
          >
            No account needed
          </div>

          {/* Google Calendar */}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              transition: 'background 0.15s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>📅</span>
              <span>Google Calendar</span>
            </div>
            <ExternalLink size={14} color="var(--text-muted)" />
          </a>

          {/* Outlook / Microsoft 365 */}
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              transition: 'background 0.15s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>📧</span>
              <span>Outlook / Office 365</span>
            </div>
            <ExternalLink size={14} color="var(--text-muted)" />
          </a>

          {/* Apple Calendar / .ICS Download */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>🍏</span>
              <div>
                <div>Apple / iCal (.ics)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  Works with iOS, Android & Desktop
                </div>
              </div>
            </div>
            <Download size={14} color="var(--text-muted)" />
          </button>
        </div>
      )}
    </div>
  );
}
