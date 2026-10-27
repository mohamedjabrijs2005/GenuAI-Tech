'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, FileCheck, Lock, UserCheck, FileText,
  Menu, X, ChevronDown, ChevronUp, Sparkles, Check
} from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const STEPS = [
    { num: '01', title: 'Define', desc: 'Companies define roles, requirements, and evaluation methods.', live: true },
    { num: '02', title: 'Verify', desc: 'Platform governance verifies company status and moderates vacancy listings.', live: true },
    { num: '03', title: 'Target', desc: 'Candidates select a specific published vacancy to create an isolated Target.', live: true },
    { num: '04', title: 'Evidence', desc: 'Candidates submit projects, work samples, and portfolio items against requirements.', live: true },
    { num: '05', title: 'Review', desc: 'Recruiters evaluate evidence coverage with role-specific rubrics.', live: true },
    { num: '06', title: 'Decision', desc: 'Recruiters record hiring outcomes. Zero automated AI rejections.', live: true },
  ];

  const FAQS = [
    { q: 'Is GenuAI an AI hiring system?', a: 'No. GenuAI helps organize role requirements, candidate evidence, and recruiter review context. Hiring decisions remain entirely with people at the hiring company.' },
    { q: 'Does GenuAI automatically reject candidates?', a: 'No. The platform does not make automatic hiring or rejection decisions based on an AI score, percentage, or algorithm.' },
    { q: 'What is a Target?', a: 'A Target is a candidate\'s dedicated recruitment context for one specific company vacancy. Each target keeps its own requirements, evidence, and privacy boundary.' },
    { q: 'What does Evidence Gap mean?', a: 'An Evidence Gap means sufficient supporting evidence is not currently available for a vacancy requirement. It does not mean the candidate lacks that skill.' },
    { q: 'Can one company see my activity with another company?', a: 'No. Target data is strictly compartmentalized by company. Company A can see only information connected to your Target for Company A.' },
    { q: 'Is GenuAI free for candidates?', a: 'Core candidate access is free, including exploring verified vacancies, creating targets, and participating in the standard target workflow.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', color: '#0f172a', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        height: 64, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.3px' }}>
              GenuAI Technologies
            </span>
            <span style={{ fontSize: 9.5, color: '#b8860b', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Recruitment Intelligence
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="landing-nav">
            <a href="#how-it-works" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>How It Works</a>
            <a href="#for-candidates" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>Candidates</a>
            <a href="#for-companies" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>Companies</a>
            <a href="#faq" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>FAQ</a>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: '#475569', padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link href="/login?mode=register" style={{ fontSize: 13, fontWeight: 700, color: '#fff', padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#b8860b,#d4af37)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              Get Started <ArrowRight size={13} />
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="landing-mobile-btn" aria-label="Menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 99, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {['#how-it-works', '#for-candidates', '#for-companies', '#faq'].map((href, i) => (
            <a key={i} href={href} onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>
              {['How It Works', 'For Candidates', 'For Companies', 'FAQ'][i]}
            </a>
          ))}
          <div style={{ height: 1, background: '#f1f5f9' }} />
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px', textAlign: 'center', background: 'linear-gradient(135deg,#b8860b,#d4af37)', color: '#fff', borderRadius: 9, fontWeight: 700, textDecoration: 'none' }}>Sign In to Workspace</Link>
        </div>
      )}

      <main id="main-content">

        {/* ── HERO ── Full-viewport background image */}
        <section style={{ position: 'relative', height: '100vh', minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {/* Background image */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/landing-hero.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center bottom',
          }} />
          {/* Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,15,30,0.55) 0%, rgba(10,15,30,0.35) 50%, rgba(10,15,30,0.65) 100%)' }} />

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 820, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.5)',
              color: '#fde68a', fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Requirement-Centered Recruitment Intelligence · Live
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5.5vw, 58px)', fontWeight: 900,
              color: '#ffffff', letterSpacing: '-1.5px', lineHeight: 1.14,
              margin: '0 0 22px',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
              Prepare for the role.<br />
              <span style={{ background: 'linear-gradient(90deg,#d4af37,#f5d890)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Show relevant evidence.
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: '0 0 36px', fontWeight: 400 }}>
              GenuAI connects verified vacancies with role-specific evidence, transparent requirement coverage, and human-led hiring decisions.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login?mode=register" style={{
                padding: '14px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg,#b8860b,#d4af37)',
                color: '#fff', fontSize: 15, fontWeight: 800,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(184,134,11,0.4)',
              }}>
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" style={{
                padding: '14px 32px', borderRadius: 10,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
              }}>
                How It Works
              </a>
            </div>

            <div style={{ marginTop: 36, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
              <span>✓ Human-led decisions</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>✓ Target-specific privacy</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>✓ Requirement-linked evidence</span>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span>Scroll to explore</span>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.25)' }} />
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '28px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
            {[
              { icon: <CheckCircle2 size={17} color="#059669" />, text: 'Verified company & vacancy workflow' },
              { icon: <FileCheck size={17} color="#b8860b" />, text: 'Requirement-linked evidence' },
              { icon: <Lock size={17} color="#0284c7" />, text: 'Target-specific data separation' },
              { icon: <UserCheck size={17} color="#854d0e" />, text: 'Human-led hiring decisions' },
              { icon: <FileText size={17} color="#64748b" />, text: 'Auditable workflow history' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.icon}
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>How It Works</span>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 14px' }}>
              One role requirement. A clearer recruitment journey.
            </h2>
            <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.65 }}>
              The requirement-centered pipeline powering GenuAI — from vacancy definition to human decision.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e8e4db',
                padding: '28px 24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(184,134,11,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(184,134,11,0.2)', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>{s.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOR CANDIDATES ── */}
        <section id="for-candidates" style={{ background: '#fff', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 56, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>For Candidates</span>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 16px' }}>
                More than a resume.<br />Target real roles with evidence.
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                Build a transparent record of your role-relevant preparation and evidence. Maintain reusable global profiles while keeping target applications completely separate across companies.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Discover verified published vacancies with transparent rubrics.',
                  'Keep Company A and Company B targets and evidence isolated.',
                  'Submit projects, work samples, and certificates per requirement.',
                  'Follow candidate-visible status updates at any time.',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155' }}>
                    <CheckCircle2 size={17} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login?role=candidate" style={{
                padding: '12px 28px', borderRadius: 9, fontSize: 14, fontWeight: 800, textDecoration: 'none',
                background: 'linear-gradient(135deg,#b8860b,#d4af37)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 3px 12px rgba(184,134,11,0.25)',
              }}>
                Candidate Workspace <ArrowRight size={15} />
              </Link>
            </div>

            {/* Preview card */}
            <div style={{ background: '#fafaf8', borderRadius: 16, border: '1px solid #e8e4db', padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Candidate Workspace Preview</div>
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>My Targets</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['Backend Developer — Alpha Technologies', 'Data Analyst — Beta Analytics'].map((t, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#059669' : '#94a3b8', flexShrink: 0 }} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #b8860b', padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', marginBottom: 10 }}>Active: Backend Developer</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { req: 'Java', status: 'Supported', color: '#059669', bg: '#ecfdf5' },
                    { req: 'SQL', status: 'Pending', color: '#92400e', bg: '#fffbeb' },
                    { req: 'REST APIs', status: 'Evidence Gap', color: '#991b1b', bg: '#fef2f2' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.req}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 99, background: r.bg, color: r.color, fontWeight: 700, fontSize: 11.5 }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR COMPANIES ── */}
        <section id="for-companies" style={{ background: '#fafaf8', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 56, alignItems: 'center' }}>
            {/* Preview */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4db', padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Recruiter Review Workspace</div>
              <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Backend Developer (v2)</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>3 of 4 requirements supported · 1 Evidence Gap</div>
              </div>
              <div style={{ background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>Human Review Required</div>
                <div style={{ fontSize: 12, color: '#78350f' }}>Review work sample for REST APIs requirement.</div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em' }}>For Companies</span>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 16px' }}>
                Review evidence with role context.<br />Make human hiring decisions.
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                Define exact role requirements and evaluation criteria. Review target-linked candidate work samples and evidence without opaque black-box AI filtering.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Define departments, roles, vacancies, and evaluation rubrics.',
                  'Review candidate evidence within your company workspace.',
                  'Request additional information where evidence is limited.',
                  'Maintain auditable hiring workflow history and vacancy versioning.',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155' }}>
                    <CheckCircle2 size={17} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login?role=company" style={{
                padding: '12px 28px', borderRadius: 9, fontSize: 14, fontWeight: 800, textDecoration: 'none',
                background: 'linear-gradient(135deg,#b8860b,#d4af37)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 3px 12px rgba(184,134,11,0.25)',
              }}>
                Company Workspace <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── TRUST & PRIVACY ── */}
        <section id="trust" style={{ background: '#fff', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform Governance</span>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 14px' }}>
                Designed for clarity, privacy, and human review.
              </h2>
              <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
                How GenuAI protects candidate data, enforces boundaries, and maintains human responsibility.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
              {[
                { icon: <Lock size={22} color="#b8860b" />, title: 'Target-Specific Privacy', desc: 'Company data is separated by Target. One company cannot access another company\'s target history, evidence, or recruiter notes.' },
                { icon: <UserCheck size={22} color="#059669" />, title: 'Human-Led Decisions', desc: 'GenuAI organizes requirement evidence. Human recruiters and hiring managers make all hiring decisions.' },
                { icon: <FileCheck size={22} color="#0284c7" />, title: 'Evidence Traceability', desc: 'Evidence submission records, file hashes, and recruiter review decisions maintain persistent audit logs.' },
                { icon: <CheckCircle2 size={22} color="#b8860b" />, title: 'Governance & Audit History', desc: 'Company verification and vacancy moderation ensure legitimate recruitment workflows across all tenants.' },
              ].map((card, i) => (
                <div key={i} style={{ background: '#fafaf8', borderRadius: 14, border: '1px solid #e8e4db', padding: '28px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ marginBottom: 14 }}>{card.icon}</div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" style={{ background: '#fafaf8', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FAQ</span>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 0' }}>
                Common questions answered.
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e4db', overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleFaq(i)}
                    style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{faq.q}</span>
                    {openFaqIndex === i ? <ChevronUp size={18} color="#b8860b" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </button>
                  {openFaqIndex === i && (
                    <div style={{ padding: '0 24px 20px', fontSize: 14, color: '#64748b', lineHeight: 1.7, borderTop: '1px solid #f1f5f9' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ background: '#fff', borderTop: '1px solid #f1f5f9', padding: '96px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Get Started</span>
            <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', margin: '12px 0 16px', lineHeight: 1.2 }}>
              Build a clearer recruitment workflow.
            </h2>
            <p style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>
              Whether you are hiring for one role or coordinating recruitment across teams, GenuAI helps connect vacancy requirements with relevant evidence and human review.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login?mode=register" style={{
                padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none',
                background: 'linear-gradient(135deg,#b8860b,#d4af37)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(184,134,11,0.3)',
              }}>
                Create Account <ArrowRight size={16} />
              </Link>
              <Link href="/login?role=company" style={{
                padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none',
                background: '#fff', border: '1.5px solid #d4af37', color: '#854d0e',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                Company Workspace
              </Link>
            </div>
            <p style={{ marginTop: 18, fontSize: 12.5, color: '#94a3b8' }}>
              Core candidate access is free. Company access follows a verification workflow.
            </p>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '56px 28px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 36, marginBottom: 44 }}>
            <div>
              <span className="gold-gradient-text" style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.3px', display: 'block', marginBottom: 6 }}>GenuAI Technologies</span>
              <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, margin: '0 0 10px' }}>
                Requirement-centered recruitment intelligence. Human-led hiring decisions.
              </p>
              <span style={{ fontSize: 11, color: '#475569' }}>No automated AI hiring decisions.</span>
            </div>
            {[
              { title: 'Product', links: [['#how-it-works', 'How It Works'], ['#for-candidates', 'For Candidates'], ['#for-companies', 'For Companies'], ['/login', 'Sign In']] },
              { title: 'Trust & Legal', links: [['/trust', 'Trust & Privacy'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Use'], ['/accessibility', 'Accessibility']] },
              { title: 'Support', links: [['/contact', 'Contact Support'], ['/contact', 'Report a Concern'], ['/accessibility', 'Accommodation Request']] },
            ].map((col, i) => (
              <div key={i}>
                <h3 style={{ fontSize: 11, fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{col.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(([href, label], j) => (
                    <li key={j}>
                      <Link href={href} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#475569' }}>
            <span>© {new Date().getFullYear()} GenuAI Technologies. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/privacy" style={{ color: '#475569', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ color: '#475569', textDecoration: 'none' }}>Terms</Link>
              <Link href="/accessibility" style={{ color: '#475569', textDecoration: 'none' }}>Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
