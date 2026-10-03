'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Search,
  Filter,
  User,
  ShieldCheck,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, ModerationReport, ModerationStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function ModerationCenterPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [reports, setReports] = useState<ModerationReport[]>(adminDataService.getModerationReports());
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [dialogAction, setDialogAction] = useState<ModerationStatus | null>(null);
  const [targetReport, setTargetReport] = useState<ModerationReport | null>(null);

  const refresh = () => {
    const list = adminDataService.getModerationReports();
    setReports(list);
    if (selectedReport) {
      const updated = list.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedReport]);

  if (!hasPermission('moderate_content')) {
    return <PermissionDeniedState requiredRole="Trust & Safety Admin or Super Admin" />;
  }

  const filtered = reports.filter((r) => {
    const match =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.affectedEntity.name.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'OPEN') return r.status === 'Open' || r.status === 'Investigating';
    if (activeTab === 'ACTION') return r.status === 'Action Required';
    if (activeTab === 'RESOLVED') return r.status === 'Resolved' || r.status === 'Dismissed';
    return true;
  });

  const handleOpenAction = (rep: ModerationReport, status: ModerationStatus) => {
    setTargetReport(rep);
    setDialogAction(status);
  };

  const handleConfirmAction = (note: string) => {
    if (!targetReport || !dialogAction) return;
    adminDataService.updateModerationReport(
      targetReport.id,
      dialogAction,
      dialogAction === 'Resolved' ? 'Violation Remedied' : 'Dismissed without violation',
      note,
      adminUser.name,
      adminUser.role
    );
    toast.success(`Report #${targetReport.id} marked as ${dialogAction}`);
    setDialogAction(null);
    setTargetReport(null);
  };

  const columns: Column<ModerationReport>[] = [
    {
      key: 'id',
      header: 'Case ID & Title',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.title}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#854d0e' }}>{item.id}</span> • {item.category}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'affectedEntity',
      header: 'Affected Entity',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.affectedEntity.name}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Type: {item.affectedEntity.type} ({item.affectedEntity.id})
          </div>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.reporter.name}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.reporter.type}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      key: 'assignedAdmin',
      header: 'Assigned Admin',
      render: (item) => <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.assignedAdmin}</span>,
    },
    {
      key: 'createdDate',
      header: 'Filed At',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.createdDate}</span>,
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
            setSelectedReport(item);
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
          <Eye size={13} /> View Case
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Moderation & Abuse Center
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
            Trust & Safety
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Review content policy violations, discrimination reports, abuse complaints, and enforce platform standards.
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter reports by title, category, case ID..."
        tabs={[
          { key: 'ALL', label: 'All Cases', count: reports.length },
          { key: 'OPEN', label: 'Open & Investigating', count: reports.filter((r) => r.status === 'Open' || r.status === 'Investigating').length },
          { key: 'ACTION', label: 'Action Required', count: reports.filter((r) => r.status === 'Action Required').length },
          { key: 'RESOLVED', label: 'Resolved / Dismissed', count: reports.filter((r) => r.status === 'Resolved' || r.status === 'Dismissed').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedReport(item)}
        selectedId={selectedReport?.id}
      />

      {/* Case Review Drawer */}
      <DetailDrawer
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={`Moderation Case #${selectedReport?.id}`}
        subtitle={selectedReport?.title}
        badge={selectedReport && <StatusBadge status={selectedReport.status} />}
        footer={
          selectedReport && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
              <button
                onClick={() => handleOpenAction(selectedReport, 'Dismissed')}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss Case
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAction(selectedReport, 'Action Required')}
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
                  Require Revision
                </button>
                <button
                  onClick={() => handleOpenAction(selectedReport, 'Resolved')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Violation Description & Evidence
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {selectedReport.evidence.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedReport.evidence.flags.map((flag, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#fee2e2',
                      color: '#991b1b',
                    }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Entity & Reporter Context
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Entity</div>
                  <div style={{ fontWeight: 600 }}>{selectedReport.affectedEntity.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reporter</div>
                  <div style={{ fontWeight: 600 }}>{selectedReport.reporter.name}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Action Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedReport.actionHistory.map((a, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #b8860b', paddingLeft: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{a.action} ({a.admin})</span>
                      <span style={{ fontSize: '11px' }}>{a.date}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{a.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmationDialog
        isOpen={!!dialogAction}
        onClose={() => {
          setDialogAction(null);
          setTargetReport(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm Case Status: ${dialogAction}`}
        description={`Are you sure you want to update case #${targetReport?.id} to ${dialogAction}?`}
        variant={dialogAction === 'Resolved' ? 'success' : 'warning'}
        requireNote
      />
    </div>
  );
}
