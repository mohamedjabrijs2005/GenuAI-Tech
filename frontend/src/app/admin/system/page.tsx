'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HardDrive,
  Database,
  Radio,
  Server,
  Key,
  Cpu,
  Bell,
} from 'lucide-react';
import { KPICard } from '@/components/admin/KPICard';
import { SystemStatusCard } from '@/components/admin/SystemStatusCard';
import { adminDataService, SystemHealthMetrics } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function SystemHealthPage() {
  const { hasPermission } = useAdminAuth();
  const [health, setHealth] = useState<SystemHealthMetrics>(adminDataService.getSystemHealth());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHealth(adminDataService.getSystemHealth());
      setIsRefreshing(false);
      toast.success('System telemetry updated from primary nodes.');
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              System Health & Cluster Telemetry
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
              }}
            >
              100% Operational Status
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Realtime metrics across API gateways, encrypted evidence vaults, PostgreSQL primary clusters, and WebRTC proctoring relays.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Ping Subsystems
        </button>
      </div>

      {/* Primary Telemetry KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <KPICard
          title="Avg API Response Time"
          value={`${health.telemetry.avgResponseTime} ms`}
          subtitle="95th percentile: 68 ms"
          icon={Server}
          highlight="success"
        />
        <KPICard
          title="Error Rate"
          value={`${health.telemetry.errorRate}%`}
          subtitle="HTTP 5xx status codes"
          icon={AlertTriangle}
          highlight="success"
        />
        <KPICard
          title="Live WebSocket Relays"
          value={health.telemetry.realtimeConnections.toLocaleString()}
          subtitle="Active proctoring sessions"
          icon={Radio}
          highlight="gold"
        />
        <KPICard
          title="Evidence Vault Storage"
          value={`${health.telemetry.storageUsedGB} GB`}
          subtitle={`of ${health.telemetry.storageTotalGB} GB allocated`}
          icon={HardDrive}
        />
      </div>

      {/* Subsystem Health Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Core Subsystem List */}
        <SystemStatusCard subsystems={health.subsystems} />

        {/* Database & Queue Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={16} style={{ color: '#b8860b' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Primary Database & Connection Pool
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Connections:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{health.telemetry.databasePoolActive} / 100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Replication Lag:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>0.00 ms (Synchronous Standby)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Deadlocks (Last 24h):</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>0 Detected</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Cpu size={16} style={{ color: '#b8860b' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Asynchronous Task Queue & Execution Sandbox
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Queue Depth:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{health.telemetry.queueDepth} Tasks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Failed Jobs (DLQ):</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{health.telemetry.failedJobs} Jobs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sandbox Isolation:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>gVisor Containerized (Strict)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
