'use client';

import React from 'react';
import { FileCheck, Clock } from 'lucide-react';

export default function AdminEvidenceComingSoonPage() {
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '32px', background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fffbeb', color: '#b45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <FileCheck size={24} />
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
        <Clock size={12} /> COMING SOON
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
        Platform Evidence Governance
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
        Centralized admin evidence verification is scheduled for a post-pilot release. Company recruiters currently verify candidate evidence directly per vacancy.
      </p>
    </div>
  );
}
