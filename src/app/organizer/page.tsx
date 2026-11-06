'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { Loader2 } from 'lucide-react';

export default function OrganizerRootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useOrganizerAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/organizer/dashboard');
      } else {
        router.replace('/organizer/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
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
        Opening organizer portal...
      </p>
    </div>
  );
}

