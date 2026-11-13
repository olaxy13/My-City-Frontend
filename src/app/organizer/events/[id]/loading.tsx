import { AnalyticsSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <AnalyticsSkeleton />
      </div>
    </div>
  );
}
