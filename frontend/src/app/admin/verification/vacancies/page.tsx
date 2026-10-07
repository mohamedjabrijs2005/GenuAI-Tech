'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileCheck,
  Search,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, AdminVacancy, VacancyGovStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function VacancyGovernancePage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [vacancies, setVacancies] = useState<AdminVacancy[]>(adminDataService.getVacancies());
  const [selectedVacancy, setSelectedVacancy] = useState<AdminVacancy | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [dialogAction, setDialogAction] = useState<VacancyGovStatus | null>(null);
  const [targetVacancy, setTargetVacancy] = useState<AdminVacancy | null>(null);

  const refresh = () => {
    const list = adminDataService.getVacancies();
    setVacancies(list);
    if (selectedVacancy) {
      const updated = list.find((v) => v.id === selectedVacancy.id);
      if (updated) setSelectedVacancy(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedVacancy]);

  if (!hasPermission('govern_vacancy')) {
    return <PermissionDeniedState requiredRole="Verification Admin or Super Admin" />;
  }

  const filteredVacancies = vacancies.filter((v) => {
    const match =
      v.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      v.companyName.toLowerCase().includes(search.toLowerCase()) ||
      v.department.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'PENDING') return ['Pending Review', 'PENDING_ADMIN_REVIEW', 'UNDER_REVIEW'].includes(v.status);
    if (activeTab === 'CORRECTION') return ['Needs Correction', 'CHANGES_REQUESTED'].includes(v.status);
    if (activeTab === 'VERIFIED') return ['Verified', 'APPROVED', 'PUBLISHED'].includes(v.status);
    if (activeTab === 'REJECTED') return ['Rejected', 'Suspended', 'REJECTED', 'CLOSED', 'ARCHIVED'].includes(v.status);
    return true;
  });

  const handleOpenAction = (vac: AdminVacancy, status: VacancyGovStatus) => {
    setTargetVacancy(vac);
    setDialogAction(status);
  };

  const handleConfirmAction = async (note: string) => {
    if (!targetVacancy || !dialogAction) return;
    try {
      await adminDataService.updateVacancyStatus(
        targetVacancy.id,
        dialogAction,
        adminUser.name,
        adminUser.role,
        note
      );
      toast.success(`Vacancy ${targetVacancy.roleTitle} set to ${dialogAction}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update status');
    } finally {
      setDialogAction(null);
      setTargetVacancy(null);
    }
  };

  const columns: Column<AdminVacancy>[] = [
    {
      key: 'companyName',
      header: 'Company & Role',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.roleTitle}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: '#854d0e' }}>{item.companyName}</span> • {item.department} ({item.version})
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'requirements',
      header: 'Requirements Breakdown',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.requirements.length} Defined Criteria
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {item.requirements.filter((r) => r.type === 'Required').length} Required • {item.requirements.filter((r) => r.type === 'Preferred').length} Preferred
          </div>
        </div>
      ),
    },
    {
      key: 'assessmentMapping',
      header: 'Assessment Linkage',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: item.assessmentMapping.length > 0 ? '#059669' : '#dc2626' }}>
            {item.assessmentMapping.length} Benchmark Assessments
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Agreement: {item.agreementStatus}
          </div>
        </div>
      ),
    },
    {
      key: 'completenessScore',
      header: 'Completeness',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '40px',
              height: '5px',
              borderRadius: '99px',
              background: '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${item.completenessScore}%`,
                height: '100%',
                background: item.completenessScore > 80 ? '#059669' : '#d97706',
              }}
            />
          </div>
          <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{item.completenessScore}%</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Governance Status',
      render: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      key: 'submittedDate',
      header: 'Submitted',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.submittedDate}</span>,
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedVacancy(item);
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
          <Eye size={13} /> Review
        </button>
      ),
    },
  ];

  const pendingCount = vacancies.filter((v) => v.status === 'Pending Review').length;
  const correctionCount = vacancies.filter((v) => v.status === 'Needs Correction').length;
  const verifiedCount = vacancies.filter((v) => v.status === 'Verified').length;
  const rejectedCount = vacancies.filter((v) => v.status === 'Rejected' || v.status === 'Suspended').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Vacancy Governance
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
            Role Standards & Mapping
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Review role specifications, requirements criteria, assessment mappings, and compliance with GenuAI platform taxonomy.
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter vacancies by role, company name, department..."
        tabs={[
          { key: 'ALL', label: 'All Vacancies', count: vacancies.length },
          { key: 'PENDING', label: 'Pending Review', count: pendingCount },
          { key: 'CORRECTION', label: 'Needs Correction', count: correctionCount },
          { key: 'VERIFIED', label: 'Verified Roles', count: verifiedCount },
          { key: 'REJECTED', label: 'Rejected / Suspended', count: rejectedCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filteredVacancies}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedVacancy(item)}
        selectedId={selectedVacancy?.id}
      />

      {/* Review Drawer */}
      <DetailDrawer
        isOpen={!!selectedVacancy}
        onClose={() => setSelectedVacancy(null)}
        title={selectedVacancy?.roleTitle || 'Vacancy Review'}
        subtitle={`${selectedVacancy?.companyName} • ${selectedVacancy?.department} (${selectedVacancy?.experienceLevel})`}
        badge={selectedVacancy && <StatusBadge status={selectedVacancy.status} />}
        footer={
          selectedVacancy && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleOpenAction(selectedVacancy, 'Suspended')}
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
                  Suspend
                </button>
                <button
                  onClick={() => handleOpenAction(selectedVacancy, 'Rejected')}
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
                  Reject
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAction(selectedVacancy, 'Needs Correction')}
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
                  Needs Correction
                </button>
                <button
                  onClick={() => handleOpenAction(selectedVacancy, 'Verified')}
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
                  Certify Vacancy
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedVacancy && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            {/* Vacancy Completeness & Agreement Banner */}
            <div
              style={{
                padding: '14px 16px',
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
                  Recruitment Agreement Status
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                  {selectedVacancy.agreementStatus}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Admin</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{selectedVacancy.assignedAdmin}</div>
              </div>
            </div>

            {/* Role Requirements Checklist */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Governed Role Requirements ({selectedVacancy.requirements.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedVacancy.requirements.map((req, idx) => (
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
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {req.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Category: {req.category}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: req.type === 'Required' ? '#fee2e2' : '#f1f5f9',
                          color: req.type === 'Required' ? '#991b1b' : '#475569',
                        }}
                      >
                        {req.type}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: '#854d0e',
                        }}
                      >
                        {req.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Mapping & Evaluation Structure */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Evaluation Structure & Weights
              </div>
              {selectedVacancy.evaluationStructure.length === 0 ? (
                <div style={{ color: '#dc2626', fontSize: '12px' }}>
                  No evaluation groups configured. Vacancy cannot be certified.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedVacancy.evaluationStructure.map((ev, i) => (
                    <div
                      key={i}
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
                      <div>
                        <div style={{ fontWeight: 600 }}>{ev.groupName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Benchmark Pass Score: {ev.benchmarkScore}/100
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#b8860b' }}>
                        {ev.weightPercent}% Weight
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Governance Notes */}
            {selectedVacancy.governanceNotes && (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Governance Audit Notes
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  {selectedVacancy.governanceNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmationDialog
        isOpen={!!dialogAction}
        onClose={() => {
          setDialogAction(null);
          setTargetVacancy(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm Vacancy Status: ${dialogAction}`}
        description={`Set vacancy "${targetVacancy?.roleTitle}" governance status to ${dialogAction}?`}
        variant={dialogAction === 'Rejected' || dialogAction === 'Suspended' ? 'danger' : dialogAction === 'Needs Correction' ? 'warning' : 'success'}
        requireNote={dialogAction === 'Needs Correction' || dialogAction === 'Rejected'}
      />
    </div>
  );
}
