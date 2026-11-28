'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Sparkles, AlertCircle, Clock } from 'lucide-react';

export interface SkillProofItem {
  requirementId?: string;
  skillName?: string;
  skill_name?: string;
  importance?: string;
  proofLevel?: 'verified' | 'assessed' | 'claimed' | 'not_assessed' | string;
  proof_level?: string;
  status?: 'meets' | 'partial' | 'trainable' | 'missing' | string;
  trainable?: boolean;
  reason?: string;
  score?: number | null;
  maxScore?: number | null;
}

export function getProofBadgeConfig(item: SkillProofItem) {
  const level = (item.proofLevel || item.proof_level || 'not_assessed').toLowerCase();
  const status = (item.status || 'missing').toLowerCase();

  if (level === 'verified') {
    return {
      label: 'Verified',
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0',
      icon: ShieldCheck,
    };
  }
  if (level === 'assessed') {
    return {
      label: status === 'meets' ? 'Assessed (Meets)' : 'Assessed (Partial)',
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
      icon: CheckCircle2,
    };
  }
  if (level === 'claimed') {
    return {
      label: 'Claimed',
      bg: '#fef3c7',
      color: '#b45309',
      border: '#fde68a',
      icon: Clock,
    };
  }
  if (status === 'trainable' || item.trainable) {
    return {
      label: 'Trainable Gap',
      bg: '#f5f3ff',
      color: '#6d28d9',
      border: '#ddd6fe',
      icon: Sparkles,
    };
  }
  return {
    label: 'Missing Proof',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    icon: AlertCircle,
  };
}

export function SkillProofBadge({ item }: { item: SkillProofItem }) {
  const cfg = getProofBadgeConfig(item);
  const Icon = cfg.icon;
  return (
    <span
      title={item.reason || cfg.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}
