'use client';

import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  highlight?: 'gold' | 'warning' | 'danger' | 'success' | 'neutral';
  onClick?: () => void;
  badgeText?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = 'neutral',
  onClick,
  badgeText,
}: KPICardProps) {
  const getHighlightBorder = () => {
    switch (highlight) {
      case 'gold':
        return '1px solid rgba(212, 175, 55, 0.4)';
      case 'warning':
        return '1px solid rgba(245, 158, 11, 0.4)';
      case 'danger':
        return '1px solid rgba(239, 68, 68, 0.4)';
      case 'success':
        return '1px solid rgba(16, 185, 129, 0.4)';
      default:
        return '1px solid var(--border)';
    }
  };

  const getIconColor = () => {
    switch (highlight) {
      case 'gold':
        return '#b8860b';
      case 'warning':
        return '#d97706';
      case 'danger':
        return '#dc2626';
      case 'success':
        return '#059669';
      default:
        return '#64748b';
    }
  };

  const getIconBg = () => {
    switch (highlight) {
      case 'gold':
        return 'rgba(212, 175, 55, 0.12)';
      case 'warning':
        return '#fffbeb';
      case 'danger':
        return '#fef2f2';
      case 'success':
        return '#ecfdf5';
      default:
        return '#f8fafc';
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: getHighlightBorder(),
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
      className={onClick ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </span>
          {badgeText && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '99px',
                background: highlight === 'danger' ? '#fee2e2' : '#fef3c7',
                color: highlight === 'danger' ? '#991b1b' : '#92400e',
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: getIconBg(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: getIconColor(),
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      {/* Main value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px', lineHeight: 1.1 }}>
          {value}
        </div>
        {trend && (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: trend.isNeutral ? '#64748b' : trend.isPositive ? '#059669' : '#dc2626',
            }}
          >
            {trend.value}
          </span>
        )}
      </div>

      {/* Subtitle / context */}
      {subtitle && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
