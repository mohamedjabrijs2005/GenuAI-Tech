'use client';

import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, Clock, Database, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PermissionDeniedState } from '@/components/admin/States';

interface HealthData {
  status: string;
  database?: string;
  migrationVersion?: number;
  migrationCount?: number;
  environment?: any;
  timestamp?: string;
}

export default function AdminSystemPage() {
  const { hasPermission } = useAdminAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!hasPermission('view_system')) {
    return <PermissionDeniedState requiredRole="Super Admin" />;
  }

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Health check failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const ok = health?.status === 'ok';

  const environmentLabel =
    typeof health?.environment === 'object' && health.environment !== null
      ? (health.environment.env || 'Unknown')
      : (health?.environment || 'Unknown');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1 className="page-title">System Status</h1><p className="page-subtitle">Live backend health and schema status.</p></div>
          <button className="btn btn-secondary" onClick={load} style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {error && <div className="card" style={{ padding: 24, textAlign: 'center', color: '#dc2626' }}><AlertCircle size={24} style={{ marginBottom: 8 }} /><p>{error}</p></div>}

      {health && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'API Status', value: health.status?.toUpperCase() || '—', icon: <Server size={16} />, ok: ok },
            { label: 'Database', value: health.database || '—', icon: <Database size={16} />, ok: health.database === 'connected' },
            { label: 'Migration Version', value: health.migrationVersion ? `v${health.migrationVersion}` : '—', icon: <CheckCircle2 size={16} />, ok: !!health.migrationVersion },
            { label: 'Migration Count', value: typeof health.migrationCount === 'number' ? health.migrationCount.toString() : (health.migrationCount || '—'), icon: <CheckCircle2 size={16} />, ok: !!health.migrationCount },
            { label: 'Environment', value: String(environmentLabel), icon: <Clock size={16} />, ok: true },
            { label: 'Last Checked', value: health.timestamp ? new Date(health.timestamp).toLocaleString() : new Date().toLocaleString(), icon: <Clock size={16} />, ok: true },
          ].map(row => (
            <div key={row.label} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ color: row.ok ? '#059669' : '#dc2626' }}>{row.icon}</div>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</div>
              <span style={{
                fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                background: row.ok ? '#f0fdf4' : '#fef2f2',
                color: row.ok ? '#059669' : '#dc2626',
              }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
