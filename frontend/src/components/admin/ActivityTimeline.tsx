'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, FileText, User, ArrowRight, Activity, Clock } from 'lucide-react';
import { AuditRecord } from '@/lib/adminDataService';

interface ActivityTimelineProps {
  logs: AuditRecord[];
  onSelectLog?: (log: AuditRecord) => void;
  maxItems?: number;
}

export function ActivityTimeline({ logs, onSelectLog, maxItems = 8 }: ActivityTimelineProps) {
  const displayed = logs.slice(0, maxItems);

  const getActionIcon = (action: string) => {
    if (action.includes('VERIFIED') || action.includes('APPROVED')) return <ShieldCheck size={14} style={{ color: '#059669' }} />;
    if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('FLAGGED')) return <AlertCircle size={14} style={{ color: '#dc2626' }} />;
    if (action.includes('USER')) return <User size={14} style={{ color: '#2563eb' }} />;
    if (action.includes('EVIDENCE')) return <FileText size={14} style={{ color: '#b8860b' }} />;
    return <Activity size={14} style={{ color: '#64748b' }} />;
  };

  const formatActionTitle = (action: string) => {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
      {displayed.map((log, index) => {
        const isLast = index === displayed.length - 1;
        return (
          <div
            key={log.id}
            onClick={() => onSelectLog && onSelectLog(log)}
            style={{
              display: 'flex',
              gap: '14px',
              cursor: onSelectLog ? 'pointer' : 'default',
              padding: '10px 8px',
              borderRadius: '8px',
              transition: 'background 0.15s ease',
            }}
            className={onSelectLog ? 'hover:bg-slate-50' : ''}
          >
            {/* Timeline icon line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                {getActionIcon(log.action)}
              </div>
              {!isLast && (
                <div style={{ width: '1.5px', flex: 1, background: '#e2e8f0', margin: '4px 0' }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? '0px' : '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatActionTitle(log.action)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                  <Clock size={11} />
                  <span>{log.timestamp}</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{log.actor}</span> ({log.role}) on{' '}
                <span style={{ fontWeight: 600, color: '#b8860b' }}>{log.entity}</span>{' '}
                <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                  {log.entityId}
                </code>
              </div>

              {log.previousState && log.newState && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    fontSize: '11.5px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ color: '#64748b' }}>{log.previousState}</span>
                  <ArrowRight size={11} style={{ color: '#94a3b8' }} />
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{log.newState}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
