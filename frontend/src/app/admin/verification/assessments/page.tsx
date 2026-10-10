'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Shield,
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

export interface AssessmentRecord {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  vacancyTitle: string;
  type: string;
  durationMinutes: number;
  questionCount: number;
  evaluationGroupCount: number;
  status: string;
  integrityConfig: any;
  createdDate: string;
}

export default function AssessmentGovernancePage() {
  const { hasPermission } = useAdminAuth();

  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/assessments');
      setAssessments(res.data?.assessments || []);
    } catch (err: any) {
      console.error('Fetch assessments error:', err);
      setError('Could not load assessment configurations from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  if (!hasPermission('govern_assessment')) {
    return <PermissionDeniedState requiredRole="Verification Admin or Super Admin" />;
  }

  const filteredAssessments = assessments.filter((a) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(query) ||
      (a.companyName && a.companyName.toLowerCase().includes(query)) ||
      (a.vacancyTitle && a.vacancyTitle.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Assessment Configuration Review</h1>
            <p className="page-subtitle">
              Review company assessment structures, evaluation groups, and proctoring settings.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAssessments}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
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
            placeholder="Search by assessment name, company, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px' }}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Assessment Name</th>
              <th>Company</th>
              <th>Vacancy Role</th>
              <th>Duration</th>
              <th>Question Count</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading assessment configurations from PostgreSQL...
                </td>
              </tr>
            ) : filteredAssessments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No assessment configurations found.
                </td>
              </tr>
            ) : (
              filteredAssessments.map((asm) => (
                <tr key={asm.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {asm.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Type: {asm.type || 'Technical Assessment'}
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {asm.companyName}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {asm.vacancyTitle}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {asm.durationMinutes || 60} mins
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 600 }}>
                    {asm.questionCount ?? 0} questions ({asm.evaluationGroupCount ?? 0} groups)
                  </td>
                  <td>
                    <StatusBadge status={asm.status} />
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {asm.createdDate || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedAssessment(asm)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Eye size={13} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {selectedAssessment && (
        <DetailDrawer
          isOpen={Boolean(selectedAssessment)}
          onClose={() => setSelectedAssessment(null)}
          title={selectedAssessment.title}
          subtitle={`Company: ${selectedAssessment.companyName} • ID: ${selectedAssessment.id}`}
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
                  Status
                </span>
                <StatusBadge status={selectedAssessment.status} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Structure
                </span>
                <strong>{selectedAssessment.questionCount} Questions</strong>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Proctoring & Integrity Configuration
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Tab Monitoring</span>
                  <strong>{selectedAssessment.integrityConfig?.tab_monitoring ? 'Enabled' : 'Disabled'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Copy/Paste Control</span>
                  <strong>{selectedAssessment.integrityConfig?.copy_paste_detection ? 'Enabled' : 'Disabled'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Webcam Stream</span>
                  <strong>{selectedAssessment.integrityConfig?.webcam_required ? 'Required' : 'Optional'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Randomized Items</span>
                  <strong>{selectedAssessment.integrityConfig?.randomize_questions ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '6px', color: '#854d0e', fontSize: '12px' }}>
              <strong>Governance Protocol Notice:</strong> Assessments verify technical structure and requirement alignment. Assessment score alone does not guarantee or certify candidate ability.
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
