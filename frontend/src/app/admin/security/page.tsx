'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Zap,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { KPICard } from '@/components/admin/KPICard';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, SecurityEvent } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function SecurityEventsPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [events, setEvents] = useState<SecurityEvent[]>(adminDataService.getSecurityEvents());
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [mitigateTarget, setMitigateTarget] = useState<SecurityEvent | null>(null);

  const refresh = () => {
    const list = adminDataService.getSecurityEvents();
    setEvents(list);
    if (selectedEvent) {
      const updated = list.find((e) => e.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedEvent]);

  if (!hasPermission('manage_security')) {
    return <PermissionDeniedState requiredRole="Super Admin or Security Officer" />;
  }

  const filtered = events.filter((e) => {
    const match =
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase()) ||
      e.actor.toLowerCase().includes(search.toLowerCase()) ||
      e.affectedResource.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'ACTIVE') return e.status === 'Active' || e.status === 'Investigating';
    if (activeTab === 'CRITICAL') return e.severity === 'Critical' || e.severity === 'High';
    if (activeTab === 'RESOLVED') return e.status === 'Resolved' || e.status === 'Mitigated';
    return true;
  });

  const handleMitigate = (note: string) => {
    if (!mitigateTarget) return;
    adminDataService.mitigateSecurityEvent(
      mitigateTarget.id,
      note || 'Edge WAF rule applied and actor session revoked.',
      adminUser.name,
      adminUser.role
    );
    toast.success(`Security event #${mitigateTarget.id} mitigated.`);
    setMitigateTarget(null);
  };

  const columns: Column<SecurityEvent>[] = [
    {
      key: 'id',
      header: 'Event ID & Threat Vector',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.type}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'monospace', color: '#854d0e', fontWeight: 600 }}>{item.id}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actor',
      header: 'Actor / IP Source',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{item.actor}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
            IP: {item.ipAddress}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'affectedResource',
      header: 'Affected Endpoint',
      render: (item) => (
        <code style={{ fontSize: '11.5px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
          {item.affectedResource}
        </code>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (item) => <StatusBadge status={item.severity} />,
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
      sortable: true,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.timestamp}</span>,
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
            setSelectedEvent(item);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Security & WAF Events
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            }}
          >
            Threat Defense Center
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Realtime telemetry tracking unauthorized access attempts, rate-limiting violations, failed login spikes, and edge WAF mitigations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <KPICard title="Security Events Today" value={events.length} subtitle="Edge & Application Layer" icon={Shield} />
        <KPICard title="WAF Rate Blocks" value="184 IPs" subtitle="Automated rate limiting" icon={Zap} />
        <KPICard title="Zero-Trust Denials" value="12 Requests" subtitle="RBAC violations intercepted" icon={Lock} highlight="warning" />
        <KPICard title="Platform Threat Level" value="LOW" subtitle="All nodes operational" icon={ShieldCheck} highlight="success" />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter security events by type, actor, IP, endpoint..."
        tabs={[
          { key: 'ALL', label: 'All Security Events', count: events.length },
          { key: 'ACTIVE', label: 'Active Threats', count: events.filter((e) => e.status === 'Active' || e.status === 'Investigating').length },
          { key: 'CRITICAL', label: 'Critical / High Severity', count: events.filter((e) => e.severity === 'Critical' || e.severity === 'High').length },
          { key: 'RESOLVED', label: 'Mitigated / Resolved', count: events.filter((e) => e.status === 'Mitigated' || e.status === 'Resolved').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedEvent(item)}
        selectedId={selectedEvent?.id}
      />

      {/* Security Event Drawer */}
      <DetailDrawer
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Security Event #${selectedEvent?.id}`}
        subtitle={selectedEvent?.type}
        badge={selectedEvent && <StatusBadge status={selectedEvent.severity} />}
        footer={
          selectedEvent && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
              <button
                onClick={() => setSelectedEvent(null)}
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
                Close
              </button>
              {selectedEvent.status !== 'Mitigated' && selectedEvent.status !== 'Resolved' && (
                <button
                  onClick={() => setMitigateTarget(selectedEvent)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Apply Edge WAF Mitigation
                </button>
              )}
            </div>
          )
        }
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Incident Details & Payload
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {selectedEvent.details}
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Network & Request Metadata
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Origin IP Address</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedEvent.ipAddress}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Timestamp</div>
                  <div>{selectedEvent.timestamp}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Endpoint</div>
                  <code style={{ fontSize: '12px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                    {selectedEvent.affectedResource}
                  </code>
                </div>
              </div>
            </div>

            {selectedEvent.mitigationTaken && (
              <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Applied Countermeasure
                </div>
                <div style={{ color: '#064e3b', fontSize: '12.5px' }}>
                  {selectedEvent.mitigationTaken}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmationDialog
        isOpen={!!mitigateTarget}
        onClose={() => setMitigateTarget(null)}
        onConfirm={handleMitigate}
        title="Apply Security Countermeasure"
        description={`Deploy edge WAF block rule for actor "${mitigateTarget?.actor}" on IP ${mitigateTarget?.ipAddress}?`}
        variant="danger"
        confirmLabel="Deploy WAF Rule"
        requireNote
      />
    </div>
  );
}
