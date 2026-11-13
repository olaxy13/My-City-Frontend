import { FormSectionSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '860px' }}>
      <FormSectionSkeleton sections={3} />
    </div>
  );
}
