'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Search,
  RefreshCw,
  Building2,
  FileText,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface VacancyRecord {
  id: string;
  companyId: string;
  companyName: string;
  companyVerificationStatus: string;
  roleTitle: string;
  version: string;
  department: string;
  experienceLevel: string;
  employmentType: string;
  location: string;
  workMode?: string;
  status: string;
  submittedDate: string;
  assignedAdmin?: string;
  reviewNote?: string;
  requirementsCount: number;
  applicantCount: number;
}

export default function VacancyModerationPage() {
  const { hasPermission } = useAdminAuth();

  const [vacancies, setVacancies] = useState<VacancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedVacancy, setSelectedVacancy] = useState<VacancyRecord | null>(null);
  const [vacancyDetails, setVacancyDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Dialog action state
  const [actionType, setActionType] = useState<string | null>(null);
  const [dialogVacancy, setDialogVacancy] = useState<VacancyRecord | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchVacancies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/vacancies', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search || undefined,
        },
      });
      setVacancies(res.data?.vacancies || []);
    } catch (err: any) {
      console.error('Fetch vacancies error:', err);
      setError('Could not load vacancy moderation records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, [statusFilter]);

  const handleOpenDetails = async (vac: VacancyRecord) => {
    setSelectedVacancy(vac);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/vacancies/${vac.id}`);
      setVacancyDetails(res.data);
    } catch (err) {
      console.error('Failed to load vacancy details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenAction = (vac: VacancyRecord, targetStatus: string) => {
    setDialogVacancy(vac);
    setActionType(targetStatus);
  };

  const handleConfirmAction = async (note: string) => {
    if (!dialogVacancy || !actionType) return;
    setActionSubmitting(true);
    try {
      await api.put(`/admin/vacancies/${dialogVacancy.id}/status`, {
        status: actionType,
        note,
        reason: note,
      });
      toast.success(`Vacancy ${dialogVacancy.roleTitle} updated to ${actionType.replace(/_/g, ' ')}`);
      fetchVacancies();
      if (selectedVacancy?.id === dialogVacancy.id) {
        handleOpenDetails(dialogVacancy);
      }
    } catch (err: any) {
      console.error('Status change error:', err);
      toast.error(err.response?.data?.error || 'Failed to update vacancy status');
    } finally {
      setActionSubmitting(false);
      setActionType(null);
      setDialogVacancy(null);
    }
  };

  if (!hasPermission('govern_vacancy')) {
    return <PermissionDeniedState requiredRole="Verification Admin or Super Admin" />;
  }

  const filteredVacancies = vacancies.filter((v) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      v.roleTitle.toLowerCase().includes(query) ||
      (v.companyName && v.companyName.toLowerCase().includes(query)) ||
      (v.department && v.department.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Vacancy Moderation</h1>
            <p className="page-subtitle">
              Review vacancies before candidate visibility.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchVacancies}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by role title, company, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Status Filter:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ height: '38px', minWidth: '210px', fontSize: '13px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_ADMIN_REVIEW">Pending review</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
            <option value="APPROVED">Approved</option>
            <option value="PUBLISHED">Published</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Vacancies Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Vacancy Title</th>
              <th>Company</th>
              <th>Department</th>
              <th>Role / Experience</th>
              <th>Requirements</th>
              <th>Status</th>
              <th>Submitted Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading vacancy moderation records from PostgreSQL...
                </td>
              </tr>
            ) : filteredVacancies.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No vacancies found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredVacancies.map((vac) => (
                <tr key={vac.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {vac.roleTitle}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Version: {vac.version || 'v1.0'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      {vac.companyName}
                    </div>
                    <div style={{ fontSize: '11px', color: vac.companyVerificationStatus === 'APPROVED' ? '#059669' : '#d97706' }}>
                      Company: {vac.companyVerificationStatus || 'Unverified'}
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {vac.department || 'General'}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <span style={{ textTransform: 'capitalize' }}>{vac.experienceLevel || 'Mid'}</span> ({vac.employmentType || 'Full-time'})
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 600 }}>
                    {vac.requirementsCount ?? 0} requirements
                  </td>
                  <td>
                    <StatusBadge status={vac.status} />
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {vac.submittedDate || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(vac)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Eye size={13} /> Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vacancy Detail Drawer */}
      {selectedVacancy && (
        <DetailDrawer
          isOpen={Boolean(selectedVacancy)}
          onClose={() => {
            setSelectedVacancy(null);
            setVacancyDetails(null);
          }}
          title={selectedVacancy.roleTitle}
          subtitle={`Company: ${selectedVacancy.companyName} • ID: ${selectedVacancy.id}`}
        >
          {detailsLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading full vacancy requirements and audit history...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px' }}>
              {/* Company & Status Header */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Vacancy Governance Status
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <StatusBadge status={selectedVacancy.status} />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Company Verification
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: vacancyDetails?.vacancy?.companyVerificationStatus === 'APPROVED' ? '#059669' : '#dc2626', marginTop: '4px' }}>
                    {vacancyDetails?.vacancy?.companyVerificationStatus || selectedVacancy.companyVerificationStatus || 'Unverified'}
                  </div>
                </div>
              </div>

              {/* Vacancy Details Grid */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Role Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Department</span>
                    <strong>{vacancyDetails?.vacancy?.department || selectedVacancy.department}</strong>
                  </div>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Experience Level</span>
                    <strong style={{ textTransform: 'capitalize' }}>{vacancyDetails?.vacancy?.experienceLevel || selectedVacancy.experienceLevel}</strong>
                  </div>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Employment Type</span>
                    <strong style={{ textTransform: 'capitalize' }}>{vacancyDetails?.vacancy?.employmentType || selectedVacancy.employmentType}</strong>
                  </div>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Location & Mode</span>
                    <strong>{vacancyDetails?.vacancy?.location || selectedVacancy.location} ({vacancyDetails?.vacancy?.workMode || 'Hybrid'})</strong>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              {vacancyDetails?.vacancy?.jobDescription && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Job Description
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {vacancyDetails.vacancy.jobDescription}
                  </p>
                </div>
              )}

              {/* Requirements List */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Defined Requirements ({vacancyDetails?.requirements?.length || 0})
                </h4>
                {(!vacancyDetails?.requirements || vacancyDetails.requirements.length === 0) ? (
                  <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e', fontSize: '12.5px' }}>
                    Warning: No requirements attached to this vacancy yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {vacancyDetails.requirements.map((req: any) => (
                      <div
                        key={req.id}
                        style={{
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Category: {req.category} • Priority: {req.priority} • Eval Method: {req.eval_method || 'Official Assessment'}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: req.req_type === 'Required' ? '#fef3c7' : '#f1f5f9',
                            color: req.req_type === 'Required' ? '#92400e' : '#475569',
                          }}
                        >
                          {req.req_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Moderation Actions
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedVacancy.status !== 'APPROVED' && selectedVacancy.status !== 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedVacancy, 'APPROVED')}
                      className="btn btn-gold btn-sm"
                    >
                      <CheckCircle2 size={13} /> Approve Vacancy
                    </button>
                  )}
                  {selectedVacancy.status !== 'CHANGES_REQUESTED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedVacancy, 'CHANGES_REQUESTED')}
                      className="btn btn-secondary btn-sm"
                    >
                      <AlertTriangle size={13} /> Request Changes
                    </button>
                  )}
                  {selectedVacancy.status !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedVacancy, 'REJECTED')}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12.5px', fontWeight: 700 }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                  {selectedVacancy.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedVacancy, 'PAUSED')}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: '12.5px', fontWeight: 700 }}
                    >
                      Pause Vacancy
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DetailDrawer>
      )}

      {/* Confirmation Dialog */}
      {dialogVacancy && actionType && (
        <ConfirmationDialog
          isOpen={Boolean(dialogVacancy && actionType)}
          onClose={() => {
            setActionType(null);
            setDialogVacancy(null);
          }}
          onConfirm={handleConfirmAction}
          title={`${actionType.replace(/_/g, ' ')} "${dialogVacancy.roleTitle}"?`}
          message={
            actionType === 'APPROVED'
              ? 'This will approve the vacancy specifications for recruitment publication. Note: Company must be approved.'
              : actionType === 'CHANGES_REQUESTED'
              ? 'The vacancy will return to the company action queue for necessary updates.'
              : actionType === 'REJECTED'
              ? 'Provide a reason. The rejected vacancy will not be visible to candidates.'
              : 'Provide a reason for pausing this vacancy.'
          }
          confirmLabel={`Confirm ${actionType.replace(/_/g, ' ')}`}
          requireReason={actionType === 'REJECTED' || actionType === 'CHANGES_REQUESTED' || actionType === 'PAUSED'}
          reasonPlaceholder="Enter review note..."
        />
      )}
    </div>
  );
}
