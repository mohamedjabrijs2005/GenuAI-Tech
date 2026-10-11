'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyRegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?role=company');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Loading Company Sign In…</p>
      </div>
    </div>
  );
}
