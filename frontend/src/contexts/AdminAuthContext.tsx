'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminRole, adminDataService } from '@/lib/adminDataService';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar: string;
  department: string;
}

export type RealtimeStatus = 'Connected' | 'Reconnecting' | 'Offline';

interface AdminAuthContextType {
  adminUser: AdminUser;
  setAdminRole: (role: AdminRole) => void;
  realtimeStatus: RealtimeStatus;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  unreadNotificationsCount: number;
  hasPermission: (permission: AdminPermission) => boolean;
  canAccessSensitive: boolean;
}

export type AdminPermission =
  | 'verify_company'
  | 'govern_vacancy'
  | 'govern_assessment'
  | 'manage_users'
  | 'moderate_content'
  | 'resolve_disputes'
  | 'inspect_evidence'
  | 'manage_taxonomy'
  | 'manage_security'
  | 'view_audit'
  | 'manage_settings'
  | 'view_system';

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  'Super Admin': [
    'verify_company',
    'govern_vacancy',
    'govern_assessment',
    'manage_users',
    'moderate_content',
    'resolve_disputes',
    'inspect_evidence',
    'manage_taxonomy',
    'manage_security',
    'view_audit',
    'manage_settings',
    'view_system',
  ],
  'Verification Admin': [
    'verify_company',
    'govern_vacancy',
    'govern_assessment',
    'view_audit',
    'view_system',
  ],
  'Trust & Safety Admin': [
    'moderate_content',
    'resolve_disputes',
    'inspect_evidence',
    'manage_users',
    'view_audit',
    'view_system',
  ],
  'Support Admin': [
    'resolve_disputes',
    'moderate_content',
    'view_audit',
    'view_system',
  ],
  'Read-only Admin': [
    'view_audit',
    'view_system',
  ],
};

const DEFAULT_ADMIN: AdminUser = {
  id: 'usr-adm-01',
  name: 'Platform Administrator',
  email: 'admin@genuaiadmin.com',
  role: 'Super Admin',
  avatar: 'PA',
  department: 'Platform Governance & Trust',
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser>(DEFAULT_ADMIN);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('Connected');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  useEffect(() => {
    // Load authenticated user profile from session if available
    try {
      const storedUserStr = localStorage.getItem('genuai_user');
      if (storedUserStr) {
        const parsed = JSON.parse(storedUserStr);
        if (parsed.email) {
          const email = parsed.email;
          const firstName = parsed.firstName || '';
          const lastName = parsed.lastName || '';
          let name = `${firstName} ${lastName}`.trim();
          if (!name) {
            const localPart = email.split('@')[0];
            name = localPart.charAt(0).toUpperCase() + localPart.slice(1);
          }
          const initials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'AD';

          const savedRole = (localStorage.getItem('genuai_admin_active_role') as AdminRole) || 'Super Admin';

          setAdminUser({
            id: parsed.id || 'usr-adm-session',
            name: name,
            email: email,
            role: ROLE_PERMISSIONS[savedRole] ? savedRole : 'Super Admin',
            avatar: initials,
            department: 'Platform Governance & Trust',
          });
        }
      }
    } catch {
      // ignore JSON parse error
    }

    const updateCounts = () => {
      const notifs = adminDataService.getNotifications();
      setUnreadNotificationsCount(notifs.filter((n) => !n.read).length);
    };

    updateCounts();
    const unsubscribe = adminDataService.subscribe(updateCounts);

    // Keyboard shortcut for Cmd+K / Ctrl+K search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const setAdminRole = (role: AdminRole) => {
    setAdminUser((prev) => ({ ...prev, role }));
    localStorage.setItem('genuai_admin_active_role', role);
  };

  const hasPermission = (permission: AdminPermission): boolean => {
    const permissions = ROLE_PERMISSIONS[adminUser.role] || [];
    return permissions.includes(permission);
  };

  const canAccessSensitive = adminUser.role === 'Super Admin' || adminUser.role === 'Trust & Safety Admin';

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        setAdminRole,
        realtimeStatus,
        setRealtimeStatus,
        isSearchOpen,
        setIsSearchOpen,
        isHelpOpen,
        setIsHelpOpen,
        unreadNotificationsCount,
        hasPermission,
        canAccessSensitive,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
