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
  Filter,
  Layers,
  Lock,
  Flag,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, AdminAssessment, AssessmentGovStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function AssessmentGovernancePage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [assessments, setAssessments] = useState<AdminAssessment[]>(adminDataService.getAssessments());
  const [selectedAssessment, setSelectedAssessment] = useState<AdminAssessment | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [dialogAction, setDialogAction] = useState<AssessmentGovStatus | null>(null);
  const [targetAssessment, setTargetAssessment] = useState<AdminAssessment | null>(null);

  const refresh = () => {
    const list = adminDataService.getAssessments();
    setAssessments(list);
    if (selectedAssessment) {
      const updated = list.find((a) => a.id === selectedAssessment.id);
      if (updated) setSelectedAssessment(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedAssessment]);

  if (!hasPermission('govern_assessment')) {
    return <PermissionDeniedState requiredRole="Verification Admin or Super Admin" />;
  }

  const filtered = assessments.filter((a) => {
    const match =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.vacancyRole.toLowerCase().includes(search.toLowerCase()) ||
      a.assessmentType.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'PENDING') return a.status === 'Pending Review';
    if (activeTab === 'FLAGGED') return a.status === 'Flagged' || a.status === 'Needs Correction';
    if (activeTab === 'APPROVED') return a.status === 'Approved';
    if (activeTab === 'SUSPENDED') return a.status === 'Suspended';
    return true;
  });

  const handleOpenAction = (asm: AdminAssessment, status: AssessmentGovStatus) => {
    setTargetAssessment(asm);
    setDialogAction(status);
  };

  const handleConfirmAction = (note: string) => {
    if (!targetAssessment || !dialogAction) return;
    adminDataService.updateAssessmentStatus(
      targetAssessment.id,
      dialogAction,
      adminUser.name,
      adminUser.role,
      note
    );
    toast.success(`Assessment ${targetAssessment.title} marked as ${dialogAction}`);
    setDialogAction(null);
    setTargetAssessment(null);
  };

  const columns: Column<AdminAssessment>[] = [
    {
      key: 'title',
      header: 'Assessment & Role',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.title}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: '#854d0e' }}>{item.companyName}</span> • {item.vacancyRole} ({item.version})
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'assessmentType',
      header: 'Type / Duration',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.assessmentType}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {item.questionCount} Questions • {item.timeLimitMinutes} min limit
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'integrityConfig',
      header: 'Integrity Configuration',
      render: (item) => {
        const activeProctors = Object.values(item.integrityConfig).filter(Boolean).length;
        return (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: activeProctors >= 4 ? '#059669' : '#d97706' }}>
              {activeProctors} of 6 Controls Enabled
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {item.integrityConfig.tabSwitchMonitoring ? 'Tab Monitor ON' : 'Tab Monitor OFF'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'passingThreshold',
      header: 'Threshold',
      render: (item) => (
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
          {item.passingThreshold}% Pass
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
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
            setSelectedAssessment(item);
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
          <Eye size={13} /> Inspect
        </button>
      ),
    },
  ];

  const pendingCount = assessments.filter((a) => a.status === 'Pending Review').length;
  const flaggedCount = assessments.filter((a) => a.status === 'Flagged' || a.status === 'Needs Correction').length;
  const approvedCount = assessments.filter((a) => a.status === 'Approved').length;
  const suspendedCount = assessments.filter((a) => a.status === 'Suspended').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Assessment Governance
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
            Sandbox & Proctoring Sign-off
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Certify assessment sandbox security, anti-tampering parameters, evaluation groups, and requirement mappings.
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter assessments by title, type, role, company..."
        tabs={[
          { key: 'ALL', label: 'All Assessments', count: assessments.length },
          { key: 'PENDING', label: 'Pending Review', count: pendingCount },
          { key: 'FLAGGED', label: 'Flagged / Corrections', count: flaggedCount },
          { key: 'APPROVED', label: 'Approved Assessments', count: approvedCount },
          { key: 'SUSPENDED', label: 'Suspended', count: suspendedCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedAssessment(item)}
        selectedId={selectedAssessment?.id}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        title={selectedAssessment?.title || 'Assessment Governance'}
        subtitle={`${selectedAssessment?.companyName} • ${selectedAssessment?.assessmentType} (${selectedAssessment?.version})`}
        badge={selectedAssessment && <StatusBadge status={selectedAssessment.status} />}
        footer={
          selectedAssessment && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleOpenAction(selectedAssessment, 'Suspended')}
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
                  onClick={() => handleOpenAction(selectedAssessment, 'Flagged')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#991b1b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Flag size={12} /> Flag Assessment
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAction(selectedAssessment, 'Needs Correction')}
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
                  onClick={() => handleOpenAction(selectedAssessment, 'Approved')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Approve Configuration
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedAssessment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            {/* Integrity Controls Matrix */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Active Proctoring & Anti-Tampering Controls
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.entries(selectedAssessment.integrityConfig).map(([key, enabled]) => (
                  <div
                    key={key}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: enabled ? '#ecfdf5' : '#f8fafc',
                      border: enabled ? '1px solid #a7f3d0' : '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: enabled ? '#065f46' : '#64748b' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </span>
                    <span style={{ fontWeight: 800, color: enabled ? '#059669' : '#94a3b8' }}>
                      {enabled ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Groups */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Evaluation Criteria Groups
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedAssessment.evaluationGroups.map((grp, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(212, 175, 55, 0.12)',
                      color: '#854d0e',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {grp}
                  </span>
                ))}
              </div>
            </div>

            {/* Requirement Mapping */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Requirement Mapping Linkage
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedAssessment.requirementMapping.map((rm, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{rm.requirement}</span>
                    <span style={{ color: '#b8860b', fontWeight: 700 }}>
                      {rm.questionIds.length} Linked Questions
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Review Notes */}
            {selectedAssessment.reviewNotes && (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Audited Review Notes ({selectedAssessment.reviewedBy})
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  {selectedAssessment.reviewNotes}
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
          setTargetAssessment(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm Assessment Action: ${dialogAction}`}
        description={`Set assessment "${targetAssessment?.title}" status to ${dialogAction}?`}
        variant={dialogAction === 'Flagged' || dialogAction === 'Suspended' ? 'danger' : dialogAction === 'Needs Correction' ? 'warning' : 'success'}
        requireNote={dialogAction === 'Flagged' || dialogAction === 'Needs Correction'}
      />
    </div>
  );
}
