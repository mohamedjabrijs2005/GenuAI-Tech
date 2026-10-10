'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Search,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface IntegritySignalRecord {
  id: string;
  applicationId: string;
  companyId: string;
  companyName: string;
  vacancyTitle: string;
  candidateName: string;
  candidateEmail: string;
  signalType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  details: any;
  status: string;
  signalTime: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
}

export default function PlatformIntegrityPage() {
  const { hasPermission } = useAdminAuth();

  const [signals, setSignals] = useState<IntegritySignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedSignal, setSelectedSignal] = useState<IntegritySignalRecord | null>(null);

  // Dialog state
  const [dialogAction, setDialogAction] = useState<string | null>(null);
  const [targetSignal, setTargetSignal] = useState<IntegritySignalRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/integrity', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      setSignals(res.data?.signals || []);
    } catch (err: any) {
      console.error('Fetch integrity signals error:', err);
      setError('Could not load integrity records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [statusFilter]);

  const handleConfirmAction = async (note: string) => {
    if (!targetSignal || !dialogAction) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/integrity/${targetSignal.id}`, {
        status: dialogAction,
        reviewNote: note,
      });
      toast.success(`Integrity signal #${targetSignal.id.slice(0, 8)} updated to ${dialogAction}`);
      fetchSignals();
    } catch (err: any) {
      console.error('Signal review error:', err);
      toast.error(err.response?.data?.error || 'Failed to update integrity signal');
    } finally {
      setSubmitting(false);
      setDialogAction(null);
      setTargetSignal(null);
    }
  };

  if (!hasPermission('inspect_evidence')) {
    return <PermissionDeniedState requiredRole="Trust & Safety Admin or Super Admin" />;
  }

  const filteredSignals = signals.filter((s) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      s.id.toLowerCase().includes(query) ||
      s.signalType.toLowerCase().includes(query) ||
      (s.companyName && s.companyName.toLowerCase().includes(query)) ||
      (s.vacancyTitle && s.vacancyTitle.toLowerCase().includes(query)) ||
      (s.candidateName && s.candidateName.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Integrity Review</h1>
            <p className="page-subtitle">
              Integrity signal detected — review required. Audit observable telemetry signals objectively.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSignals}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
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
            placeholder="Search by signal type, company, or vacancy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Status Filter:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ height: '38px', minWidth: '200px', fontSize: '13px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Candidate explanation requested">Explanation Requested</option>
            <option value="Resolved">Resolved</option>
            <option value="No action">No action</option>
            <option value="Assessment attempt invalidated">Attempt Invalidated</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Signals Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Signal ID</th>
              <th>Signal Type</th>
              <th>Company & Vacancy</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Detected Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading integrity signals from PostgreSQL...
                </td>
              </tr>
            ) : filteredSignals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No integrity signals recorded.
                </td>
              </tr>
            ) : (
              filteredSignals.map((sig) => (
                <tr key={sig.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12.5px', fontFamily: 'monospace' }}>
                      #{sig.id.slice(0, 8)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {sig.signalType}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      {sig.vacancyTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {sig.companyName}
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        sig.severity === 'Critical' || sig.severity === 'High'
                          ? 'priority-high'
                          : sig.severity === 'Medium'
                          ? 'priority-medium'
                          : 'priority-low'
                      }
                    >
                      {sig.severity} Severity
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={sig.status} />
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {sig.signalTime ? sig.signalTime.replace('T', ' ').substring(0, 16) : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedSignal(sig)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Eye size={13} /> Review Context
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Signal Detail Drawer */}
      {selectedSignal && (
        <DetailDrawer
          isOpen={Boolean(selectedSignal)}
          onClose={() => setSelectedSignal(null)}
          title={`Integrity Signal #${selectedSignal.id.slice(0, 8)}`}
          subtitle={`Type: ${selectedSignal.signalType} • Severity: ${selectedSignal.severity}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Current Status
                </span>
                <StatusBadge status={selectedSignal.status} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Telemetry Timestamp
                </span>
                <strong>{selectedSignal.signalTime ? selectedSignal.signalTime.replace('T', ' ').substring(0, 19) : '—'}</strong>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Context & Related Entity
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Company</span>
                  <strong>{selectedSignal.companyName}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Vacancy</span>
                  <strong>{selectedSignal.vacancyTitle}</strong>
                </div>
              </div>
            </div>

            {selectedSignal.reviewNote && (
              <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e' }}>
                <strong style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Reviewer Note:</strong>
                {selectedSignal.reviewNote}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Governance Actions
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSignal(selectedSignal);
                    setDialogAction('No action');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Mark No Action
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSignal(selectedSignal);
                    setDialogAction('Candidate explanation requested');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Request Explanation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSignal(selectedSignal);
                    setDialogAction('Resolved');
                  }}
                  className="btn btn-gold btn-sm"
                >
                  Resolve Signal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSignal(selectedSignal);
                    setDialogAction('Assessment attempt invalidated');
                  }}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12.5px', fontWeight: 700 }}
                >
                  Invalidate Attempt
                </button>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Confirmation Dialog */}
      {targetSignal && dialogAction && (
        <ConfirmationDialog
          isOpen={Boolean(targetSignal && dialogAction)}
          onClose={() => {
            setDialogAction(null);
            setTargetSignal(null);
          }}
          onConfirm={handleConfirmAction}
          title={`Set status '${dialogAction}' on signal #${targetSignal.id.slice(0, 8)}?`}
          message="Provide a governance review note for the audit record."
          confirmLabel={`Confirm ${dialogAction}`}
          requireReason={true}
          reasonPlaceholder="Enter review explanation..."
        />
      )}
    </div>
  );
}
