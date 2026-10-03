'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { AdminGlobalSearchModal } from './AdminGlobalSearchModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Modal } from './Modal';
import { Shield, CheckCircle2, AlertTriangle, FileCheck, Lock, Users } from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isHelpOpen, setIsHelpOpen } = useAdminAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f9fb' }}>
      {/* Desktop & Mobile Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            zIndex: 105,
          }}
          className="md:hidden"
        />
      )}

      {/* Main Admin Area */}
      <div
        style={{
          marginLeft: '270px',
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          width: 'calc(100% - 270px)',
        }}
        className="admin-main-wrapper"
      >
        <AdminTopbar />
        <main style={{ padding: '28px 32px 64px', flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      <AdminGlobalSearchModal />

      {/* Platform Governance Protocol Help Guide Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="GenuAI Platform Governance & Trust Protocol"
        subtitle="Operational standards and administrative responsibilities"
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px', lineHeight: 1.6 }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#854d0e',
              display: 'flex',
              gap: '12px',
            }}
          >
            <Shield size={20} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Platform Mandate</strong>
              GenuAI Admin controls platform trust, company verification, vacancy governance, assessment taxonomy, user access, and system integrity.
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              The 5 Pillars of Platform Governance
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>1. VERIFY:</span> Ensure all companies, tax records, and corporate domains are authentic.
              </div>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>2. GOVERN:</span> Review vacancies and assessment integrity profiles against normalized taxonomy.
              </div>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>3. MONITOR:</span> Track observable session signals, proctoring anomalies, and WAF security events.
              </div>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>4. RESOLVE:</span> Arbitrate candidate disputes and moderation reports with evidence impartiality.
              </div>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>5. AUDIT:</span> Maintain an immutable, cryptographically verifiable log of all administrative actions.
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626', marginBottom: '6px' }}>
              What Admin Does NOT Do:
            </h4>
            <ul style={{ paddingLeft: '18px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Never make hiring decisions or rank candidates for a company.</li>
              <li>Never edit candidate code, test runs, or evidence without logged governance authority.</li>
              <li>Never display &ldquo;Candidate Cheated&rdquo; without verified signal investigation.</li>
              <li>Never bypass audit logging when inspecting evidence vault records.</li>
            </ul>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
