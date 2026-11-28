'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Building2, Users, Briefcase, Star, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

type BillingCycle = 'monthly' | 'annual';

const PLANS = [
  {
    key: 'starter',
    name: 'Company Starter',
    badge: 'Small teams',
    badgeColor: '#475569',
    badgeBg: '#f1f5f9',
    monthlyPrice: '₹4,999',
    annualPrice: '₹47,988',
    monthlyNote: '/month',
    annualNote: '/year (₹3,999/mo billed annually)',
    description: 'Structured hiring for small teams starting with verified vacancy management.',
    recommended: false,
    features: [
      'One verified company workspace',
      'Up to 3 recruiter seats',
      'Up to 3 active published vacancies',
      'Department and role management',
      'Vacancy requirement builder',
      'Vacancy publishing workflow',
      'Candidate target visibility',
      'Requirement-linked evidence review',
      'Basic evidence coverage view',
      'Basic recruiter notes',
      'Basic audit history',
      'Standard support',
      'Up to 150 active candidate Targets/month',
    ],
    cta: 'Get Started',
    ctaHref: '/contact',
  },
  {
    key: 'growth',
    name: 'Company Growth',
    badge: 'Growing teams',
    badgeColor: '#854d0e',
    badgeBg: '#fef3c7',
    monthlyPrice: '₹14,999',
    annualPrice: '₹1,43,988',
    monthlyNote: '/month',
    annualNote: '/year (₹11,999/mo billed annually)',
    description: 'For growing recruitment teams needing deeper evidence review workflows.',
    recommended: true,
    features: [
      'Everything in Starter, plus:',
      'Up to 10 recruiter seats',
      'Up to 15 active published vacancies',
      'Up to 1,000 active candidate Targets/month',
      'Candidate pipeline management',
      'Structured recruiter review',
      'Evidence request workflow',
      'Requirement-by-requirement recruiter notes',
      'Enhanced coverage and gap views',
      'Advanced vacancy versioning',
      'Team activity history',
      'Basic reports',
      'Interview workflow (when released)',
      'Priority support',
    ],
    cta: 'Get Growth Access',
    ctaHref: '/contact',
  },
  {
    key: 'professional',
    name: 'Company Professional',
    badge: 'Multi-team orgs',
    badgeColor: '#1e40af',
    badgeBg: '#eff6ff',
    monthlyPrice: '₹29,999',
    annualPrice: '₹2,87,988',
    monthlyNote: '/month',
    annualNote: '/year (₹23,999/mo billed annually)',
    description: 'Full governance, structured interview workflow, and advanced reporting.',
    recommended: false,
    features: [
      'Everything in Growth, plus:',
      'Up to 25 recruiter seats',
      'Up to 50 active published vacancies',
      'Up to 5,000 active candidate Targets/month',
      'Advanced recruiter evidence workspace',
      'Requirement coverage comparison views',
      'Structured interview workflow',
      'Human decision records',
      'Recruiter decision history',
      'Extended audit logs',
      'Company evaluation templates',
      'Advanced reports',
      'Custom workflow settings',
      'Advanced permission controls',
      'Priority onboarding',
      'Dedicated success support',
    ],
    cta: 'Talk to Our Team',
    ctaHref: '/contact',
  },
  {
    key: 'enterprise',
    name: 'Enterprise & Institution',
    badge: 'Large orgs & colleges',
    badgeColor: '#065f46',
    badgeBg: '#ecfdf5',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    monthlyNote: 'pricing',
    annualNote: 'pricing',
    description: 'For large enterprises, universities, and placement partners needing custom governance.',
    recommended: false,
    features: [
      'Everything in Professional, plus:',
      'Multi-team or multi-campus setup',
      'Custom department hierarchy',
      'Institutional placement workflow',
      'Advanced governance controls',
      'Custom role/permission setup',
      'Custom reporting',
      'Integration planning',
      'Enterprise onboarding pathway',
      'Dedicated support',
      'Custom assessment programs',
      'Volume-based pricing',
      'Contract-based annual billing',
    ],
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
];

const ADDONS = [
  { name: 'Extra recruiter seat', price: '₹799/month per seat', desc: 'Additional recruiter access beyond plan limit' },
  { name: 'Extra active vacancy', price: '₹999/month per vacancy', desc: 'Vacancy beyond plan limit' },
  { name: 'Extra 100 active Targets', price: '₹1,499/month', desc: 'Candidate volume expansion' },
];

export default function CompanySubscriptionPage() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [expandedAddon, setExpandedAddon] = useState<string | null>(null);

  return (
    <div className="page-content" style={{ maxWidth: 1280 }}>
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Company</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Subscription</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Subscription Plans</h1>
            <p className="page-subtitle">Manage your company workspace plan and billing</p>
          </div>
        </div>
      </div>

      {/* Current Plan Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Current Plan</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>Company Starter</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Billing: Monthly — Renews next cycle</div>
        </div>
        <Link href="/contact" style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
          color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          Upgrade Plan <ArrowRight size={14} />
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
              {b === 'monthly' ? 'Monthly Billing' : 'Annual Billing'}
              {b === 'annual' && <span style={{ fontSize: 10, marginLeft: 6, color: billing === 'annual' ? '#d4af37' : '#b8860b', fontWeight: 800 }}>Save ~17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
        {PLANS.map(plan => (
          <div key={plan.key} style={{
            background: '#ffffff', borderRadius: 14,
            border: plan.recommended ? '2px solid #b8860b' : '1px solid #e2e8f0',
            padding: '24px 20px', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: plan.recommended ? '0 6px 24px rgba(184,134,11,0.12)' : '0 2px 8px rgba(15,23,42,0.04)',
            position: 'relative',
          }}>
            {plan.recommended && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                color: '#fff', fontSize: 11, fontWeight: 800,
                padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Star size={11} /> Recommended
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

              <div style={{ fontSize: plan.monthlyPrice === 'Custom' ? 22 : 28, fontWeight: 900, color: plan.recommended ? '#854d0e' : '#0f172a', marginBottom: 2 }}>
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
              background: plan.recommended ? 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)' : '#f1f5f9',
              color: plan.recommended ? '#fff' : '#0f172a',
              border: plan.recommended ? 'none' : '1px solid #cbd5e1',
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {plan.cta} <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      {/* Assessment Services */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Add-On Service</div>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Assessment Services</h2>
        <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>Per-candidate assessment services billed separately from your plan.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { name: 'Assessment Essentials', price: '₹199 per candidate attempt', features: ['Role-linked assessment', 'Requirement-level mapping', 'Result history', 'Basic recruiter result view'] },
            { name: 'Assessment Plus', price: '₹399 per candidate attempt', features: ['Everything in Essentials', 'Scenario-based questions', 'Advanced requirement breakdown', 'Retake policy configuration', 'Priority assessment support'] },
            { name: 'Custom Assessment Program', price: 'Quote-based', features: ['Company-specific design', 'Custom question bank', 'Evaluation rubrics', 'High-volume pricing', 'Implementation support'] },
          ].map(a => (
            <div key={a.name} style={{ background: '#fafaf9', borderRadius: 10, border: '1px solid #e2e8f0', padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{a.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#b8860b', marginBottom: 12 }}>{a.price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {a.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                    <Check size={12} style={{ color: '#059669', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px 28px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>Optional Add-ons</h2>
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
        <div style={{ marginTop: 16 }}>
          <Link href="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 8,
            background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
            color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            Discuss Add-ons with Our Team <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
