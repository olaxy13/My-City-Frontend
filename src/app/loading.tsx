import HomeHero from '@/components/home/HomeHero';
import { HomeBelowHeroSkeleton } from '@/components/ui/Skeletons';

/**
 * Home loading state: the real hero (heading, search, date chips and the intro
 * card) shows straight away, since none of it needs data; only the sections
 * below it use placeholders.
 */
export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      <HomeHero items={[]} isLoading />
      <HomeBelowHeroSkeleton />
    </div>
  );
}
