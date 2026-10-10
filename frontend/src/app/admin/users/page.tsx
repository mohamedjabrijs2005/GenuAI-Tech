'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  userType: string;
  organization: string;
  companyId?: string;
  companyStatus?: string;
  accountStatus: string;
  createdDate: string;
  lastLogin: string;
}

export default function PlatformUsersPage() {
  const { hasPermission } = useAdminAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Dialog state
  const [dialogAction, setDialogAction] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<UserRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.users || []);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError('Could not load platform users from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleConfirmAction = async (note: string) => {
    if (!targetUser || !dialogAction) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, {
        status: dialogAction,
        reason: note,
      });
      toast.success(`User ${targetUser.email} status updated to ${dialogAction}`);
      fetchUsers();
    } catch (err: any) {
      console.error('User status update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update user status');
    } finally {
      setSubmitting(false);
      setDialogAction(null);
      setTargetUser(null);
    }
  };

  if (!hasPermission('manage_users')) {
    return <PermissionDeniedState requiredRole="Super Admin or Support Admin" />;
  }

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.organization && u.organization.toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">
              Manage platform users, recruiter access, and governance role assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by user name, email, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px' }}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>System Role</th>
              <th>Organization</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading platform users from PostgreSQL...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No users found matching the search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: u.userType === 'GenuAI Admin' ? 'rgba(212, 175, 55, 0.15)' : '#f1f5f9',
                        color: u.userType === 'GenuAI Admin' ? '#854d0e' : '#334155',
                        border: `1px solid ${u.userType === 'GenuAI Admin' ? 'rgba(212, 175, 55, 0.35)' : '#cbd5e1'}`,
                      }}
                    >
                      {u.role || u.userType}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {u.organization || 'GenuAI Platform'}
                  </td>
                  <td>
                    <StatusBadge status={u.accountStatus || 'Active'} />
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {u.createdDate || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={13} /> View
                      </button>
                      {u.accountStatus === 'Active' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetUser(u);
                            setDialogAction('Suspended');
                          }}
                          style={{ padding: '5px 10px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '11.5px', fontWeight: 700 }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetUser(u);
                            setDialogAction('Active');
                          }}
                          style={{ padding: '5px 10px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '11.5px', fontWeight: 700 }}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <DetailDrawer
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={selectedUser.name}
          subtitle={`User ID: ${selectedUser.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Account Status
                </span>
                <StatusBadge status={selectedUser.accountStatus} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Role Assignment
                </span>
                <strong>{selectedUser.role}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Email Address</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Organization</span>
                <strong>{selectedUser.organization}</strong>
              </div>
              <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Registration Date</span>
                <strong>{selectedUser.createdDate}</strong>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Confirmation Dialog */}
      {targetUser && dialogAction && (
        <ConfirmationDialog
          isOpen={Boolean(targetUser && dialogAction)}
          onClose={() => {
            setDialogAction(null);
            setTargetUser(null);
          }}
          onConfirm={handleConfirmAction}
          title={`${dialogAction} user account for ${targetUser.email}?`}
          message={
            dialogAction === 'Suspended'
              ? 'This will prevent the user from logging in or performing recruitment actions.'
              : 'This will restore access for the user account.'
          }
          confirmLabel={`Confirm ${dialogAction}`}
          requireReason={dialogAction === 'Suspended'}
          reasonPlaceholder="Enter governance reason..."
        />
      )}
    </div>
  );
}
