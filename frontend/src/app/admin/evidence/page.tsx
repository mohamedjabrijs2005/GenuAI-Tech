'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Lock,
  Eye,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { EvidenceAuditModal } from '@/components/admin/EvidenceAuditModal';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, EvidenceOversightRecord } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function EvidenceOversightPage() {
  const { hasPermission } = useAdminAuth();
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceOversightRecord[]>(adminDataService.getEvidenceRecords());
  const [selectedRecord, setSelectedRecord] = useState<EvidenceOversightRecord | null>(null);
  const [search, setSearch] = useState('');

  const refresh = () => {
    setEvidenceRecords(adminDataService.getEvidenceRecords());
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, []);

  if (!hasPermission('inspect_evidence')) {
    return <PermissionDeniedState requiredRole="Super Admin or Trust & Safety Admin" />;
  }

  const filtered = evidenceRecords.filter((e) => {
    return (
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.companyName.toLowerCase().includes(search.toLowerCase()) ||
      e.vacancyRole.toLowerCase().includes(search.toLowerCase()) ||
      e.candidateMaskedId.toLowerCase().includes(search.toLowerCase()) ||
      e.requirementName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const columns: Column<EvidenceOversightRecord>[] = [
    {
      key: 'id',
      header: 'Evidence ID & Target',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.requirementName}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'monospace', color: '#854d0e', fontWeight: 600 }}>{item.id}</span> • {item.sourceType}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'companyName',
      header: 'Company / Role',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {item.vacancyRole}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.companyName}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'candidateMaskedId',
      header: 'Masked Candidate',
      render: (item) => (
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>
          {item.candidateMaskedId}
        </span>
      ),
    },
    {
      key: 'accessLogs',
      header: 'Governance Audit Count',
      render: (item) => (
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '99px',
            background: item.accessLogs.length > 0 ? '#fef3c7' : '#f1f5f9',
            color: item.accessLogs.length > 0 ? '#92400e' : '#64748b',
          }}
        >
          {item.accessLogs.length} Access Log(s)
        </span>
      ),
    },
    {
      key: 'createdDate',
      header: 'Created Date',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.createdDate}</span>,
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Access Gate',
      align: 'right',
      render: (item) => (
        <button
          onClick={() => setSelectedRecord(item)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            background: '#b8860b',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 1px 2px rgba(184, 134, 11, 0.2)',
          }}
        >
          <Lock size={12} /> Audit Vault
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Controlled Evidence Vault Oversight
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
            }}
          >
            Audit-Gated Access
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Controlled administrative inspection of assessment submissions, code execution digests, and oral interview rubrics.
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search evidence by evidence ID, requirement, role, candidate ID..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />

      {/* Mandatory Audit Gate Modal */}
      <EvidenceAuditModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
}
