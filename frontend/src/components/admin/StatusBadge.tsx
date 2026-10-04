'use client';

import React from 'react';

export type StatusVariant =
  | 'pending'
  | 'pending_review'
  | 'under_review'
  | 'needs_correction'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'flagged'
  | 'active'
  | 'open'
  | 'investigating'
  | 'action_required'
  | 'resolved'
  | 'dismissed'
  | 'escalated'
  | 'operational'
  | 'degraded'
  | 'incident'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export function StatusBadge({ status, variant, size = 'sm', showDot = true }: StatusBadgeProps) {
  const norm = (variant || status.toLowerCase().replace(/\s+/g, '_')) as StatusVariant;

  const getStyle = (): { bg: string; text: string; border: string; dot: string } => {
    switch (norm) {
      case 'verified':
      case 'approved':
      case 'active':
      case 'resolved':
      case 'operational':
        return {
          bg: '#ecfdf5',
          text: '#065f46',
          border: '#a7f3d0',
          dot: '#10b981',
        };
      case 'pending':
      case 'pending_review':
      case 'under_review':
      case 'investigating':
      case 'open':
        return {
          bg: '#eff6ff',
          text: '#1e40af',
          border: '#bfdbfe',
          dot: '#3b82f6',
        };
      case 'needs_correction':
      case 'action_required':
      case 'medium':
      case 'degraded':
      case 'warning' as any:
        return {
          bg: '#fffbeb',
          text: '#92400e',
          border: '#fde68a',
          dot: '#f59e0b',
        };
      case 'rejected':
      case 'suspended':
      case 'flagged':
      case 'incident':
      case 'critical':
      case 'high':
        return {
          bg: '#fef2f2',
          text: '#991b1b',
          border: '#fecaca',
          dot: '#ef4444',
        };
      case 'escalated':
        return {
          bg: '#faf5ff',
          text: '#6b21a8',
          border: '#e9d5ff',
          dot: '#a855f7',
        };
      case 'low':
      case 'dismissed':
      case 'neutral':
      default:
        return {
          bg: '#f1f5f9',
          text: '#475569',
          border: '#cbd5e1',
          dot: '#94a3b8',
        };
    }
  };

  const s = getStyle();
  const pad = size === 'lg' ? '6px 14px' : size === 'md' ? '4px 10px' : '2px 8px';
  const fontSize = size === 'lg' ? '13px' : size === 'md' ? '12px' : '11px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: pad,
        fontSize,
        fontWeight: 600,
        borderRadius: '9999px',
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {showDot && (
        <span
          style={{
            width: size === 'lg' ? 8 : 6,
            height: size === 'lg' ? 8 : 6,
            borderRadius: '50%',
            background: s.dot,
            flexShrink: 0,
          }}
        />
      )}
      {status}
    </span>
  );
}
