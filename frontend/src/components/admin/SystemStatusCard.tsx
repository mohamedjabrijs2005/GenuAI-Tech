'use client';

import React from 'react';
import { SubsystemHealth } from '@/lib/adminDataService';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface SubsystemItem {
  name: string;
  status: SubsystemHealth;
  latencyMs: number;
  uptimePercent: number;
  lastIncident?: string;
}

interface SystemStatusCardProps {
  subsystems: SubsystemItem[];
  title?: string;
}

export function SystemStatusCard({ subsystems, title = 'System & Infrastructure Health' }: SystemStatusCardProps) {
  const getStatusIcon = (status: SubsystemHealth) => {
    switch (status) {
      case 'Operational':
        return <CheckCircle2 size={15} style={{ color: '#059669' }} />;
      case 'Degraded':
        return <AlertTriangle size={15} style={{ color: '#d97706' }} />;
      case 'Incident':
        return <XCircle size={15} style={{ color: '#dc2626' }} />;
    }
  };

  const getStatusBadge = (status: SubsystemHealth) => {
    switch (status) {
      case 'Operational':
        return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
      case 'Degraded':
        return { bg: '#fffbeb', color: '#92400e', border: '#fde68a' };
      case 'Incident':
        return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: '#b8860b' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h3>
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '99px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          ALL CORE SERVICES OPERATIONAL
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {subsystems.map((sub) => {
          const badge = getStatusBadge(sub.status);
          return (
            <div
              key={sub.name}
              style={{
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getStatusIcon(sub.status)}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {sub.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {sub.uptimePercent}% uptime 30-day SLA
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    {sub.latencyMs} ms
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Latency</div>
                </div>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {sub.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
