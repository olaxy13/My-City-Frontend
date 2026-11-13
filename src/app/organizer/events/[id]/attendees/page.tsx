'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { OrganizerAttendee } from '@/types/api';
import OrganizerGuard from '@/components/organizer/OrganizerGuard';
import OrganizerNav from '@/components/organizer/OrganizerNav';
import AttendeeTable from '@/components/organizer/AttendeeTable';
import { TableSkeleton } from '@/components/ui/Skeletons';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

export default function OrganizerAttendeesPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useOrganizerAuth();

  const [attendees, setAttendees] = useState<OrganizerAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchAttendees = async () => {
    if (!id) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getOrganizerAttendees(id);
      if (requestId !== requestIdRef.current) return;
      setAttendees(data || []);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || 'Failed to load attendees list. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }
  };

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    setHasLoaded(false);
    fetchAttendees();
  }, [id, isAuthLoading, isAuthenticated]);

  const handleExportCSV = async () => {
    if (!id) return;
    setIsExporting(true);

    try {
      const exportUrl = api.getOrganizerAttendeesExportUrl(id);
      const token = localStorage.getItem('citybuzz_organizer_token');

      // Attempt authenticated fetch with Blob download
      const res = await fetch(exportUrl, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `attendees-${id}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Fallback to direct window.open with token param
        window.open(`${exportUrl}?token=${token || ''}`, '_blank');
      }
    } catch (err) {
      console.warn('Blob download failed, falling back to window.open:', err);
      const exportUrl = api.getOrganizerAttendeesExportUrl(id);
      const token = localStorage.getItem('citybuzz_organizer_token');
      window.open(`${exportUrl}?token=${token || ''}`, '_blank');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <OrganizerGuard>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #0a0d14)', display: 'flex', flexDirection: 'column' }}>
        <OrganizerNav />

        <main style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>
          {/* Back button */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              href={`/organizer/events/${id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.825rem',
                color: 'var(--text-secondary, #94a3b8)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Event Analytics</span>
            </Link>

            <button
              onClick={fetchAttendees}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={isLoading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {(isLoading || !hasLoaded) && attendees.length === 0 && !error ? (
            <TableSkeleton rows={8} />
          ) : error && attendees.length === 0 && hasLoaded ? (
            <div
              className="glass-card-static"
              style={{
                padding: '2.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 0.75rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#f87171' }}>Unable to load attendees</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>{error}</p>
              <button
                onClick={fetchAttendees}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              style={{
                opacity: isLoading ? 0.55 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
            >
              <AttendeeTable
                attendees={attendees}
                onExport={handleExportCSV}
                isExporting={isExporting}
              />
            </div>
          )}
        </main>
      </div>
    </OrganizerGuard>
  );
}

