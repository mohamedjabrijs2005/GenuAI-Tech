'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Eye,
  ArrowRight,
  ShieldCheck,
  User,
  Clock,
  Layers,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, AuditRecord } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const { hasPermission } = useAdminAuth();
  const [logs, setLogs] = useState<AuditRecord[]>(adminDataService.getAuditLogs());
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const refresh = () => {
    setLogs(adminDataService.getAuditLogs());
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, []);

  if (!hasPermission('view_audit')) {
    return <PermissionDeniedState requiredRole="Admin or Compliance Officer" />;
  }

  const filtered = logs.filter((log) => {
    const match =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'COMPANIES') return log.entity === 'Company';
    if (activeTab === 'VACANCIES') return log.entity === 'Vacancy';
    if (activeTab === 'ASSESSMENTS') return log.entity === 'Assessment';
    if (activeTab === 'SECURITY') return log.entity === 'SecurityEvent' || log.action.includes('SECURITY');
    if (activeTab === 'EVIDENCE') return log.entity === 'EvidenceVault' || log.action.includes('EVIDENCE');
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `genuai_audit_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Immutable audit log archive exported.');
  };

  const columns: Column<AuditRecord>[] = [
    {
      key: 'action',
      header: 'Audited Action & Entity',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.action}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: '#854d0e' }}>{item.entity}</span> •{' '}
            <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
              {item.entityId}
            </code>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actor',
      header: 'Admin Actor',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.actor}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.role}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'stateTransition',
      header: 'State Mutation',
      render: (item) => {
        if (!item.previousState && !item.newState) return <span style={{ color: '#94a3b8' }}>—</span>;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>{item.previousState || 'Initial'}</span>
            <ArrowRight size={12} style={{ color: '#94a3b8' }} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.newState}</span>
          </div>
        );
      },
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.timestamp}</span>,
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Detail',
      align: 'right',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(item);
          }}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#f8fafc',
            border: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Eye size={13} /> View Log
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Immutable Platform Audit Log
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#854d0e',
              }}
            >
              Append-Only Ledger
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Every state mutation, verification change, dispute resolution, and evidence inspection is cryptographically signed and stored.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            fontSize: '12.5px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Download size={14} /> Export Audit Ledger (.JSON)
        </button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter audit records by action, actor, entity ID..."
        tabs={[
          { key: 'ALL', label: 'All Records', count: logs.length },
          { key: 'COMPANIES', label: 'Company Events', count: logs.filter((l) => l.entity === 'Company').length },
          { key: 'VACANCIES', label: 'Vacancy Events', count: logs.filter((l) => l.entity === 'Vacancy').length },
          { key: 'ASSESSMENTS', label: 'Assessment Events', count: logs.filter((l) => l.entity === 'Assessment').length },
          { key: 'SECURITY', label: 'Security & WAF', count: logs.filter((l) => l.entity === 'SecurityEvent').length },
          { key: 'EVIDENCE', label: 'Evidence Vault Access', count: logs.filter((l) => l.entity === 'EvidenceVault').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedLog(item)}
        selectedId={selectedLog?.id}
      />

      {/* Audit Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Record Detail"
        subtitle={`Log ID: ${selectedLog?.id}`}
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Action & Scope
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Action Type</div>
                  <div style={{ fontWeight: 700, color: '#854d0e' }}>{selectedLog.action}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entity Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.entity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entity Identifier</div>
                  <code style={{ fontSize: '11.5px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                    {selectedLog.entityId}
                  </code>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Timestamp</div>
                  <div>{selectedLog.timestamp}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Signer & Actor Attribution
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actor Name</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.actor}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Platform Role</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.role}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Origin IP Address</div>
                  <div style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress || '—'}</div>
                </div>
              </div>
            </div>

            {selectedLog.metadata && (
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Cryptographic Payload Metadata
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
