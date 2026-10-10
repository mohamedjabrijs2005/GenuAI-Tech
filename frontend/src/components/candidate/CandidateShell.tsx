'use client';

import React from 'react';
import { CandidateSidebar } from './CandidateSidebar';
import { CandidateTopbar } from './CandidateTopbar';

export function CandidateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <CandidateSidebar />
      <div className="main-content">
        <CandidateTopbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
