import React from 'react';
import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'GenuAI Technologies — Platform Governance & Trust Console',
  description: 'Enterprise console for GenuAI platform verification, integrity, and governance',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
