'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import VerificationBadge from '@/components/VerificationBadge';

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/company-profile': 'Company Profile',
  '/dashboard/departments': 'Departments & Roles',
};

export default function Topbar() {
  const pathname = usePathname();
  const { company } = useAuth();
  const title = BREADCRUMB_MAP[pathname] || '';

  return (
    <header className="topbar">
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {company && (
          <VerificationBadge status={company.verificationStatus} compact />
        )}
      </div>
    </header>
  );
}
