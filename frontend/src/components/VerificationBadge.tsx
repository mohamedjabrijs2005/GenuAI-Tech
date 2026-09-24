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
    dotColor: 'var(--color-unverified)',
    icon: <ShieldAlert size={16} />,
    desc: 'Your company profile has not yet been verified by GenuAI.',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    badgeClass: 'badge-under-review',
    dotColor: 'var(--color-under-review)',
    icon: <Clock size={16} />,
    desc: 'Your company profile is currently being reviewed by GenuAI.',
  },
  VERIFIED: {
    label: 'Verified',
    badgeClass: 'badge-verified',
    dotColor: 'var(--color-verified)',
    icon: <ShieldCheck size={16} />,
    desc: 'Your company has been verified by GenuAI.',
  },
  SUSPENDED: {
    label: 'Suspended',
    badgeClass: 'badge-suspended',
    dotColor: 'var(--color-suspended)',
    icon: <ShieldX size={16} />,
    desc: 'Your company account has been suspended. Please contact GenuAI support.',
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
    <div className="verification-block">
      <div
        className="verification-icon"
        style={{
          background: `${config.dotColor}1a`,
          color: config.dotColor,
        }}
      >
        {config.icon}
      </div>
      <div>
        <div className="verification-label">Company Verification</div>
        <div className="verification-status" style={{ color: config.dotColor }}>
          {status}
        </div>
        <div className="verification-desc">{config.desc}</div>
      </div>
    </div>
  );
}
