import React from 'react';
import { Compass } from 'lucide-react';

/** Shared footprints so empty states don't collapse smaller than skeletons. */
export const EMPTY_STATE_MIN_HEIGHT = {
  hero: 480,
  listingGrid: 760,
  dashboardGrid: 640,
  table: 420,
  adminList: 520,
  form: 420,
} as const;

interface BoneProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  style?: React.CSSProperties;
}

export function Bone({ width = '100%', height = 14, radius = 'var(--radius-md)', style }: BoneProps) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function EmptyStateFrame({
  children,
  minHeight,
  className = 'glass-card-static',
  style,
}: {
  children: React.ReactNode;
  minHeight: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        minHeight,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div
      className="glass-card-static"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Bone height={200} radius="0" />
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Bone width="80%" height={20} />
        <Bone width="42%" height={12} />
        <Bone width="100%" height={12} />
        <Bone width="55%" height={14} style={{ marginTop: '6px' }} />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading listings"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        minHeight: EMPTY_STATE_MIN_HEIGHT.listingGrid,
      }}
    >
      <span className="sr-only">Loading listings</span>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 9 }: { count?: number }) {
  const widths = [132, 120, 140, 128, 118, 124, 116, 136, 130];
  return (
    <div role="status" aria-busy="true" aria-label="Loading categories" className="chip-row chip-row--scroll">
      <span className="sr-only">Loading categories</span>
      {Array.from({ length: count }).map((_, i) => (
        <Bone key={i} width={widths[i % widths.length]} height={38} radius="var(--radius-full)" />
      ))}
    </div>
  );
}

