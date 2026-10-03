import React from 'react';
import { CandidateShell } from '@/components/candidate/CandidateShell';

export const metadata = {
  title: 'Candidate Workspace — GenuAI Technologies',
  description: 'Target the Role. Build the Skills. Prove Your Capability.',
};

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <CandidateShell>{children}</CandidateShell>;
}
