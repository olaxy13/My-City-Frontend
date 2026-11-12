'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { SessionLoader } from '@/components/ui/Skeletons';

export default function OrganizerGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useOrganizerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/organizer/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <SessionLoader message="Loading organizer session..." />;
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

