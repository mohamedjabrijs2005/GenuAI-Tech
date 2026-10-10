'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  Eye,
  ArrowRight,
  ShieldCheck,
  Clock,
  Download,
} from 'lucide-react';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface AuditRecordItem {
  id: string;
  actor: string;
  actorEmail?: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  companyId?: string;
  companyName?: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  metadata?: any;
  ipAddress?: string;
}

export default function AuditLogsPage() {
  const { hasPermission } = useAdminAuth();

  const [logs, setLogs] = useState<AuditRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const [selectedLog, setSelectedLog] = useState<AuditRecordItem | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/audit', {
        params: {
          entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
        },
      });
      setLogs(res.data?.logs || []);
    } catch (err: any) {
      console.error('Fetch audit logs error:', err);
      setError('Could not load immutable audit trail from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter]);

  if (!hasPermission('view_audit')) {
    return <PermissionDeniedState requiredRole="Admin or Compliance Officer" />;
  }

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(query) ||
      (l.actor && l.actor.toLowerCase().includes(query)) ||
      (l.entity && l.entity.toLowerCase().includes(query)) ||
      (l.companyName && l.companyName.toLowerCase().includes(query)) ||
      (l.entityId && l.entityId.toLowerCase().includes(query))
    );
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `genuai_postgresql_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('PostgreSQL audit log trail exported.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Audit Trail</h1>
            <p className="page-subtitle">
              Immutable, append-only record of administrative actions, company verification decisions, and vacancy moderation events.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportJSON}
              className="btn btn-secondary btn-sm"
            >
              <Download size={14} /> Export JSON
            </button>
            <button
              type="button"
              onClick={fetchAuditLogs}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Primary Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search action, actor, entity ID, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Entity Filter:
          </span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="form-select"
            style={{ height: '38px', minWidth: '180px', fontSize: '13px' }}
          >
            <option value="ALL">All Entities</option>
            <option value="Company">Company</option>
            <option value="Vacancy">Vacancy</option>
            <option value="User">User</option>
            <option value="IntegritySignal">Integrity Signal</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity Type & ID</th>
              <th>Actor & Role</th>
              <th>Company</th>
              <th>State Transition</th>
              <th>Reason</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading audit logs from PostgreSQL...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No administrative activity has been recorded yet.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {l.timestamp || '—'}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      {l.entity}
                    </div>
                    <code style={{ fontSize: '10.5px', color: '#64748b' }}>
                      {l.entityId}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      {l.actor}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#854d0e', fontWeight: 600 }}>
                      {l.role}
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {l.companyName || '—'}
                  </td>
                  <td>
                    {l.previousState || l.newState ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                        <span style={{ color: '#dc2626' }}>{l.previousState || 'Initial'}</span>
                        <ArrowRight size={12} style={{ color: '#94a3b8' }} />
                        <span style={{ color: '#059669', fontWeight: 700 }}>{l.newState}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Recorded</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.reason || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedLog(l)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Detail Drawer */}
      {selectedLog && (
        <DetailDrawer
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record #${selectedLog.id}`}
          subtitle={`Action: ${selectedLog.action} • Timestamp: ${selectedLog.timestamp}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Actor Identity</span>
              <strong>{selectedLog.actor} ({selectedLog.role})</strong>
              {selectedLog.actorEmail && <div style={{ fontSize: '11.5px', color: '#64748b' }}>{selectedLog.actorEmail}</div>}
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Audit Reason</span>
              <p style={{ marginTop: '2px', color: 'var(--text-primary)' }}>{selectedLog.reason || 'No specific rationale string attached.'}</p>
            </div>

            {selectedLog.metadata && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Raw Metadata
                </h4>
                <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '11.5px', overflowX: 'auto' }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
