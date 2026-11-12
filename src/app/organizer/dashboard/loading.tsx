import { Bone, DashboardCardSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Bone width={180} height={28} style={{ marginBottom: 10 }} />
          <Bone width={320} height={14} />
        </div>
        <DashboardCardSkeleton count={6} />
      </div>
    </div>
  );
}
