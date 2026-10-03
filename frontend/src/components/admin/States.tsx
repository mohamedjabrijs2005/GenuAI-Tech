'use client';

import React from 'react';
import { ShieldAlert, AlertCircle, FileQuestion, RefreshCw } from 'lucide-react';

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ height: '36px', width: '220px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '36px', width: '120px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ height: '48px', background: '#f8fafc', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'No Records Found',
  description = 'There are no items matching this criteria in the platform governance queue.',
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '60px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: '#f8fafc',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <FileQuestion size={24} />
      </div>
      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 0 16px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#b8860b',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Failed to Load Governance Data',
  description = 'An error occurred while communicating with the platform API. Please try reloading.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        background: '#fffbfa',
        borderRadius: '12px',
        border: '1px solid #fed7d7',
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: '#7f1d1d', maxWidth: '440px', margin: '0 0 16px' }}>
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#dc2626',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} /> Retry Request
        </button>
      )}
    </div>
  );
}

export function PermissionDeniedState({
  requiredRole = 'Super Admin',
}: {
  requiredRole?: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
        padding: '64px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: '#fef2f2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
        }}
      >
        <ShieldAlert size={26} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        Access Restricted by Platform RBAC
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 0 16px', lineHeight: 1.5 }}>
        You do not have sufficient administrative privileges to access this governance area. This route requires{' '}
        <span style={{ fontWeight: 700, color: '#b8860b' }}>{requiredRole}</span> role authorization under GenuAI Least-Privilege Trust policy.
      </p>
      <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
        Use the Role Switcher in the top right console bar to simulate elevated permissions.
      </div>
    </div>
  );
}
