'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Layers,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { KPICard } from '@/components/admin/KPICard';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, IntegrityIncident, IncidentStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function PlatformIntegrityPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [incidents, setIncidents] = useState<IntegrityIncident[]>(adminDataService.getIntegrityIncidents());
  const [selectedIncident, setSelectedIncident] = useState<IntegrityIncident | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [dialogAction, setDialogAction] = useState<IncidentStatus | null>(null);
  const [targetIncident, setTargetIncident] = useState<IntegrityIncident | null>(null);

  const refresh = () => {
    const list = adminDataService.getIntegrityIncidents();
    setIncidents(list);
    if (selectedIncident) {
      const updated = list.find((i) => i.id === selectedIncident.id);
      if (updated) setSelectedIncident(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedIncident]);

  if (!hasPermission('inspect_evidence')) {
    return <PermissionDeniedState requiredRole="Trust & Safety Admin or Super Admin" />;
  }

  const filtered = incidents.filter((inc) => {
    const match =
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      inc.companyName.toLowerCase().includes(search.toLowerCase()) ||
      inc.vacancyRole.toLowerCase().includes(search.toLowerCase()) ||
      inc.candidateMaskedId.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'OPEN') return inc.status === 'Open';
    if (activeTab === 'INVESTIGATING') return inc.status === 'Under Investigation';
    if (activeTab === 'RESOLVED') return inc.status === 'Resolved' || inc.status === 'Dismissed';
    return true;
  });

  const handleOpenAction = (inc: IntegrityIncident, status: IncidentStatus) => {
    setTargetIncident(inc);
    setDialogAction(status);
  };

  const handleConfirmAction = (note: string) => {
    if (!targetIncident || !dialogAction) return;
    adminDataService.updateIntegrityIncident(
      targetIncident.id,
      dialogAction,
      note || `Observable signals analyzed and certified under platform integrity protocol.`,
      adminUser.name,
      adminUser.role
    );
    toast.success(`Incident #${targetIncident.id} marked as ${dialogAction}`);
    setDialogAction(null);
    setTargetIncident(null);
  };

  const totalSignals = incidents.reduce((acc, i) => acc + i.signals.length, 0);
  const openCount = incidents.filter((i) => i.status === 'Open' || i.status === 'Under Investigation').length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;

  const columns: Column<IntegrityIncident>[] = [
    {
      key: 'id',
      header: 'Incident & Session',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.id} ({item.candidateMaskedId})
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'monospace' }}>{item.sessionId}</span>
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
      key: 'signals',
      header: 'Observable Signals',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
            {item.signals.length} Signals Captured
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {item.signals.map((s) => s.type).join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'observableStatus',
      header: 'Platform Flag',
      render: (item) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: item.status === 'Resolved' ? '#ecfdf5' : '#fee2e2',
            color: item.status === 'Resolved' ? '#065f46' : '#991b1b',
            border: item.status === 'Resolved' ? '1px solid #a7f3d0' : '1px solid #fecaca',
          }}
        >
          {item.observableStatus}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Investigation State',
      render: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      key: 'detectedAt',
      header: 'Detected At',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.detectedAt}</span>,
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
            setSelectedIncident(item);
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
          <Eye size={13} /> Inspect Signals
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Integrity & Trust Monitoring
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
            Observable Signals Oversight
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Examine candidate session proctoring signals, environment shifts, and browser focus telemetry without prejudicial labeling.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <KPICard title="Total Signals Captured" value={totalSignals} subtitle="Cumulative platform telemetry" icon={ShieldAlert} />
        <KPICard title="Open Incidents" value={openCount} subtitle="Requires administrative review" icon={AlertTriangle} highlight={openCount > 0 ? 'danger' : 'neutral'} />
        <KPICard title="Resolved Incidents" value={resolvedCount} subtitle="Documented & verified" icon={CheckCircle2} highlight="success" />
        <KPICard title="Proctoring Anomaly Rate" value="0.42%" subtitle="Across 1,280 sessions" icon={ShieldCheck} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter incidents by incident ID, session ID, company..."
        tabs={[
          { key: 'ALL', label: 'All Incidents', count: incidents.length },
          { key: 'OPEN', label: 'Open Review Required', count: incidents.filter((i) => i.status === 'Open').length },
          { key: 'INVESTIGATING', label: 'Under Investigation', count: incidents.filter((i) => i.status === 'Under Investigation').length },
          { key: 'RESOLVED', label: 'Resolved / Dismissed', count: incidents.filter((i) => i.status === 'Resolved' || i.status === 'Dismissed').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedIncident(item)}
        selectedId={selectedIncident?.id}
      />

      {/* Incident Review Drawer */}
      <DetailDrawer
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={`Integrity Incident #${selectedIncident?.id}`}
        subtitle={`${selectedIncident?.candidateMaskedId} • Session: ${selectedIncident?.sessionId}`}
        badge={selectedIncident && <StatusBadge status={selectedIncident.status} />}
        footer={
          selectedIncident && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
              <button
                onClick={() => handleOpenAction(selectedIncident, 'Dismissed')}
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
                Dismiss (False Positive)
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAction(selectedIncident, 'Under Investigation')}
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
                  Under Investigation
                </button>
                <button
                  onClick={() => handleOpenAction(selectedIncident, 'Resolved')}
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
                  Record Signal Resolution
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedIncident && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Captured Telemetry Signals ({selectedIncident.signals.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedIncident.signals.map((sig, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: sig.severity === 'high' ? '#fef2f2' : '#fffbeb',
                      border: sig.severity === 'high' ? '1px solid #fecaca' : '1px solid #fde68a',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: sig.severity === 'high' ? '#991b1b' : '#92400e' }}>
                      <span>{sig.type}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{sig.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {sig.context}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedIncident.resolutionNote && (
              <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Recorded Resolution ({selectedIncident.resolvedBy} • {selectedIncident.resolvedAt})
                </div>
                <div style={{ color: '#064e3b', fontSize: '12.5px', lineHeight: 1.5 }}>
                  {selectedIncident.resolutionNote}
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
          setTargetIncident(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm Incident Status: ${dialogAction}`}
        description={`Record official integrity finding for incident #${targetIncident?.id} as "${dialogAction}"?`}
        variant={dialogAction === 'Resolved' ? 'success' : 'warning'}
        requireNote
      />
    </div>
  );
}