export function HeroSliderSkeleton() {
  return (
    <div
      className="glass-card-static"
      role="status"
      aria-busy="true"
      aria-label="Loading upcoming events"
      style={{
        minHeight: EMPTY_STATE_MIN_HEIGHT.hero,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      <span className="sr-only">Loading upcoming events</span>
      <Bone
        height="100%"
        radius="0"
        style={{ position: 'absolute', inset: 0, minHeight: EMPTY_STATE_MIN_HEIGHT.hero }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: EMPTY_STATE_MIN_HEIGHT.hero,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '32px',
          gap: '12px',
        }}
      >
        <Bone width={110} height={24} radius="var(--radius-full)" />
        <Bone width="55%" height={36} />
        <Bone width="38%" height={16} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <Bone width={140} height={42} radius="var(--radius-md)" />
          <Bone width={120} height={42} radius="var(--radius-md)" />
        </div>
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '90px' }} role="status" aria-busy="true">
      <span className="sr-only">Loading place details</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Bone width={160} height={18} />
        <Bone width={130} height={32} radius="var(--radius-full)" />
      </div>
      <div
        className="detail-layout"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '36px' }}
      >
        <div>
          <Bone height={440} radius="var(--radius-xl)" style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <Bone key={i} width={80} height={80} radius="var(--radius-md)" />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Bone width="30%" height={14} />
          <Bone width="85%" height={32} />
          <Bone width="50%" height={16} />
          <Bone width="100%" height={12} />
          <Bone width="100%" height={12} />
          <Bone width="70%" height={12} />
          <Bone height={160} radius="var(--radius-lg)" style={{ marginTop: 12 }} />
          <Bone height={48} radius="var(--radius-md)" />
        </div>
      </div>
      <style>{`
        @media (min-width: 900px) {
          .detail-layout { grid-template-columns: 1.1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export function AdminListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading records"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: EMPTY_STATE_MIN_HEIGHT.adminList }}
    >
      <span className="sr-only">Loading records</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card-static"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Bone width={72} height={72} radius="var(--radius-md)" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Bone width="42%" height={16} />
            <Bone width="68%" height={12} />
            <Bone width="28%" height={10} />
          </div>
          <Bone width={88} height={32} radius="var(--radius-full)" />
        </div>
      ))}
    </div>
  );
}

export function DashboardCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading events"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.5rem',
        minHeight: EMPTY_STATE_MIN_HEIGHT.dashboardGrid,
      }}
    >
      <span className="sr-only">Loading events</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card-static" style={{ overflow: 'hidden', borderRadius: '18px' }}>
          <Bone height={160} radius="0" />
          <div style={{ padding: '1.1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Bone width="78%" height={18} />
            <Bone width="50%" height={12} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              <Bone height={40} />
              <Bone height={40} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading analytics">
      <span className="sr-only">Loading analytics</span>
      <div style={{ marginBottom: '1.5rem' }}>
        <Bone width="46%" height={28} style={{ marginBottom: 12 }} />
        <Bone width="32%" height={14} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card-static" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Bone width="40%" height={12} />
            <Bone width="60%" height={24} />
          </div>
        ))}
      </div>
      <Bone height={240} radius="var(--radius-lg)" />
    </div>
  );
}

export function TableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div
      className="glass-card-static"
      role="status"
      aria-busy="true"
      aria-label="Loading table"
      style={{ overflow: 'hidden', minHeight: EMPTY_STATE_MIN_HEIGHT.table }}
    >
      <span className="sr-only">Loading table</span>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
        <Bone width="22%" height={12} />
        <Bone width="18%" height={12} />
        <Bone width="16%" height={12} />
        <Bone width="14%" height={12} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '16px 20px',
            display: 'flex',
            gap: '16px',
            borderBottom: i === rows - 1 ? 'none' : '1px solid var(--border-color)',
          }}
        >
          <Bone width="24%" height={14} />
          <Bone width="20%" height={14} />
          <Bone width="16%" height={14} />
          <Bone width="12%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function FormSectionSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <span className="sr-only">Loading form</span>
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="glass-card-static" style={{ padding: '1.75rem', borderRadius: '18px' }}>
          <Bone width="30%" height={18} style={{ marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Bone height={44} />
            <Bone height={44} />
            <Bone height={44} />
            <Bone height={44} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DrawerSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading details">
      <span className="sr-only">Loading full details</span>
      <Bone height={220} radius="14px" style={{ marginBottom: 18 }} />
      <Bone width="70%" height={22} style={{ marginBottom: 10 }} />
      <Bone width="40%" height={14} style={{ marginBottom: 18 }} />
      <Bone width="100%" height={12} style={{ marginBottom: 8 }} />
      <Bone width="100%" height={12} style={{ marginBottom: 8 }} />
      <Bone width="80%" height={12} style={{ marginBottom: 22 }} />
      <Bone height={48} />
    </div>
  );
}

export function SessionLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        gap: '1rem',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.2), rgba(245, 158, 11, 0.12))',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Compass size={28} color="var(--primary)" className="spin-animation" />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{message}</p>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }} role="status" aria-busy="true">
      <span className="sr-only">Loading homepage</span>
      <HeroSliderSkeleton />
      <div style={{ margin: '40px 0' }}>
        <Bone width={180} height={12} style={{ marginBottom: 10 }} />
        <Bone width={280} height={24} style={{ marginBottom: 20 }} />
        <CategoryGridSkeleton />
      </div>
      <ListingGridSkeleton count={6} />
    </div>
  );
}

export function ExplorePageSkeleton() {
  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '80px' }} role="status" aria-busy="true">
      <span className="sr-only">Loading city explorer</span>
      <Bone width={140} height={12} style={{ marginBottom: 10 }} />
      <Bone width={320} height={32} style={{ marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="explore-skeleton-layout">
        <div className="glass-card-static" style={{ padding: '20px', height: 'fit-content' }}>
          <Bone width="50%" height={16} style={{ marginBottom: 16 }} />
          <Bone height={40} style={{ marginBottom: 12 }} />
          <Bone height={40} style={{ marginBottom: 12 }} />
          <Bone height={40} />
        </div>
        <ListingGridSkeleton count={6} />
      </div>
      <style>{`
        @media (min-width: 900px) {
          .explore-skeleton-layout { grid-template-columns: 280px 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export function ConfirmationLoader({ reference }: { reference?: string }) {
  return (
    <div className="container" style={{ padding: '90px 20px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
      <div className="glass-card-static" style={{ padding: '48px 24px', borderRadius: '24px' }} role="status" aria-busy="true">
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto',
            borderRadius: '50%',
            border: '2px solid var(--border-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 90, 54, 0.08)',
          }}
        >
          <Compass size={32} color="var(--primary)" className="spin-animation" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '24px', marginBottom: '8px' }}>
          Confirming your payment...
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto' }}>
          Please wait while we confirm your transaction and issue your entrance passes.
        </p>
        {reference ? (
          <div style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Reference: <code>{reference}</code>
          </div>
        ) : (
          <Bone width={180} height={14} style={{ margin: '24px auto 0' }} />
        )}
      </div>
    </div>
  );
}
