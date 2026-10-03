'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, AdminCompany, VerificationStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function CompanyVerificationPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [companies, setCompanies] = useState<AdminCompany[]>(adminDataService.getCompanies());
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Action Dialog state
  const [actionType, setActionType] = useState<VerificationStatus | null>(null);
  const [dialogCompany, setDialogCompany] = useState<AdminCompany | null>(null);

  const refreshCompanies = () => {
    const list = adminDataService.getCompanies();
    setCompanies(list);
    if (selectedCompany) {
      const updated = list.find((c) => c.id === selectedCompany.id);
      if (updated) setSelectedCompany(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refreshCompanies);
    return () => unsub();
  }, [selectedCompany]);

  if (!hasPermission('verify_company')) {
    return <PermissionDeniedState requiredRole="Verification Admin or Super Admin" />;
  }

  // Filter logic
  const filteredCompanies = companies.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.domain.toLowerCase().includes(search.toLowerCase()) ||
      comp.industry.toLowerCase().includes(search.toLowerCase()) ||
      comp.registrationNumber.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'PENDING') return comp.verificationStatus === 'Pending' || comp.verificationStatus === 'Under Review';
    if (activeTab === 'CORRECTION') return comp.verificationStatus === 'Needs Correction';
    if (activeTab === 'VERIFIED') return comp.verificationStatus === 'Verified';
    if (activeTab === 'REJECTED') return comp.verificationStatus === 'Rejected' || comp.verificationStatus === 'Suspended';
    return true;
  });

  const handleOpenAction = (company: AdminCompany, status: VerificationStatus) => {
    setDialogCompany(company);
    setActionType(status);
  };

  const handleConfirmAction = (note: string) => {
    if (!dialogCompany || !actionType) return;
    adminDataService.updateCompanyStatus(
      dialogCompany.id,
      actionType,
      adminUser.name,
      adminUser.role,
      note
    );
    toast.success(`Company ${dialogCompany.name} marked as ${actionType}`);
    setActionType(null);
    setDialogCompany(null);
  };

  const columns: Column<AdminCompany>[] = [
    {
      key: 'name',
      header: 'Company & Domain',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{item.domain}</span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#854d0e', fontWeight: 600 }}>{item.country}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'industry',
      header: 'Industry / Size',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{item.industry}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.employeeCount} employees</div>
        </div>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification Status',
      render: (item) => <StatusBadge status={item.verificationStatus} />,
      sortable: true,
    },
    {
      key: 'submittedDate',
      header: 'Submitted Date',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.submittedDate}</span>
      ),
      sortable: true,
    },
    {
      key: 'reviewState',
      header: 'Review State',
      render: (item) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: '#f1f5f9',
            color: '#475569',
          }}
        >
          {item.reviewState}
        </span>
      ),
    },
    {
      key: 'assignedAdmin',
      header: 'Assigned Admin',
      render: (item) => (
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{item.assignedAdmin}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Governance Action',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedCompany(item)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Eye size={13} /> Review
          </button>
        </div>
      ),
    },
  ];

  const pendingCount = companies.filter((c) => c.verificationStatus === 'Pending' || c.verificationStatus === 'Under Review').length;
  const correctionCount = companies.filter((c) => c.verificationStatus === 'Needs Correction').length;
  const verifiedCount = companies.filter((c) => c.verificationStatus === 'Verified').length;
  const rejectedCount = companies.filter((c) => c.verificationStatus === 'Rejected' || c.verificationStatus === 'Suspended').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Company Verification
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
              Platform Trust Center
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Audit and certify corporate identities, DNS ownership, registration documents, and platform trust score.
          </p>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter companies by name, domain, industry, tax ID..."
        tabs={[
          { key: 'ALL', label: 'All Companies', count: companies.length },
          { key: 'PENDING', label: 'Pending Verification', count: pendingCount },
          { key: 'CORRECTION', label: 'Needs Correction', count: correctionCount },
          { key: 'VERIFIED', label: 'Verified Entities', count: verifiedCount },
          { key: 'REJECTED', label: 'Rejected / Suspended', count: rejectedCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCompanies}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedCompany(item)}
        selectedId={selectedCompany?.id}
      />

      {/* Company Review Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title={selectedCompany?.name || 'Company Profile'}
        subtitle={`Domain: ${selectedCompany?.domain} • Reg: ${selectedCompany?.registrationNumber}`}
        badge={selectedCompany && <StatusBadge status={selectedCompany.verificationStatus} />}
        footer={
          selectedCompany && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleOpenAction(selectedCompany, 'Suspended')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                    background: '#ffffff',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Suspend Entity
                </button>
                <button
                  onClick={() => handleOpenAction(selectedCompany, 'Rejected')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#991b1b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject Application
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAction(selectedCompany, 'Needs Correction')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Request Correction
                </button>
                <button
                  onClick={() => handleOpenAction(selectedCompany, 'Verified')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  Grant Verified Status
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedCompany && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px' }}>
            {/* Trust Score & Verification Overview */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Platform Trust Score
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: selectedCompany.trustScore > 80 ? '#059669' : '#d97706' }}>
                  {selectedCompany.trustScore} / 100
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Vacancies: <strong>{selectedCompany.activeVacanciesCount}</strong></div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Assessments: <strong>{selectedCompany.totalAssessmentsCount}</strong></div>
              </div>
            </div>

            {/* Business & Legal Information */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Corporate Identification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Work Email</div>
                  <div style={{ fontWeight: 600 }}>{selectedCompany.workEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official Website</div>
                  <a
                    href={selectedCompany.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#b8860b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {selectedCompany.website} <ExternalLink size={11} />
                  </a>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registration / Tax ID</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedCompany.registrationNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jurisdiction</div>
                  <div style={{ fontWeight: 600 }}>{selectedCompany.country}</div>
                </div>
              </div>
            </div>

            {/* Submitted Documents */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Verification Documents ({selectedCompany.documents.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCompany.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={16} style={{ color: '#b8860b' }} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Type: {doc.type}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: doc.verified ? '#059669' : '#d97706',
                      }}
                    >
                      {doc.verified ? 'Cryptographically Verified' : 'Awaiting Review'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit & Action History */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Audit History Trail
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCompany.history.map((h, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #b8860b', paddingLeft: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{h.action} ({h.admin})</span>
                      <span style={{ fontSize: '11px' }}>{h.date}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{h.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Confirmation Dialog for Actions */}
      <ConfirmationDialog
        isOpen={!!actionType}
        onClose={() => {
          setActionType(null);
          setDialogCompany(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm Action: ${actionType}`}
        description={`Are you sure you want to set the verification status of "${dialogCompany?.name}" to ${actionType}? This will be recorded in the platform immutable audit log.`}
        variant={
          actionType === 'Rejected' || actionType === 'Suspended'
            ? 'danger'
            : actionType === 'Needs Correction'
            ? 'warning'
            : 'success'
        }
        confirmLabel={`Confirm ${actionType}`}
        requireNote={actionType === 'Needs Correction' || actionType === 'Rejected' || actionType === 'Suspended'}
      />
    </div>
  );
}
