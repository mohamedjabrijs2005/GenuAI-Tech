'use client';

import { ShieldCheck, ShieldAlert, ShieldX, Clock } from 'lucide-react';

interface Props {
  status: string;
  compact?: boolean;
}

const CONFIG: Record<string, { label: string; badgeClass: string; dotColor: string; icon: React.ReactNode; desc: string }> = {
  UNVERIFIED: {
    label: 'Unverified',
    badgeClass: 'badge-unverified',
    dotColor: '#64748b',
    icon: <ShieldAlert size={18} />,
    desc: 'Your company profile has not yet been verified by GenuAI Technologies.',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    badgeClass: 'badge-under-review',
    dotColor: '#f59e0b',
    icon: <Clock size={18} />,
    desc: 'Your company profile is currently being reviewed by GenuAI Technologies Compliance.',
  },
  VERIFIED: {
    label: 'Verified Entity',
    badgeClass: 'badge-verified',
    dotColor: '#10b981',
    icon: <ShieldCheck size={18} />,
    desc: 'Your company is fully verified by GenuAI Technologies. All vacancies can be published immediately.',
  },
  SUSPENDED: {
    label: 'Suspended',
    badgeClass: 'badge-suspended',
    dotColor: '#ef4444',
    icon: <ShieldX size={18} />,
    desc: 'Your company account has been suspended. Please contact GenuAI Technologies support.',
  },
};

export default function VerificationBadge({ status, compact = false }: Props) {
  const config = CONFIG[status] ?? CONFIG.UNVERIFIED;

  if (compact) {
    return (
      <span className={`badge ${config.badgeClass}`}>
        <span className="badge-dot" style={{ background: config.dotColor }} />
        {config.label}
      </span>
    );
  }

  return (
    <div className="verification-block" style={{ borderLeft: `4px solid ${config.dotColor}` }}>
      <div
        className="verification-icon"
        style={{
          background: `${config.dotColor}15`,
          color: config.dotColor,
          border: `1px solid ${config.dotColor}33`,
        }}
      >
        {config.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div className="verification-label">GenuAI Technologies Verification Status</div>
        <div className="verification-status flex items-center gap-2" style={{ color: config.dotColor }}>
          <span>{config.label}</span>
          <span className="gold-badge" style={{ fontSize: 10 }}>Official Certified</span>
        </div>
        <div className="verification-desc">{config.desc}</div>
      </div>
    </div>
  );
}
