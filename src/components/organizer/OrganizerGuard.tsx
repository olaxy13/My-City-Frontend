'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { Loader2 } from 'lucide-react';

export default function OrganizerGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useOrganizerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/organizer/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--bg-main, #0a0d14)',
          gap: '1rem',
        }}
      >
        <Loader2
          size={36}
          style={{
            color: 'var(--primary, #ff5a36)',
            animation: 'spin 1s linear infinite',
          }}
        />
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
        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.875rem' }}>
          Loading organizer session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

