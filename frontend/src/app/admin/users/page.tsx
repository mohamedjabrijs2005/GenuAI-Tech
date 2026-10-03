'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  Eye,
  Key,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, AdminPlatformUser, UserStatus } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function PlatformUsersPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [users, setUsers] = useState<AdminPlatformUser[]>(adminDataService.getUsers());
  const [selectedUser, setSelectedUser] = useState<AdminPlatformUser | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [dialogAction, setDialogAction] = useState<UserStatus | null>(null);
  const [targetUser, setTargetUser] = useState<AdminPlatformUser | null>(null);

  const refresh = () => {
    const list = adminDataService.getUsers();
    setUsers(list);
    if (selectedUser) {
      const updated = list.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, [selectedUser]);

  if (!hasPermission('manage_users')) {
    return <PermissionDeniedState requiredRole="Super Admin or Trust & Safety Admin" />;
  }

  const filtered = users.filter((u) => {
    const match =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.organization.toLowerCase().includes(search.toLowerCase()) ||
      u.userType.toLowerCase().includes(search.toLowerCase());

    if (!match) return false;

    if (activeTab === 'ADMIN') return u.userType === 'GenuAI Admin' || u.userType === 'Support / Operations';
    if (activeTab === 'COMPANY') return u.userType === 'Company User' || u.userType === 'Interviewer' || u.userType === 'Hiring Manager';
    if (activeTab === 'CANDIDATE') return u.userType === 'Candidate';
    if (activeTab === 'SUSPENDED') return u.accountStatus === 'Suspended';
    return true;
  });

  const handleOpenAction = (user: AdminPlatformUser, status: UserStatus) => {
    setTargetUser(user);
    setDialogAction(status);
  };

  const handleConfirmAction = (note: string) => {
    if (!targetUser || !dialogAction) return;
    adminDataService.updateUserStatus(
      targetUser.id,
      dialogAction,
      adminUser.name,
      adminUser.role,
      note
    );
    toast.success(`User ${targetUser.email} status set to ${dialogAction}`);
    setDialogAction(null);
    setTargetUser(null);
  };

  const columns: Column<AdminPlatformUser>[] = [
    {
      key: 'name',
      header: 'User & Email',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            {item.email}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'userType',
      header: 'Role & Organization',
      render: (item) => (
        <div>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              background: item.userType === 'GenuAI Admin' ? 'rgba(212, 175, 55, 0.15)' : '#f1f5f9',
              color: item.userType === 'GenuAI Admin' ? '#854d0e' : '#334155',
            }}
          >
            {item.userType}
          </span>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            {item.organization}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'accountStatus',
      header: 'Account Status',
      render: (item) => <StatusBadge status={item.accountStatus} />,
      sortable: true,
    },
    {
      key: 'mfaEnabled',
      header: 'MFA Security',
      render: (item) => (
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: item.mfaEnabled ? '#059669' : '#dc2626' }}>
          {item.mfaEnabled ? 'Enforced (FIDO2/TOTP)' : 'Not Enabled'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{item.lastLogin}</div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{item.ipLocation}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(item);
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
          <Eye size={13} /> View Account
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Users & Access Governance
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
            IAM & Least-Privilege
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Manage global user credentials, multi-factor authentication compliance, role assignment, and access state.
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name, email, organization, role..."
        tabs={[
          { key: 'ALL', label: 'All Users', count: users.length },
          { key: 'ADMIN', label: 'Admin & Operations', count: users.filter((u) => u.userType.includes('Admin') || u.userType.includes('Operations')).length },
          { key: 'COMPANY', label: 'Company Members', count: users.filter((u) => u.userType.includes('Company') || u.userType.includes('Interviewer')).length },
          { key: 'CANDIDATE', label: 'Candidates', count: users.filter((u) => u.userType === 'Candidate').length },
          { key: 'SUSPENDED', label: 'Suspended Accounts', count: users.filter((u) => u.accountStatus === 'Suspended').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedUser(item)}
        selectedId={selectedUser?.id}
      />

      {/* User Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || 'User Account'}
        subtitle={`${selectedUser?.email} • ID: ${selectedUser?.id}`}
        badge={selectedUser && <StatusBadge status={selectedUser.accountStatus} />}
        footer={
          selectedUser && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
              <div>
                {selectedUser.accountStatus === 'Active' ? (
                  <button
                    onClick={() => handleOpenAction(selectedUser, 'Suspended')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: '1px solid #fee2e2',
                      background: '#fef2f2',
                      color: '#991b1b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAction(selectedUser, 'Active')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      background: '#059669',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Restore Account
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Account Identity & Permissions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Role</div>
                  <div style={{ fontWeight: 700, color: '#854d0e' }}>{selectedUser.userType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Organization Tenant</div>
                  <div style={{ fontWeight: 600 }}>{selectedUser.organization}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MFA Status</div>
                  <div style={{ fontWeight: 600, color: selectedUser.mfaEnabled ? '#059669' : '#dc2626' }}>
                    {selectedUser.mfaEnabled ? 'Compliant' : 'Non-Compliant'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Member Since</div>
                  <div>{selectedUser.createdDate}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Security & Session Telemetry
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Active Location:</span>
                  <span style={{ fontWeight: 600 }}>{selectedUser.ipLocation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Failed Login Attempts:</span>
                  <span style={{ fontWeight: 700, color: selectedUser.failedLoginAttempts > 0 ? '#dc2626' : '#059669' }}>
                    {selectedUser.failedLoginAttempts}
                  </span>
                </div>
              </div>
            </div>

            {selectedUser.governanceNotes && (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Governance Audit Notes
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  {selectedUser.governanceNotes}
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
          setTargetUser(null);
        }}
        onConfirm={handleConfirmAction}
        title={`Confirm User Status: ${dialogAction}`}
        description={`Are you sure you want to set account "${targetUser?.email}" status to ${dialogAction}?`}
        variant={dialogAction === 'Suspended' ? 'danger' : 'success'}
        requireNote={dialogAction === 'Suspended'}
      />
    </div>
  );
}
