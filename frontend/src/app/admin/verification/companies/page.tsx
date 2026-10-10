'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Eye,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface CompanyRecord {
  id: string;
  name: string;
  domain: string;
  workEmail: string;
  industry: string;
  employeeCount: string;
  registrationNumber: string;
  country: string;
  website: string;
  description: string;
  verificationStatus: string;
  submittedDate: string;
  updatedAt?: string;
  reviewState: string;
  assignedAdmin: string;
  reviewNote: string;
  activeVacanciesCount: number;
}

export default function CompanyVerificationPage() {
  const { hasPermission } = useAdminAuth();

  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Dialog action state
  const [actionType, setActionType] = useState<string | null>(null);
  const [dialogCompany, setDialogCompany] = useState<CompanyRecord | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/companies', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search || undefined,
        },
      });
      setCompanies(res.data?.companies || []);
    } catch (err: any) {
      console.error('Fetch companies error:', err);
      setError('Could not load company verification records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter]);

  const handleOpenDetails = async (comp: CompanyRecord) => {
    setSelectedCompany(comp);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/companies/${comp.id}`);
      setCompanyDetails(res.data);
    } catch (err) {
      console.error('Failed to load company details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenAction = (company: CompanyRecord, targetStatus: string) => {
    setDialogCompany(company);
    setActionType(targetStatus);
  };

  const handleConfirmAction = async (note: string) => {
    if (!dialogCompany || !actionType) return;
    setActionSubmitting(true);
    try {
      await api.put(`/admin/companies/${dialogCompany.id}/status`, {
        status: actionType,
        note,
        reason: note,
      });
      toast.success(`Company ${dialogCompany.name} updated to ${actionType.replace(/_/g, ' ')}`);
      fetchCompanies();
      if (selectedCompany?.id === dialogCompany.id) {
        handleOpenDetails(dialogCompany);
      }
    } catch (err: any) {
      console.error('Status change error:', err);
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionSubmitting(false);
      setActionType(null);
      setDialogCompany(null);
    }
  };

  if (!hasPermission('verify_company')) {
    return <PermissionDeniedState requiredRole="Verification Admin or Super Admin" />;
  }

  // Filter local search
  const filteredCompanies = companies.filter((c) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.workEmail && c.workEmail.toLowerCase().includes(query)) ||
      (c.industry && c.industry.toLowerCase().includes(query))
    );
  });

  // Verification completeness calculation (only from clearly defined fields)
  const calculateCompleteness = (comp: any) => {
    if (!comp) return 0;
    const checks = [
      Boolean(comp.name),
      Boolean(comp.website),
      Boolean(comp.official_email || comp.workEmail),
      Boolean(comp.location || comp.country),
      Boolean(comp.industry),
      Boolean(comp.hiring_contact_name || comp.hiring_contact_email),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Company Verification</h1>
            <p className="page-subtitle">
              Review company registration details before allowing recruitment activity.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchCompanies}
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
              placeholder="Search by company name, email, or industry..."
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
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="ADDITIONAL_INFORMATION_REQUIRED">Information required</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Companies Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact Email</th>
              <th>Industry</th>
              <th>Verification Status</th>
              <th>Vacancies</th>
              <th>Registered Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading company verification records from PostgreSQL...
                </td>
              </tr>
            ) : filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No companies found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((comp) => (
                <tr key={comp.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {comp.name}
                      </div>
                      {comp.website && (
                        <a
                          href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '11.5px', color: '#b8860b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          {comp.website} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {comp.workEmail || '—'}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {comp.industry || 'Technology'}
                  </td>
                  <td>
                    <StatusBadge status={comp.verificationStatus} />
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 600 }}>
                    {comp.activeVacanciesCount ?? 0} active
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {comp.submittedDate || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(comp)}
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

      {/* Company Detail Drawer */}
      {selectedCompany && (
        <DetailDrawer
          isOpen={Boolean(selectedCompany)}
          onClose={() => {
            setSelectedCompany(null);
            setCompanyDetails(null);
          }}
          title={selectedCompany.name}
          subtitle={`Registration ID: ${selectedCompany.id}`}
        >
          {detailsLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading full company profile and audit history...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px' }}>
              {/* Header Status & Completeness */}
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
                    Verification Status
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <StatusBadge status={selectedCompany.verificationStatus} />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Verification Completeness
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#854d0e', marginTop: '2px' }}>
                    {calculateCompleteness(companyDetails?.company || selectedCompany)}%
                  </div>
                </div>
              </div>

              {/* Company Metadata */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Registration Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Official Domain</span>
                    <strong>{companyDetails?.company?.website || selectedCompany.website || '—'}</strong>
                  </div>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Official Email</span>
                    <strong>{companyDetails?.company?.official_email || selectedCompany.workEmail || '—'}</strong>
                  </div>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Industry</span>
                    <strong>{companyDetails?.company?.industry || selectedCompany.industry || '—'}</strong>
                  </div>
                  <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Location / Address</span>
                    <strong>{companyDetails?.company?.location || selectedCompany.country || 'Global'}</strong>
                  </div>
                </div>
              </div>

              {/* Description */}
              {companyDetails?.company?.description && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Company Description
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {companyDetails.company.description}
                  </p>
                </div>
              )}

              {/* Admin Decision Note if exists */}
              {selectedCompany.reviewNote && (
                <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e' }}>
                  <strong style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Previous Review Note:</strong>
                  {selectedCompany.reviewNote}
                </div>
              )}

              {/* Actions Section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Governance Actions
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedCompany.verificationStatus !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedCompany, 'APPROVED')}
                      className="btn btn-gold btn-sm"
                    >
                      <CheckCircle2 size={13} /> Approve Company
                    </button>
                  )}
                  {selectedCompany.verificationStatus !== 'ADDITIONAL_INFORMATION_REQUIRED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedCompany, 'ADDITIONAL_INFORMATION_REQUIRED')}
                      className="btn btn-secondary btn-sm"
                    >
                      <AlertTriangle size={13} /> Request Info
                    </button>
                  )}
                  {selectedCompany.verificationStatus !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedCompany, 'REJECTED')}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '12.5px', fontWeight: 700 }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                  {selectedCompany.verificationStatus !== 'SUSPENDED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(selectedCompany, 'SUSPENDED')}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: '#475569', color: '#ffffff', fontSize: '12.5px', fontWeight: 700 }}
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DetailDrawer>
      )}

      {/* Confirmation Dialog */}
      {dialogCompany && actionType && (
        <ConfirmationDialog
          isOpen={Boolean(dialogCompany && actionType)}
          onClose={() => {
            setActionType(null);
            setDialogCompany(null);
          }}
          onConfirm={handleConfirmAction}
          title={`${actionType.replace(/_/g, ' ')} ${dialogCompany.name}?`}
          message={
            actionType === 'APPROVED'
              ? 'This will allow the company to create and submit recruitment vacancies.'
              : actionType === 'ADDITIONAL_INFORMATION_REQUIRED'
              ? 'The company will need to update its profile before continuing.'
              : actionType === 'REJECTED'
              ? 'Provide a reason for rejection. This reason will be stored in review history.'
              : 'This action will restrict recruitment activity for this company. Provide a reason.'
          }
          confirmLabel={`Confirm ${actionType.replace(/_/g, ' ')}`}
          requireReason={actionType === 'REJECTED' || actionType === 'SUSPENDED' || actionType === 'ADDITIONAL_INFORMATION_REQUIRED'}
          reasonPlaceholder="Enter governance reason..."
        />
      )}
    </div>
  );
}
