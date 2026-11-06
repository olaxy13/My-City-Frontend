'use client';

import React, { useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

interface SalesChartProps {
  data: { date: string; orders: number; revenue: number }[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="glass-card-static"
        style={{
          padding: '2.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          color: 'var(--text-muted, #64748b)',
          border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
          backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
        }}
      >
        <TrendingUp size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontWeight: 500 }}>No sales recorded yet for this event.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Sales activity will appear here in real time as tickets are purchased.
        </p>
      </div>
    );
  }

  // Calculate SVG dimensions and coordinate scaling
  const width = 700;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => (activeMetric === 'revenue' ? d.revenue : d.orders));
  const maxValue = Math.max(...values, 1);

  // Compute points
  const points = data.map((d, index) => {
    const x =
      data.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (index / (data.length - 1)) * innerWidth;
    const val = activeMetric === 'revenue' ? d.revenue : d.orders;
    const y = padding.top + innerHeight - (val / maxValue) * innerHeight;
    return { x, y, data: d };
  });

  // Construct SVG path string
  let pathD = '';
  if (points.length === 1) {
    pathD = `M ${padding.left} ${points[0].y} L ${padding.left + innerWidth} ${points[0].y}`;
  } else {
    pathD = points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }

  // Area path for gradient fill
  const areaD =
    points.length === 1
      ? `M ${padding.left} ${points[0].y} L ${padding.left + innerWidth} ${points[0].y} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`
      : `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  const totalSum = data.reduce(
    (acc, cur) => acc + (activeMetric === 'revenue' ? cur.revenue : cur.orders),
    0
  );

  return (
    <div
      className="glass-card-static"
      style={{
        borderRadius: '16px',
        border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
        backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
        padding: '1.5rem',
      }}
    >
      {/* Header with Title and Toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary, #ff5a36)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
              Sales by Day
            </h3>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
            Total {activeMetric === 'revenue' ? 'Revenue' : 'Orders'}:{' '}
            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
              {activeMetric === 'revenue' ? `₦${totalSum.toLocaleString()}` : totalSum.toLocaleString()}
            </strong>
          </p>
        </div>

        {/* Metric Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          }}
        >
          <button
            onClick={() => setActiveMetric('revenue')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeMetric === 'revenue' ? 'var(--primary, #ff5a36)' : 'transparent',
              color: activeMetric === 'revenue' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease',
            }}
          >
            Revenue (₦)
          </button>
          <button
            onClick={() => setActiveMetric('orders')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeMetric === 'orders' ? 'var(--primary, #ff5a36)' : 'transparent',
              color: activeMetric === 'orders' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease',
            }}
          >
            Orders Count
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff5a36" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid horizontal lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = padding.top + innerHeight * (1 - pct);
            const val = Math.round(maxValue * pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted, #64748b)"
                >
                  {activeMetric === 'revenue' ? (val >= 1000 ? `${Math.round(val / 1000)}k` : val) : val}
                </text>
              </g>
            );
          })}

          {/* Gradient area */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary, #ff5a36)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots & hover zones */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible large hit target */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#fff"
                  stroke="var(--primary, #ff5a36)"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'r 0.15s ease' }}
                />

                {/* X-axis date labels */}
                {(data.length <= 8 || idx % Math.ceil(data.length / 6) === 0 || idx === data.length - 1) && (
                  <text
                    x={pt.x}
                    y={padding.top + innerHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-secondary, #94a3b8)"
                  >
                    {pt.data.date ? pt.data.date.slice(5) : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(10, 13, 20, 0.95)',
              border: '1px solid rgba(255, 90, 54, 0.4)',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              fontSize: '0.75rem',
              color: '#fff',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '2px' }}>
              {points[hoveredIndex].data.date}
            </div>
            <div>
              Revenue:{' '}
              <strong style={{ color: '#10b981' }}>
                ₦{points[hoveredIndex].data.revenue.toLocaleString()}
              </strong>
            </div>
            <div>
              Orders:{' '}
              <strong style={{ color: 'var(--primary, #ff5a36)' }}>
                {points[hoveredIndex].data.orders}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

