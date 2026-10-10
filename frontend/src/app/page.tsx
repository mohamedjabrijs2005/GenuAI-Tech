'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, FileCheck, ArrowRight,
  Building2, Lock, Layers, CheckCircle2, Menu, X, ChevronDown, ChevronUp,
  FileText, UserCheck, HelpCircle, Mail, ExternalLink, RefreshCw
} from 'lucide-react';
import api from '@/lib/api';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [liveVacanciesCount, setLiveVacanciesCount] = useState<number | null>(null);
  const [syncTime, setSyncTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Fetch real-time published vacancies count from live backend
    api.get('/candidate-portal/vacancies?limit=1')
      .then((res) => {
        if (res.data?.pagination?.total !== undefined) {
          setLiveVacanciesCount(res.data.pagination.total);
        }
      })
      .catch(() => {
        setLiveVacanciesCount(null);
      });

    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const STEPS = [
    {
      num: '1',
      title: 'Define',
      desc: 'Companies define roles, requirements, and accepted evaluation methods.',
      isLive: true,
    },
    {
      num: '2',
      title: 'Verify',
      desc: 'Platform governance verifies company status and moderates vacancy listings.',
      isLive: true,
    },
    {
      num: '3',
      title: 'Target',
      desc: 'Candidates select a specific published vacancy to create an isolated Target.',
      isLive: true,
    },
    {
      num: '4',
      title: 'Prepare',
      desc: 'Candidates review role-relevant learning benchmarks when available.',
      isLive: false,
    },
    {
      num: '5',
      title: 'Prove',
      desc: 'Candidates complete company-configured assessments when configured.',
      isLive: false,
    },
    {
      num: '6',
      title: 'Evidence',
      desc: 'Candidates submit projects, work samples, and portfolio items against requirements.',
      isLive: true,
    },
    {
      num: '7',
      title: 'Review',
      desc: 'Recruiters evaluate evidence coverage with role-specific rubrics.',
      isLive: true,
    },
    {
      num: '8',
      title: 'Human Decision',
      desc: 'Recruiters record hiring outcomes. Zero automated AI rejections.',
      isLive: true,
    },
  ];

  const FAQS = [
    {
      q: 'Is GenuAI an AI hiring system?',
      a: 'No. GenuAI helps organize role requirements, candidate evidence, and recruiter review context. Hiring decisions remain entirely with people at the hiring company.',
    },
    {
      q: 'Does GenuAI automatically reject candidates?',
      a: 'No. The platform does not make automatic hiring or rejection decisions based on an AI score, percentage, or algorithm.',
    },
    {
      q: 'What is a Target?',
      a: 'A Target is a candidate’s dedicated recruitment context for one specific company vacancy version (Target = Candidate + Company + Vacancy + Vacancy Version). Each target keeps its own requirements, evidence, and privacy boundary.',
    },
    {
      q: 'What does Evidence Gap mean?',
      a: 'An Evidence Gap means sufficient supporting evidence is not currently available for a vacancy requirement. It does not mean the candidate lacks that skill.',
    },
    {
      q: 'Can one company see my activity with another company?',
      a: 'No. Target data is strictly compartmentalized by company. Company A can see only information connected to your Target for Company A.',
    },
    {
      q: 'Are certificates automatically accepted as proof?',
      a: 'No. Certificates and work samples can be submitted as supporting evidence where accepted, but recruiters evaluate all evidence in the context of the specific vacancy requirement.',
    },
    {
      q: 'What does a file integrity record mean?',
      a: 'A file integrity record (cryptographic SHA-256 hash) confirms that a submitted file version has not been altered after recording. It does not independently verify document authenticity, ownership, or competence.',
    },
    {
      q: 'Is assessment monitoring used?',
      a: 'Only where a company explicitly configures an official assessment module. Candidates receive prior notice of monitored parameters, and any integrity signals require human recruiter review.',
    },
    {
      q: 'How can I request an accommodation?',
      a: 'Candidates can submit confidential accommodation requests through the Accessibility page or within enabled assessment and interview workflows.',
    },
    {
      q: 'Is GenuAI available for companies?',
      a: 'Yes. Approved companies can create a workspace, define roles and departments, publish verified vacancies, and evaluate target evidence according to available platform features.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', color: '#0f172a', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only"
        style={{
          position: 'absolute',
          left: -9999,
          top: 'auto',
          width: 1,
          height: 1,
          overflow: 'hidden',
          zIndex: 9999,
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'fixed';
          e.currentTarget.style.top = '16px';
          e.currentTarget.style.left = '16px';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.padding = '10px 18px';
          e.currentTarget.style.background = '#b8860b';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderRadius = '8px';
          e.currentTarget.style.fontWeight = 'bold';
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
        }}
      >
        Skip to main content
      </a>

      {/* 1. STICKY TOPBAR / HEADER (Matches the 3 Dashboards) */}
      <header className="landing-header">
        {/* Brand identity matching dashboards without shield logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <div>
            <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              GenuAI Technologies
            </div>
            <span
              className="sidebar-logo-sub"
              style={{
                fontSize: 10,
                color: '#854d0e',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              Recruitment Intelligence
            </span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav aria-label="Main Navigation" className="landing-nav">
          <a href="#problem" style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>Product</a>
          <a href="#how-it-works" style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>How It Works</a>
          <a href="#candidates" style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>For Candidates</a>
          <a href="#companies" style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>For Companies</a>
          <a href="#trust" style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>Trust &amp; Privacy</a>
          <Link href="/candidate/vacancies" style={{ fontSize: 13, fontWeight: 700, color: '#b8860b', textDecoration: 'none' }}>Vacancies</Link>
        </nav>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {syncTime && (
            <div className="landing-status-pill">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
              <span style={{ color: '#059669', fontWeight: 700 }}>Connected</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{syncTime}</span>
            </div>
          )}

          <Link
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
              padding: '7px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              border: '1px solid #cbd5e1',
              background: '#fff',
            }}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
              boxShadow: '0 2px 6px rgba(184, 134, 11, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Create Account</span>
            <ArrowRight size={13} />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="landing-mobile-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#ffffff',
            zIndex: 99,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <a href="#problem" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>Product</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>How It Works</a>
          <a href="#candidates" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>For Candidates</a>
          <a href="#companies" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>For Companies</a>
          <a href="#trust" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>Trust &amp; Privacy</a>
          <Link href="/candidate/vacancies" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 700, color: '#b8860b', textDecoration: 'none' }}>Explore Vacancies</Link>
          <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
          <Link href="/register?role=candidate" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px', textAlign: 'center', background: '#b8860b', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Candidate Registration</Link>
          <Link href="/register?role=company" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px', textAlign: 'center', background: '#0f172a', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Company Registration</Link>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main id="main-content" style={{ flex: 1 }}>

        {/* 2. HERO SECTION */}
        <section style={{ padding: '64px 24px 44px', maxWidth: 1200, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 99,
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#854d0e',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={15} style={{ color: '#b8860b' }} />
            <span>Requirement-Centered Recruitment Intelligence</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 900,
              letterSpacing: '-1.2px',
              lineHeight: 1.18,
              color: '#0f172a',
              maxWidth: 900,
              margin: '0 0 18px 0',
            }}
          >
            Prepare for the role. Show relevant evidence.{' '}
            <span className="gold-gradient-text">Make hiring clearer.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', lineHeight: 1.6, color: '#475569', maxWidth: 740, margin: '0 0 32px 0' }}>
            GenuAI connects verified vacancies with role-specific preparation, target-based evidence, transparent requirement coverage, recruiter review, and human-led hiring decisions.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 }}>
            <Link
              href="/candidate/vacancies"
              style={{
                padding: '13px 26px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                color: '#ffffff',
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(184, 134, 11, 0.25)',
              }}
            >
              <Compass size={17} />
              <span>Explore Verified Vacancies</span>
              {liveVacanciesCount !== null && (
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 99 }}>
                  {liveVacanciesCount} active
                </span>
              )}
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/register?role=candidate"
              style={{
                padding: '13px 26px',
                borderRadius: 9,
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Create Candidate Account</span>
            </Link>
          </div>

          <div style={{ marginBottom: 28 }}>
            <Link href="/register?role=company" style={{ fontSize: 13, color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>
              Hiring for a company? Create a company workspace →
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#64748b', fontWeight: 600, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>✓ Human-led decisions</span>
            <span>•</span>
            <span>✓ Target-specific privacy</span>
            <span>•</span>
            <span>✓ Requirement-linked evidence</span>
          </div>

          {/* Workflow Diagram */}
          <div
            style={{
              marginTop: 44,
              width: '100%',
              maxWidth: 960,
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
              padding: '24px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Illustrative Workflow: How GenuAI Organizes Recruitment Information
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Standardized Rubrics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, textAlign: 'left' }}>
              <div style={{ background: '#fafaf9', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 2 }}>1. Role Requirement</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Java &amp; REST APIs</div>
                <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700, marginTop: 2 }}>Required Skill</div>
              </div>

              <div style={{ background: '#fafaf9', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 2 }}>2. Candidate Target</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Backend Developer</div>
                <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, marginTop: 2 }}>Alpha Technologies</div>
              </div>

              <div style={{ background: '#fafaf9', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 2 }}>3. Supporting Evidence</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Project &amp; Work Sample</div>
                <div style={{ fontSize: 10.5, color: '#854d0e', fontWeight: 600, marginTop: 2 }}>Requirement-Linked</div>
              </div>

              <div style={{ background: '#fafaf9', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 2 }}>4. Evidence Coverage</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#059669' }}>Supported</div>
                <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, marginTop: 2 }}>Transparent State</div>
              </div>

              <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 2 }}>5. Recruiter Review</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#14532d' }}>Human Decision</div>
                <div style={{ fontSize: 10.5, color: '#166534', fontWeight: 600, marginTop: 2 }}>Contextual Evaluation</div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11.5, color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
              No automatic hiring decisions. GenuAI helps people review role-relevant evidence with context.
            </div>
          </div>
        </section>

        {/* 3. TRUST BAR */}
        <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '20px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Verified company &amp; vacancy workflow</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={18} style={{ color: '#b8860b', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Requirement-linked evidence</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Target-specific data separation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} style={{ color: '#854d0e', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Human-led hiring decisions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: '#475569', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Auditable workflow history</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Built to make recruitment information clearer—not to replace human judgment.
            </div>
          </div>
        </section>

        {/* 4. THE PROBLEM SECTION */}
        <section id="problem" style={{ padding: '72px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: 10 }}>
              Recruitment data is scattered. Hiring context should not be.
            </h2>
            <p style={{ fontSize: 15, color: '#475569', maxWidth: 700, margin: '0 auto' }}>
              Traditional hiring tools separate vacancy definition, candidate preparation, assessments, work samples, and interview scorecards. GenuAI connects these around the requirements of a specific role.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Traditional Process */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 26 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#ba1a1a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Traditional Fragmented Process
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                Disjointed Documents &amp; Opaque Scans
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#475569' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#ba1a1a', fontWeight: 800 }}>✕</span>
                  <span>Generic resumes evaluated without specific requirement mapping.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#ba1a1a', fontWeight: 800 }}>✕</span>
                  <span>Projects and portfolios disconnected from vacancy criteria.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#ba1a1a', fontWeight: 800 }}>✕</span>
                  <span>Opaque black-box AI scores that automatically filter candidate applications.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#ba1a1a', fontWeight: 800 }}>✕</span>
                  <span>Recruiters left guessing which skills are actually supported by evidence.</span>
                </li>
              </ul>
            </div>

            {/* GenuAI Process */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '2px solid #b8860b', padding: 26, boxShadow: '0 6px 20px rgba(184, 134, 11, 0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                GenuAI Requirement-Centered Engine
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                Requirement → Evidence → Coverage → Decision
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                  <span>Company defines exact vacancy requirements and evaluation methods.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                  <span>Candidates submit requirement-linked projects, work samples, and assessments.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                  <span>Transparent coverage states (Supported, Limited, Pending, Evidence Gap).</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                  <span>Recruiters evaluate evidence in context; final hiring decisions remain human-led.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. PRODUCT CORE / REQUIREMENT MATRIX */}
        <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: 10 }}>
                Built around what the role actually requires.
              </h2>
              <p style={{ fontSize: 15, color: '#475569', maxWidth: 680, margin: '0 auto' }}>
                Every target begins with a verified vacancy and its specific requirements. GenuAI organizes candidate evidence against each requirement cleanly.
              </p>
            </div>

            <div style={{ background: '#fafaf9', borderRadius: 14, border: '1px solid #cbd5e1', padding: 24, maxWidth: 880, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 }}>Backend Developer</h3>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Alpha Technologies • Engineering Department</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#fef3c7', color: '#92400e' }}>Status: Preparing</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>Java</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#fee2e2', color: '#991b1b' }}>REQUIRED</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Evidence: Official Assessment + Java Project</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                    Supported
                  </span>
                </div>

                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>SQL</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#fee2e2', color: '#991b1b' }}>REQUIRED</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Evidence: Official Assessment Pending</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                    Pending
                  </span>
                </div>

                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>REST APIs</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#fee2e2', color: '#991b1b' }}>REQUIRED</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Evidence: No supporting evidence submitted yet</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    Evidence Gap
                  </span>
                </div>

                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>Backend project experience</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>PREFERRED</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Evidence: GitHub Repository Link</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                    Limited
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12.5, fontWeight: 600, textAlign: 'center' }}>
                An Evidence Gap does not mean a candidate lacks a skill. It means sufficient supporting evidence is not currently available for that requirement.
              </div>
            </div>
          </div>
        </section>

        {/* 6. HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: '72px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: 10 }}>
              One role requirement. A clearer recruitment journey.
            </h2>
            <p style={{ fontSize: 15, color: '#475569', maxWidth: 680, margin: '0 auto 18px' }}>
              The 8-step requirement-centered pipeline powering GenuAI.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, fontSize: 12, fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                Available Now
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1' }} />
                In Development
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {STEPS.map((s) => (
              <div
                key={s.num}
                style={{
                  background: '#ffffff',
                  borderRadius: 10,
                  border: `1px solid ${s.isLive ? '#b8860b' : '#e2e8f0'}`,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: s.isLive ? '0 3px 10px rgba(184, 134, 11, 0.05)' : 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: s.isLive ? '#b8860b' : '#94a3b8' }}>
                      0{s.num}
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: s.isLive ? '#ecfdf5' : '#f1f5f9',
                        color: s.isLive ? '#065f46' : '#64748b',
                        border: `1px solid ${s.isLive ? '#a7f3d0' : '#e2e8f0'}`,
                      }}
                    >
                      {s.isLive ? 'Available' : 'Planned'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{s.title}</h3>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FOR CANDIDATES */}
        <section id="candidates" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Candidates</span>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '6px 0 14px' }}>
                More than a resume. Target real roles with evidence.
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                Build a transparent record of your role-relevant preparation and evidence. Maintain reusable global profiles while keeping target applications completely separate across companies.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Discover verified published vacancies with transparent rubrics.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Keep Company A and Company B targets and evidence isolated.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Submit projects, work samples, and certificates per requirement.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Follow candidate-visible status updates and request accommodations.</span>
                </li>
              </ul>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  href="/candidate/vacancies"
                  style={{
                    padding: '11px 22px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  Explore Vacancies
                </Link>
                <Link
                  href="/register?role=candidate"
                  style={{
                    padding: '11px 22px',
                    borderRadius: 8,
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: 13.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  Create Candidate Account
                </Link>
              </div>
            </div>

            {/* Candidate Workspace Card Preview */}
            <div style={{ background: '#fafaf9', borderRadius: 14, border: '1px solid #cbd5e1', padding: 22 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', marginBottom: 10 }}>
                Candidate Workspace Preview
              </div>
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>My Targets</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>• Backend Developer — Alpha Technologies</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>• Data Analyst — Beta Analytics</div>
              </div>
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>Active Target: Backend Developer</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9' }}>Requirements</span>
                  <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9' }}>Evidence Locker</span>
                  <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9' }}>Coverage Ledger</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FOR COMPANIES */}
        <section id="companies" style={{ padding: '72px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div style={{ background: '#fafaf9', borderRadius: 14, border: '1px solid #cbd5e1', padding: 22, order: 2 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 10 }}>
                Recruiter Review Workspace Preview
              </div>
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Role: Backend Developer (v2)</div>
                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                  Requirement Coverage: 3 of 4 Supported • 1 Evidence Gap
                </div>
              </div>
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#854d0e' }}>Human Review Action Required</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Review submitted project work sample for REST APIs requirement.
                </div>
              </div>
            </div>

            <div style={{ order: 1 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Companies</span>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '6px 0 14px' }}>
                Review evidence with role context. Make human hiring decisions.
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                Define exact role requirements and evaluation criteria. Review target-linked candidate work samples, assessments, and evidence without opaque black-box AI filtering.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Define departments, roles, vacancies, and clear evaluation rubrics.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Review candidate evidence strictly within your company workspace context.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Request additional information or work samples where evidence is limited.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Maintain auditable hiring workflow history and vacancy versioning.</span>
                </li>
              </ul>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  href="/register?role=company"
                  style={{
                    padding: '11px 22px',
                    borderRadius: 8,
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  Create Company Workspace
                </Link>
                <Link
                  href="/login?role=company"
                  style={{
                    padding: '11px 22px',
                    borderRadius: 8,
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: 13.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  Sign In to Workspace
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 9. PRIVACY, SECURITY, AND HUMAN OVERSIGHT */}
        <section id="trust" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Platform Governance &amp; Ethics
              </span>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.8px', margin: '6px 0 10px' }}>
                Designed for clarity, privacy, and human review.
              </h2>
              <p style={{ fontSize: 15, color: '#cbd5e1', maxWidth: 680, margin: '0 auto' }}>
                How GenuAI protects candidate data, enforces multi-tenant boundaries, and maintains human responsibility.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 30 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', padding: 20 }}>
                <Lock size={20} style={{ color: '#fde047', marginBottom: 10 }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>1. Target-Specific Privacy</h3>
                <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  Company data is separated by Target. One company cannot access another company’s target history, evidence, or recruiter notes.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', padding: 20 }}>
                <UserCheck size={20} style={{ color: '#a7f3d0', marginBottom: 10 }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>2. Human-Led Decisions</h3>
                <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  GenuAI organizes requirement evidence. Human recruiters and hiring managers make all hiring decisions.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', padding: 20 }}>
                <FileCheck size={20} style={{ color: '#93c5fd', marginBottom: 10 }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>3. Evidence Traceability</h3>
                <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  Evidence submission records, file hashes, and recruiter review decisions maintain persistent audit logs.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', padding: 20 }}>
                <CheckCircle2 size={20} style={{ color: '#fde047', marginBottom: 10 }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>4. Governance &amp; Audit History</h3>
                <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  Company verification and vacancy moderation ensure legitimate recruitment workflows across all tenants.
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(212, 175, 55, 0.1)', borderRadius: 8, border: '1px solid rgba(212, 175, 55, 0.3)', padding: 14, fontSize: 12.5, color: '#fef08a', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
              A file-integrity record can show that a submitted file has not changed after it was recorded. It does not by itself prove document authenticity, ownership, or competence.
            </div>
          </div>
        </section>

        {/* 10. ACCESSIBILITY */}
        <section style={{ padding: '72px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accessibility Commitment</span>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 32px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '6px 0 14px' }}>
                A recruitment journey designed to be more accessible.
              </h2>
              <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                GenuAI is designed with accessibility best practices—including keyboard navigation, screen-reader compatibility, accessible form labels, high contrast, and confidential accommodation channels.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✓ Keyboard-accessible navigation &amp; visible focus states</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✓ Clear semantic headings and screen-reader labels</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✓ High-contrast status indicators with plain-language labels</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✓ Confidential accommodation request channel for candidates</li>
              </ul>

              <Link
                href="/accessibility"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: '#b8860b',
                  textDecoration: 'none',
                }}
              >
                <span>Read Accessibility &amp; Accommodation Policies</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Accommodations &amp; Support</div>
              <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>
                Candidates can submit confidential requests for time extensions, alternative evaluation formats, or assistive technology support without disclosing unnecessary disability details.
              </p>
              <Link
                href="/contact"
                style={{
                  display: 'inline-block',
                  padding: '9px 16px',
                  borderRadius: 7,
                  background: '#f1f5f9',
                  color: '#0f172a',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Submit Accommodation Enquiry →
              </Link>
            </div>
          </div>
        </section>

        {/* 11. FAQ ACCORDION */}
        <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '72px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: 8 }}>
                Questions, answered clearly.
              </h2>
              <p style={{ fontSize: 14.5, color: '#475569' }}>
                Honest answers about GenuAI's recruitment intelligence platform.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    style={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: isOpen ? '#fafaf9' : '#ffffff',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      style={{
                        width: '100%',
                        padding: '16px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} style={{ color: '#b8860b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 18px 16px', fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 12. FINAL CTA */}
        <section style={{ padding: '72px 24px', textAlign: 'center', maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', marginBottom: 12 }}>
            Start with a clearer role. Build a stronger evidence story.
          </h2>
          <p style={{ fontSize: 15.5, color: '#475569', maxWidth: 640, margin: '0 auto 28px' }}>
            Explore verified opportunities, create a target, and understand how your preparation relates to real role requirements.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 }}>
            <Link
              href="/candidate/vacancies"
              style={{
                padding: '13px 26px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                color: '#ffffff',
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(184, 134, 11, 0.25)',
              }}
            >
              <Compass size={17} />
              <span>Explore Verified Vacancies</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/register"
              style={{
                padding: '13px 26px',
                borderRadius: 9,
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <span>Create an Account</span>
            </Link>
          </div>

          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Hiring for a role? <Link href="/register?role=company" style={{ color: '#854d0e', fontWeight: 700 }}>Create a company workspace →</Link>
          </div>
        </section>

      </main>

      {/* 13. COMPLETE SEMANTIC FOOTER */}
      <footer style={{ background: '#0f172a', color: '#cbd5e1', paddingTop: 52, paddingBottom: 28, borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>GenuAI Technologies</span>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 12px' }}>
                Requirement-centered recruitment intelligence. Connecting company vacancy requirements with candidate preparation, evidence, and human-led hiring decisions.
              </p>
              <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                No automated AI hiring decisions.
              </span>
            </div>

            {/* Product */}
            <div>
              <h3 style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Product
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <li><a href="#how-it-works" style={{ color: '#cbd5e1', textDecoration: 'none' }}>How It Works</a></li>
                <li><a href="#candidates" style={{ color: '#cbd5e1', textDecoration: 'none' }}>For Candidates</a></li>
                <li><a href="#companies" style={{ color: '#cbd5e1', textDecoration: 'none' }}>For Companies</a></li>
                <li><Link href="/candidate/vacancies" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Explore Vacancies</Link></li>
                <li><Link href="/register" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Create Account</Link></li>
                <li><Link href="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Sign In</Link></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h3 style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Platform
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <li><Link href="/register?role=company" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Company Workspace</Link></li>
                <li><Link href="/register?role=candidate" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Candidate Workspace</Link></li>
                <li><Link href="/trust" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Verification Process</Link></li>
                <li><a href="#problem" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Evidence &amp; Coverage</a></li>
              </ul>
            </div>

            {/* Trust & Legal */}
            <div>
              <h3 style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Trust &amp; Legal
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <li><Link href="/trust" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Trust &amp; Privacy</Link></li>
                <li><Link href="/privacy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Privacy Policy</Link></li>
                <li><Link href="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Terms of Use</Link></li>
                <li><Link href="/accessibility" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Accessibility</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Support
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <li><Link href="/contact" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Contact Support</Link></li>
                <li><Link href="/contact" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Report a Concern</Link></li>
                <li><Link href="/accessibility" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Accommodation Request</Link></li>
              </ul>
            </div>
          </div>

          {/* Legal Review Disclaimer */}
          <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: 11, color: '#94a3b8', marginBottom: 24, textAlign: 'center' }}>
            This page is a product draft and should be reviewed by qualified legal counsel before production launch.
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 11.5, color: '#64748b' }}>
            <div>
              © {new Date().getFullYear()} GenuAI Technologies. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms</Link>
              <Link href="/accessibility" style={{ color: '#94a3b8', textDecoration: 'none' }}>Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
