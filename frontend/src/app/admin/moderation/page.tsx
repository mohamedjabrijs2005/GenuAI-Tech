'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PrivacyRequestRow {
  id: string;
  user_id: string;
  candidate_id?: string | null;
  email?: string;
  first_name?: string;
  last_name?: string;
  request_type: 'export' | 'deletion' | 'correction' | string;
  status: 'pending' | 'in_review' | 'completed' | 'rejected' | string;
  reason?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

export default function ModerationCenterPage() {
  const { hasPermission } = useAdminAuth();
  const [requests, setRequests] = useState<PrivacyRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/privacy-requests');
      setRequests(res.data?.requests || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load privacy & moderation requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  if (!hasPermission('moderate_content')) {
    return <PermissionDeniedState requiredRole="Trust & Safety Admin or Super Admin" />;
  }

  const handleUpdateStatus = async (id: string, status: 'in_review' | 'completed' | 'rejected') => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/privacy-requests/${id}`, {
        status,
        resolutionNotes: `Updated to ${status} by admin`,
      });
      toast.success(`Request marked as ${status}`);
      await loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = requests.filter((r) => (statusFilter === 'ALL' ? true : r.status === statusFilter));

  const columns: Column<PrivacyRequestRow>[] = [
    {
      key: 'candidate',
      header: 'Candidate',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            {`${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || item.user_id}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>{item.email || '—'}</div>
        </div>
      ),
    },
    {
      key: 'request_type',
      header: 'Request Type',
      render: (item) => (
        <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 12.5 }}>
          {item.request_type}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Details',
      render: (item) => <span style={{ fontSize: 12.5, color: '#475569' }}>{item.reason || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 99,
            textTransform: 'uppercase',
            background: item.status === 'completed' ? '#ecfdf5' : item.status === 'rejected' ? '#fef2f2' : '#fffbeb',
            color: item.status === 'completed' ? '#065f46' : item.status === 'rejected' ? '#991b1b' : '#854d0e',
          }}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (item) => (
        <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) =>
        item.status === 'pending' || item.status === 'in_review' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              disabled={updatingId === item.id}
              onClick={() => handleUpdateStatus(item.id, 'completed')}
              className="btn btn-secondary btn-xs"
              style={{ color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCircle2 size={12} /> Complete
            </button>
            <button
              type="button"
              disabled={updatingId === item.id}
              onClick={() => handleUpdateStatus(item.id, 'rejected')}
              className="btn btn-secondary btn-xs"
              style={{ color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Closed</span>
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} style={{ color: '#b45309' }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Privacy &amp; Moderation Queue
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Review candidate data deletion, correction, and export requests.
          </p>
        </div>

        <div className="flex-mobile-col mobile-full" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select mobile-full"
            style={{ minHeight: 44, fontSize: 12.5 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="btn btn-secondary btn-sm btn-mobile-full"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
    </div>
  );
}
