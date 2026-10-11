'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Star, Zap } from 'lucide-react';
import Link from 'next/link';

type BillingCycle = 'monthly' | 'annual';

const CANDIDATE_PLANS = [
  {
    key: 'free',
    name: 'Candidate Free',
    badge: 'Always free',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    monthlyPrice: '₹0',
    annualPrice: '₹0',
    monthlyNote: '/ Free',
    annualNote: '/ Free',
    description: 'Explore verified vacancies, create targets, and participate in the standard recruitment workflow.',
    recommended: false,
    current: true,
    features: [
      'Candidate profile',
      'Explore verified published vacancies',
      'Create and manage Targets',
      'View vacancy requirements',
      'View requirement importance and evaluation methods',
      'Submit required target-specific evidence',
      'View evidence status and coverage gaps',
      'Receive candidate-visible recruitment updates',
      'View interview information when invited',
      'Basic privacy controls',
      'Withdraw eligible Targets',
      'Accessibility / accommodation request access',
    ],
    cta: 'Current Plan',
    ctaHref: '#',
    ctaDisabled: true,
  },
  {
    key: 'plus',
    name: 'Candidate Plus',
    badge: 'Active seekers',
    badgeColor: '#b8860b',
    badgeBg: '#fef3c7',
    monthlyPrice: '₹299',
    annualPrice: '₹2,399',
    monthlyNote: '/month',
    annualNote: '/year (Save 33%)',
    description: 'For active job seekers preparing for specific roles with guided tools.',
    recommended: false,
    current: false,
    features: [
      'Everything in Free, plus:',
      'Up to 3 guided active Targets',
      'Target-specific preparation checklist',
      'Curated learning-resource recommendations',
      'Up to 5 practice sessions per month',
      'Practice explanations and history',
      'Portfolio/GitHub readiness checklist',
      'Resume-profile completion guidance',
      'Basic target-progress reminders',
      'Basic interview-preparation guide',
      'Saved preparation notes',
      'Priority candidate support',
    ],
    cta: 'Upgrade to Plus',
    ctaHref: '/contact',
    ctaDisabled: false,
  },
  {
    key: 'pro',
    name: 'Candidate Pro',
    badge: 'Multi-target',
    badgeColor: '#1e40af',
    badgeBg: '#eff6ff',
    monthlyPrice: '₹699',
    annualPrice: '₹5,599',
    monthlyNote: '/month',
    annualNote: '/year (Save 33%)',
    description: 'For candidates managing multiple career targets with advanced preparation tools.',
    recommended: true,
    current: false,
    features: [
      'Everything in Plus, plus:',
      'Up to 10 guided active Targets',
      'Up to 25 practice sessions per month',
      'Advanced role-based preparation pathways',
      'Requirement-by-requirement evidence planner',
      'Multi-target planning workspace',
      'Advanced portfolio/project guidance',
      'Resume tailoring checklist per target',
      'Interview-preparation workspace',
      'Mock interview question bank',
      'Career-progress insights',
      'Deadline and target reminder planner',
      'Early access to selected future features',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaHref: '/contact',
    ctaDisabled: false,
  },
  {
    key: 'career-pack',
    name: 'Career Pack',
    badge: 'One-time',
    badgeColor: '#6d28d9',
    badgeBg: '#f5f3ff',
    monthlyPrice: '₹1,499',
    annualPrice: '₹1,499',
    monthlyNote: 'one-time',
    annualNote: 'one-time',
    description: '60-day access for focused preparation for one important opportunity.',
    recommended: false,
    current: false,
    features: [
      'One role-specific preparation plan',
      'One Target requirement breakdown',
      'Resume/profile checklist',
      'Portfolio/GitHub checklist',
      'Five role-based practice sessions',
      'Requirement-evidence planning checklist',
      'One interview question pack',
      'Career action plan',
      '60-day access period',
    ],
    cta: 'Get Career Pack',
    ctaHref: '/contact',
    ctaDisabled: false,
  },
];

const ADDONS = [
  { name: 'Target Preparation Pack', price: '₹299 one-time', desc: 'One role preparation plan for a specific target' },
  { name: 'Advanced Practice Credits', price: '₹199', desc: 'Ten additional practice sessions' },
  { name: 'Resume & Portfolio Pack', price: '₹499 one-time', desc: 'Role-alignment checklist and portfolio guidance' },
  { name: 'Mock Interview Pack', price: '₹599 one-time', desc: 'Five guided interview-preparation sessions' },
  { name: 'Career Switch Pack', price: '₹999 one-time', desc: 'Multi-week skills, project, and evidence roadmap' },
];

export default function CandidateSubscriptionPage() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  return (
    <div className="page-content" style={{ maxWidth: 1280 }}>
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Account</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Subscription</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Subscription Plans</h1>
            <p className="page-subtitle">Optional career preparation tools — core opportunity access remains free</p>
          </div>
        </div>
      </div>

      {/* Free Access Guarantee */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
        border: '1.5px solid #a7f3d0', borderRadius: 12,
        padding: '16px 20px', marginBottom: 28,
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <Check size={20} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#065f46', marginBottom: 4 }}>
            Opportunity access stays free — always
          </div>
          <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
            Exploring verified vacancies, creating Targets, submitting required evidence, participating in company-required assessments, and receiving recruiter decisions are always free. Premium plans provide optional career preparation tools only.
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Current Plan</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>Candidate Free</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>All core features included at no cost</div>
        </div>
        <Link href="/contact" style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
          color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          Explore Premium Tools <ArrowRight size={14} />
        </Link>
      </div>

      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 99,
          border: '1px solid #e2e8f0',
        }}>
          {(['monthly', 'annual'] as BillingCycle[]).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                background: billing === b ? '#0f172a' : 'transparent',
                color: billing === b ? '#fff' : '#64748b',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && <span style={{ fontSize: 10, marginLeft: 6, color: billing === 'annual' ? '#d4af37' : '#b8860b', fontWeight: 800 }}>Best value</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {CANDIDATE_PLANS.map(plan => (
          <div key={plan.key} style={{
            background: '#ffffff', borderRadius: 14,
            border: plan.recommended ? '2px solid #b8860b' : '1px solid #e2e8f0',
            padding: '24px 20px', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', position: 'relative',
            boxShadow: plan.recommended ? '0 6px 24px rgba(184,134,11,0.12)' : '0 2px 8px rgba(15,23,42,0.04)',
          }}>
            {plan.recommended && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                color: '#fff', fontSize: 11, fontWeight: 800,
                padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Star size={11} /> Best Value
              </div>
            )}
            {plan.current && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: '#059669', color: '#fff', fontSize: 11, fontWeight: 800,
                padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap',
              }}>
                ✓ Your Current Plan
              </div>
            )}

            <div>
              <div style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700,
                color: plan.badgeColor, background: plan.badgeBg,
                padding: '3px 10px', borderRadius: 99, marginBottom: 12,
                border: `1px solid ${plan.badgeColor}33`,
              }}>{plan.badge}</div>

              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{plan.name}</h3>

              <div style={{ fontSize: plan.monthlyPrice === '₹0' ? 28 : 26, fontWeight: 900, color: plan.recommended ? '#854d0e' : '#0f172a', marginBottom: 2 }}>
                {billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>
                  {billing === 'monthly' ? plan.monthlyNote : plan.annualNote}
                </span>
              </div>

              <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>{plan.description}</p>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginBottom: 16 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: f.startsWith('Everything') ? '#b8860b' : '#334155', fontWeight: f.startsWith('Everything') ? 700 : 400 }}>
                      {!f.startsWith('Everything') && <Check size={14} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />}
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href={plan.ctaHref} style={{
              width: '100%', padding: '11px', borderRadius: 8, textAlign: 'center',
              background: plan.ctaDisabled ? '#f1f5f9' : plan.recommended ? 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)' : '#0f172a',
              color: plan.ctaDisabled ? '#64748b' : '#fff',
              border: plan.ctaDisabled ? '1px solid #e2e8f0' : 'none',
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: plan.ctaDisabled ? 'default' : 'pointer',
              pointerEvents: plan.ctaDisabled ? 'none' : 'auto',
            }}>
              {plan.cta} {!plan.ctaDisabled && <ArrowRight size={14} />}
            </Link>
          </div>
        ))}
      </div>

      {/* Optional Add-ons */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Zap size={18} style={{ color: '#b8860b' }} />
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Optional Add-ons</h2>
        </div>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>One-time purchases for specific preparation needs — independent of your subscription plan.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ADDONS.map(a => (
            <div key={a.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fafaf9',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.desc}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#b8860b' }}>{a.price}</div>
            </div>
          ))}
        </div>
        <Link href="/contact" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
          padding: '10px 18px', borderRadius: 8,
          background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
          color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          Get Help Choosing <ArrowRight size={14} />
        </Link>
      </div>

      {/* Fair Use Notice */}
      <div style={{ background: '#fafaf9', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Fair Use Policy</div>
        <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          Candidates are never charged for: exploring verified vacancies, creating a Target, submitting required evidence, participating in a company-required assessment, receiving a recruiter decision, receiving interview details, or requesting accessibility accommodations. Premium plans cover only optional career-preparation tools.
        </p>
      </div>
    </div>
  );
}
