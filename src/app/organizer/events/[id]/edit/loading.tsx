import { FormSectionSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <FormSectionSkeleton sections={3} />
      </div>
    </div>
  );
}
