'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Lock,
  HardDrive,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Radio,
} from 'lucide-react';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, PlatformSettings } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [settings, setSettings] = useState<PlatformSettings>(adminDataService.getSettings());
  const [activeTab, setActiveTab] = useState<'VERIFICATION' | 'GOVERNANCE' | 'SECURITY' | 'MAINTENANCE'>('VERIFICATION');

  if (!hasPermission('manage_settings')) {
    return <PermissionDeniedState requiredRole="Super Admin" />;
  }

  const handleSave = () => {
    adminDataService.updateSettings(settings, adminUser.name, adminUser.role);
    toast.success('Platform governance settings updated and logged.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Platform Governance Settings
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
              Super Admin Control
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Configure global platform trust policies, automated verification checks, SLA turnaround thresholds, and immutable audit parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            background: '#b8860b',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(184, 134, 11, 0.25)',
          }}
        >
          <Save size={14} /> Save Platform Policies
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {(
          [
            { key: 'VERIFICATION', label: 'Verification Rules' },
            { key: 'GOVERNANCE', label: 'Evidence & Integrity' },
            { key: 'SECURITY', label: 'Access & Security Policies' },
            { key: 'MAINTENANCE', label: 'Maintenance Mode' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: activeTab === t.key ? 700 : 500,
              background: activeTab === t.key ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              color: activeTab === t.key ? '#854d0e' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings Forms */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        }}
      >
        {activeTab === 'VERIFICATION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Company Verification & SLA Automation
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Automated DNS MX & SPF Domain Verification
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Query authoritative DNS nameservers automatically upon tenant registration.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.verification.autoCheckDomainMX}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    verification: { ...settings.verification, autoCheckDomainMX: e.target.checked },
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#b8860b', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Require Official Tax/Registration Document
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Enforce upload of certificate of incorporation prior to granting review queue access.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.verification.requireBusinessTaxDoc}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    verification: { ...settings.verification, requireBusinessTaxDoc: e.target.checked },
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#b8860b', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Verification SLA Turnaround Target (Hours)
              </label>
              <input
                type="number"
                value={settings.verification.turnaroundSLAHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    verification: { ...settings.verification, turnaroundSLAHours: Number(e.target.value) },
                  })
                }
                style={{ width: '140px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'GOVERNANCE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Evidence Privacy & Session Integrity Thresholds
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Strict Proctoring Signal Flagging
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Automatically create an integrity incident when 2 or more tab switches occur during coding tests.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.governance.strictIntegrityEnforcement}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    governance: { ...settings.governance, strictIntegrityEnforcement: e.target.checked },
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#b8860b', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Immutable Audit Log Retention (Days)
              </label>
              <input
                type="number"
                value={settings.governance.auditLogRetentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    governance: { ...settings.governance, auditLogRetentionDays: Number(e.target.value) },
                  })
                }
                style={{ width: '140px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Administrative IAM & Rate Limiting
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Enforce Hardware MFA for All Admins
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Require FIDO2 WebAuthn or TOTP credentials for all console sessions.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.security.enforceAdminMFA}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, enforceAdminMFA: e.target.checked },
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#b8860b', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Admin Inactive Session Timeout (Minutes)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, sessionTimeoutMinutes: Number(e.target.value) },
                  })
                }
                style={{ width: '140px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'MAINTENANCE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Global Platform Maintenance Mode
            </h3>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: settings.maintenance.isMaintenanceMode ? '#fef2f2' : '#f8fafc',
                border: settings.maintenance.isMaintenanceMode ? '1px solid #fecaca' : '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: settings.maintenance.isMaintenanceMode ? '#991b1b' : 'var(--text-primary)' }}>
                  Platform Maintenance Status: {settings.maintenance.isMaintenanceMode ? 'ACTIVE' : 'NORMAL OPERATIONS'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  When enabled, all non-admin API write traffic is safely quarantined.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance.isMaintenanceMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, isMaintenanceMode: e.target.checked },
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#dc2626', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Maintenance Banner Notice
              </label>
              <textarea
                rows={3}
                value={settings.maintenance.maintenanceMessage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, maintenanceMessage: e.target.value },
                  })
                }
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
