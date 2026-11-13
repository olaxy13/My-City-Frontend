import { AdminListRowSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <AdminListRowSkeleton count={5} />
      </div>
    </div>
  );
}
