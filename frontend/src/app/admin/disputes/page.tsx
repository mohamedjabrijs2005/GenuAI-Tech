'use client';

import React, { useState, useEffect } from 'react';
import {
  Gavel,
  ShieldCheck,
  AlertTriangle,
  Eye,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, DisputeCase, DisputeStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function DisputeCenterPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [disputes, setDisputes] = useState<DisputeCase[]>(adminDataService.getDisputes());
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [dialogAction, setDialogAction] = useState<DisputeStatus | null>(null);
  const [targetDispute, setTargetDispute] = useState<DisputeCase | null>(null);

  const refresh = () => {
    const list = adminDataService.getDisputes();
    setDisputes(list);
    if (selectedDispute) {
      const updated = list.find((d) => d.id === selectedDispute.id);
      if (updated) setSelectedDispute(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedDispute]);

  if (!hasPermission('resolve_disputes')) {
    return <PermissionDeniedState requiredRole="Support Admin, Trust & Safety Admin or Super Admin" />;
  }

  const filtered = disputes.filter((d) => {
    const match =
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (d.candidateName && d.candidateName.toLowerCase().includes(search.toLowerCase()));

    if (!match) return false;

    if (activeTab === 'OPEN') return d.status === 'Open';
    if (activeTab === 'INVESTIGATING') return d.status === 'Investigating' || d.status === 'Action Required';
    if (activeTab === 'RESOLVED') return d.status === 'Resolved' || d.status === 'Dismissed';
    return true;
  });

  const handleOpenAction = (dsp: DisputeCase, status: DisputeStatus) => {
    setTargetDispute(dsp);
    setDialogAction(status);
  };

  const handleConfirmAction = (note: string) => {
    if (!targetDispute || !dialogAction) return;
    adminDataService.updateDisputeStatus(
      targetDispute.id,
      dialogAction,
      note || `Dispute ${dialogAction} following administrative arbitration review.`,
      adminUser.name,
      adminUser.role
    );
    toast.success(`Dispute #${targetDispute.id} set to ${dialogAction}`);
    setDialogAction(null);
    setTargetDispute(null);
  };

  const columns: Column<DisputeCase>[] = [
    {
      key: 'id',
      header: 'Case ID & Type',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.type}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#854d0e' }}>{item.id}</span> • Priority: {item.priority}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'companyName',
      header: 'Parties Involved',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.companyName}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {item.candidateName || 'Company Platform Appeal'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      key: 'assignedAdmin',
      header: 'Arbitrating Admin',
      render: (item) => <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.assignedAdmin}</span>,
    },
    {
      key: 'createdDate',
      header: 'Created',
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
            setSelectedDispute(item);
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
          <Eye size={13} /> Arbitrate
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Dispute Center
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
            Impartial Arbitration
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Arbitrate candidate assessment challenges, integrity signal disputes, and company verification appeals with immutable audit backing.
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter disputes by case ID, party name, type..."
        tabs={[
          { key: 'ALL', label: 'All Disputes', count: disputes.length },
          { key: 'OPEN', label: 'Open Cases', count: disputes.filter((d) => d.status === 'Open').length },
          { key: 'INVESTIGATING', label: 'Under Investigation', count: disputes.filter((d) => d.status === 'Investigating' || d.status === 'Action Required').length },
          { key: 'RESOLVED', label: 'Resolved / Closed', count: disputes.filter((d) => d.status === 'Resolved' || d.status === 'Dismissed').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedDispute(item)}
        selectedId={selectedDispute?.id}
      />

      {/* Dispute Review Drawer */}
      <DetailDrawer
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title={`Dispute Case #${selectedDispute?.id}`}
        subtitle={selectedDispute?.type}
        badge={selectedDispute && <StatusBadge status={selectedDispute.status} />}
        footer={
          selectedDispute && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
              <button
                onClick={() => handleOpenAction(selectedDispute, 'Dismissed')}
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
                  onClick={() => handleOpenAction(selectedDispute, 'Investigating')}
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
                  Request Information
                </button>
                <button
                  onClick={() => handleOpenAction(selectedDispute, 'Resolved')}
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
                  Resolve Dispute
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedDispute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Case Summary & Claimed Issue
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                {selectedDispute.caseSummary}
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {selectedDispute.claimedIssue}
              </p>
            </div>

            {selectedDispute.evidenceRef && (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Linked Evidence Vault Record
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#b8860b' }}>
                    {selectedDispute.evidenceRef}
                  </div>
                </div>
                <button
                  onClick={() => toast.success('Navigate to Evidence Oversight with mandatory access justification.')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Audit Linked Vault
                </button>
              </div>
            )}

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Arbitration Case History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedDispute.history.map((h, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #b8860b', paddingLeft: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{h.step} ({h.admin})</span>
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

      <ConfirmationDialog
        isOpen={!!dialogAction}
        onClose={() => {
          setDialogAction(null);
          setTargetDispute(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm Dispute Verdict: ${dialogAction}`}
        description={`Record official platform arbitration verdict as "${dialogAction}"?`}
        variant={dialogAction === 'Resolved' ? 'success' : 'warning'}
        requireNote
      />
    </div>
  );
}
