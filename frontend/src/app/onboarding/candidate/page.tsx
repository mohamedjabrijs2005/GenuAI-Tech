'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingCandidateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/candidate/onboarding');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#b8860b',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
        }} />
        <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Loading Candidate Onboarding…</p>
      </div>
    </div>
  );
}
