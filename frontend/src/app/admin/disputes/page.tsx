'use client';

import React from 'react';
import { Gavel, Info } from 'lucide-react';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function DisputeCenterPage() {
  const { hasPermission } = useAdminAuth();

  if (!hasPermission('resolve_disputes')) {
    return <PermissionDeniedState requiredRole="Support Admin, Trust & Safety Admin or Super Admin" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Reports & Disputes</h1>
            <p className="page-subtitle">
              Arbitration queue for candidate platform reports, company disputes, and policy appeals.
            </p>
          </div>
        </div>
      </div>

      {/* Module Inactive State */}
      <div
        style={{
          padding: '48px 24px',
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Gavel size={24} />
        </div>

        <div style={{ fontSize: '32px', fontWeight: 800, color: '#64748b', letterSpacing: '-0.5px' }}>
          —
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Reports module not yet active
        </h3>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.5 }}>
          The platform reports & disputes module is currently in preview mode. No open dispute cases require administrative arbitration at this time.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '6px',
            background: '#f8fafc',
            border: '1px solid var(--border)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '8px',
          }}
        >
          <Info size={14} />
          <span>Backend table integration pending. Case telemetry will populate when activated.</span>
        </div>
      </div>
    </div>
  );
}
