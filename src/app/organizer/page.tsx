'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizerAuth } from '@/context/OrganizerAuthContext';
import { SessionLoader } from '@/components/ui/Skeletons';

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

  return <SessionLoader message="Opening organizer portal..." />;
}

