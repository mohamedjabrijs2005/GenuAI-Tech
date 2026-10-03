'use client';

import React, { ReactNode } from 'react';

interface AreaChartDataPoint {
  label: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type?: 'area' | 'bar' | 'donut';
  data: AreaChartDataPoint[];
  color?: string;
  height?: number;
  totalLabel?: string;
  badge?: string;
  headerAction?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  type = 'area',
  data,
  color = '#b8860b',
  height = 180,
  totalLabel,
  badge,
  headerAction,
}: ChartCardProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Area path generator
  const width = 500;
  const paddingX = 20;
  const paddingY = 20;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1 || 1)) * graphWidth;
    const y = paddingY + graphHeight - (d.value / maxValue) * graphHeight;
    return { x, y, ...d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingY + graphHeight} L ${points[0].x} ${paddingY + graphHeight} Z`
    : '';

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            {badge && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  color: '#92400e',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerAction || (
          totalLabel && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {total.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{totalLabel}</div>
            </div>
          )
        )}
      </div>

      {/* Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', height }}>
        {type === 'area' && (
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={width - paddingX} y2={paddingY + graphHeight / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1={paddingX} y1={paddingY + graphHeight} x2={width - paddingX} y2={paddingY + graphHeight} stroke="#e2e8f0" />

            {/* Area Fill */}
            <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />

            {/* Line Stroke */}
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke={color} strokeWidth="2" />
                <text
                  x={p.x}
                  y={paddingY + graphHeight + 14}
                  fontSize="9.5"
                  fill="#94a3b8"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        )}

        {type === 'bar' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '12px', padding: '10px 0 20px' }}>
            {data.map((d, i) => {
              const pct = (d.value / maxValue) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    {d.value}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${pct}%`,
                      background: color,
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
