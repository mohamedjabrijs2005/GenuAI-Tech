'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, FileCheck, Lock, UserCheck, FileText,
  Menu, X, ChevronDown, ChevronUp, Check, Sparkles, Building2, User,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const STEPS = [
    { num: '01', title: 'Define', desc: 'Companies define roles, requirements, and evaluation methods.' },
    { num: '02', title: 'Verify', desc: 'Platform governance verifies company status and moderates vacancy listings.' },
    { num: '03', title: 'Target', desc: 'Candidates select a specific published vacancy to create an isolated Target.' },
    { num: '04', title: 'Evidence', desc: 'Candidates submit projects, work samples, and portfolio items against requirements.' },
    { num: '05', title: 'Review', desc: 'Recruiters evaluate evidence coverage with role-specific rubrics.' },
    { num: '06', title: 'Decision', desc: 'Recruiters record hiring outcomes. Zero automated AI rejections.' },
  ];

  const FAQS = [
    { q: 'Is GenuAI an AI hiring system?', a: 'No. GenuAI helps organize role requirements, candidate evidence, and recruiter review context. Hiring decisions remain entirely with people at the hiring company.' },
    { q: 'Does GenuAI automatically reject candidates?', a: 'No. The platform does not make automatic hiring or rejection decisions based on an AI score, percentage, or algorithm.' },
    { q: 'What is a Target?', a: "A Target is a candidate's dedicated recruitment context for one specific company vacancy. Each target keeps its own requirements, evidence, and privacy boundary." },
    { q: 'What does Evidence Gap mean?', a: 'An Evidence Gap means sufficient supporting evidence is not currently available for a vacancy requirement. It does not mean the candidate lacks that skill.' },
    { q: 'Can one company see my activity with another?', a: 'No. Target data is strictly compartmentalized by company. Company A can see only information connected to your Target for Company A.' },
    { q: 'Is GenuAI free for candidates?', a: 'Core candidate access is free, including exploring verified vacancies, creating targets, and participating in the standard target workflow.' },
  ];

  const PLANS = [
    {
      tag: 'Always Free',
      tagColor: '#059669',
      tagBg: '#ecfdf5',
      name: 'Candidate',
      price: '₹0',
      cycle: 'Always Free',
      desc: 'For candidates exploring verified roles and building target-specific evidence records.',
      highlight: false,
      cta: 'Create Candidate Account',
      href: '/login?role=candidate&mode=register',
      features: [
        'Candidate profile & evidence locker',
        'Explore verified vacancies',
        'Create & manage isolated targets',
        'Submit requirement-linked evidence',
        'Candidate-visible status tracking',
        'Strict company-by-company privacy',
      ],
    },
    {
      tag: 'For Companies',
      tagColor: '#b8860b',
      tagBg: 'rgba(212,175,55,0.12)',
      name: 'Starter',
      price: 'On Request',
      cycle: 'Early Access',
      desc: 'For hiring teams defining vacancies and reviewing candidate evidence without algorithmic filters.',
      highlight: true,
      cta: 'Apply for Company Access',
      href: '/login?role=company&mode=register',
      features: [
        'Verified company workspace',
        'Vacancy creation & publishing',
        'Requirement definition & rubrics',
        'Candidate evidence review portal',
        'Recruiter seat management',
        'Auditable hiring pipeline history',
      ],
    },
    {
      tag: 'Scale',
      tagColor: '#0284c7',
      tagBg: '#eff6ff',
      name: 'Pro / Enterprise',
      price: 'Custom',
      cycle: 'Tailored',
      desc: 'For growing organizations needing multi-department governance and custom evaluation workflows.',
      highlight: false,
      cta: 'Contact Advisory Team',
      href: '/contact',
      features: [
        'Everything in Starter',
        'Multiple recruiter & reviewer seats',
        'Custom evaluation rubrics & weights',
        'Advanced compliance reporting',
        'Multi-department governance',
        'Dedicated onboarding pathway',
      ],
    },
  ];

  // Colors adaptive to scroll state
  const navLinkColor = scrolled ? '#334155' : 'rgba(255, 255, 255, 0.9)';
  const navBtnBorder = scrolled ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.35)';
  const navBtnBg = scrolled ? '#ffffff' : 'rgba(255, 255, 255, 0.12)';
  const navBtnColor = scrolled ? '#334155' : '#ffffff';

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', color: '#0f172a', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── NAVBAR — Seamless transparent over hero, smooth frosted glass on scroll ── */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 66,
        display: 'flex',
        alignItems: 'center',
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.16)' : 'none',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.04)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo matching dashboard style */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              className={scrolled ? 'sidebar-logo-text gold-gradient-text' : ''}
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '-0.3px',
                color: scrolled ? undefined : '#ffffff',
                textShadow: scrolled ? 'none' : '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.3s',
              }}
            >
              GenuAI Technologies
            </span>
            <span style={{
              fontSize: 9.5,
              color: scrolled ? '#b8860b' : 'rgba(245, 216, 144, 0.95)',
              fontWeight: 800,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              marginTop: 2,
              transition: 'color 0.3s',
            }}>
              Recruitment Intelligence
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="landing-nav">
            {[
              ['#how-it-works', 'How It Works'],
              ['#for-candidates', 'Candidates'],
              ['#for-companies', 'Companies'],
              ['#pricing', 'Pricing'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: navLinkColor,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  textShadow: scrolled ? 'none' : '0 1px 4px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#d4af37')}
                onMouseLeave={(e) => (e.currentTarget.style.color = navLinkColor)}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: navBtnColor,
                padding: '7px 16px',
                borderRadius: 9,
                border: navBtnBorder,
                background: navBtnBg,
                textDecoration: 'none',
                backdropFilter: scrolled ? 'none' : 'blur(8px)',
                transition: 'all 0.25s',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                padding: '7px 18px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(184,134,11,0.35)',
              }}
            >
              Get Started <ArrowRight size={13} />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="landing-mobile-btn"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} color={scrolled ? '#334155' : '#fff'} /> : <Menu size={22} color={scrolled ? '#334155' : '#fff'} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 66,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          zIndex: 99,
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
        }}>
          {[
            ['#how-it-works', 'How It Works'],
            ['#for-candidates', 'Candidates'],
            ['#for-companies', 'Companies'],
            ['#pricing', 'Pricing'],
            ['#faq', 'FAQ'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
            >
              {label}
            </a>
          ))}
          <div style={{ height: 1, background: '#f1f5f9' }} />
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              padding: '13px',
              textAlign: 'center',
              background: 'linear-gradient(135deg,#b8860b,#d4af37)',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Sign In to Workspace
          </Link>
        </div>
      )}

      <main id="main-content">

        {/* ── HERO — Seamless watercolor transition (NO harsh white cut, NO scroll to explore) ── */}
        <section style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '110px 24px 80px',
        }}>
          {/* Watercolor background image */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/landing-hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }} />

          {/* Smooth watercolor gradient overlay: soft top tint for text contrast, golden middle, smooth fade into body */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10, 18, 38, 0.58) 0%, rgba(10, 18, 38, 0.28) 42%, rgba(250, 250, 248, 0.6) 82%, #fafaf8 100%)',
            zIndex: 1,
          }} />

          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: 820,
            margin: '0 auto',
          }}>
            {/* Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 26,
              padding: '7px 18px',
              borderRadius: 99,
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              color: '#fef08a',
              fontSize: 12.5,
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Requirement-Centered Recruitment Intelligence · Live
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(36px, 5.8vw, 62px)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-1.5px',
              lineHeight: 1.12,
              margin: '0 0 22px',
              textShadow: '0 3px 24px rgba(0,0,0,0.3)',
            }}>
              Prepare for the role.<br />
              <span style={{
                background: 'linear-gradient(90deg, #fef08a 0%, #d4af37 60%, #ffffff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Show relevant evidence.
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(15px, 1.9vw, 18px)',
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.7,
              margin: '0 auto 36px',
              maxWidth: 680,
              fontWeight: 400,
              textShadow: '0 1px 6px rgba(0,0,0,0.25)',
            }}>
              GenuAI connects verified vacancies with role-specific evidence, transparent requirement coverage, and human-led hiring decisions.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/login?mode=register"
                style={{
                  padding: '14px 34px',
                  borderRadius: 11,
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(184,134,11,0.45)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                style={{
                  padding: '14px 32px',
                  borderRadius: 11,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
              >
                How It Works
              </a>
            </div>

            {/* Platform Guarantees */}
            <div style={{
              marginTop: 38,
              display: 'flex',
              gap: 22,
              justifyContent: 'center',
              flexWrap: 'wrap',
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              <span>✓ Human-led hiring decisions</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>✓ Target-specific privacy isolation</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>✓ Requirement-linked evidence verification</span>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section style={{
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          borderTop: '1px solid #f1f5f9',
          padding: '24px 24px',
        }}>
          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {[
              { icon: <CheckCircle2 size={16} color="#059669" />, text: 'Verified company & vacancy listings' },
              { icon: <FileCheck size={16} color="#b8860b" />, text: 'Requirement-linked evidence verification' },
              { icon: <Lock size={16} color="#0284c7" />, text: 'Strict company-by-company data separation' },
              { icon: <UserCheck size={16} color="#854d0e" />, text: 'Zero automated AI rejections' },
              { icon: <FileText size={16} color="#64748b" />, text: 'Auditable hiring workflow history' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.icon}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ padding: '96px 24px', maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              How It Works
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 14px' }}>
              One role requirement. A clearer journey.
            </h2>
            <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
              The requirement-centered pipeline powering GenuAI — from vacancy definition to human hiring decision.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {STEPS.map((s) => (
              <div
                key={s.num}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #ede8de',
                  padding: '28px 24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(184,134,11,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(184,134,11,0.22)', marginBottom: 12, letterSpacing: '-1px' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.62, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOR CANDIDATES (REFINED & PLEASANT PREVIEW CARD) ── */}
        <section id="for-candidates" style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 60,
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                For Candidates
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 16px' }}>
                More than a resume.<br />Target real roles with evidence.
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                Build a transparent record of your role-relevant preparation and evidence. Keep target applications completely isolated across companies.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Discover verified published vacancies with transparent rubrics.',
                  'Company A and Company B targets are strictly compartmentalized.',
                  'Submit projects, work samples, and code artifacts per requirement.',
                  'Follow candidate-visible status updates without ghosting.',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0, marginTop: 3 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?role=candidate"
                style={{
                  padding: '12px 28px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 3px 14px rgba(184,134,11,0.28)',
                }}
              >
                Candidate Workspace <ArrowRight size={15} />
              </Link>
            </div>

            {/* ── PLEASANT CANDIDATE SAAS PREVIEW (NO UGLY BORDERED BOXES) ── */}
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e8e4db',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {/* Window Header */}
              <div style={{
                background: '#f8f7f5',
                borderBottom: '1px solid #ece9e0',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginLeft: 8 }}>
                    Candidate Workspace · Target Review
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 99,
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                }}>
                  ● Active Target
                </span>
              </div>

              <div style={{ padding: '22px 24px' }}>
                {/* Active Target Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 16,
                  marginBottom: 16,
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Senior Backend Engineer</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Alpha Technologies</span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>Verified Vacancy</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#b8860b' }}>Target ID</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>#TGT-8492</div>
                  </div>
                </div>

                {/* Evidence Progress */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
                    <span style={{ color: '#475569' }}>Requirement Coverage</span>
                    <span style={{ color: '#059669' }}>3 of 3 Requirements Supported</span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #d4af37, #10b981)', borderRadius: 99 }} />
                  </div>
                </div>

                {/* Requirements List (Modern Clean Cards, No Harsh Lines) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { title: 'Java & Spring Boot Architecture', detail: '2 microservice repositories attached', status: 'Supported', color: '#059669', bg: '#ecfdf5' },
                    { title: 'Distributed SQL & Transactions', detail: 'Schema design & query benchmark attached', status: 'Supported', color: '#059669', bg: '#ecfdf5' },
                    { title: 'RESTful API Engineering', detail: 'OpenAPI specification & live demo', status: 'Supported', color: '#059669', bg: '#ecfdf5' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        borderRadius: 10,
                        background: '#fbfaf8',
                        border: '1px solid #f0ebe0',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{item.detail}</div>
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background: item.bg,
                        color: item.color,
                      }}>
                        ✓ {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Privacy Boundary Banner */}
                <div style={{
                  marginTop: 18,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Lock size={14} color="#b8860b" />
                  <span style={{ fontSize: 11.5, color: '#854d0e', fontWeight: 600 }}>
                    Isolated to Alpha Technologies · Private from other employers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR COMPANIES (REFINED & PLEASANT PREVIEW CARD) ── */}
        <section id="for-companies" style={{ background: '#fafaf8', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 60,
            alignItems: 'center',
          }}>

            {/* ── PLEASANT COMPANY SAAS PREVIEW (NO UGLY BORDERED BOXES) ── */}
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e8e4db',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {/* Window Header */}
              <div style={{
                background: '#f8f7f5',
                borderBottom: '1px solid #ece9e0',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginLeft: 8 }}>
                    Recruiter Decision Portal · Alpha Technologies
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 99,
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                }}>
                  Rubric v2.1 Live
                </span>
              </div>

              <div style={{ padding: '22px 24px' }}>
                {/* Vacancy Summary */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 16,
                  marginBottom: 16,
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Backend Developer (Senior)</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Engineering Dept · 8 Active Evidence Packages</div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: '#ecfdf5',
                    color: '#065f46',
                  }}>
                    Verified Role
                  </span>
                </div>

                {/* Queue Title */}
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Evidence Review Queue
                </div>

                {/* Queue Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { name: 'Alex M.', role: 'Target #8492', status: 'All Evidence Verified', action: 'Schedule Interview', pillBg: '#ecfdf5', pillColor: '#065f46' },
                    { name: 'Jordan L.', role: 'Target #8487', status: '2/3 Requirements Met', action: 'Request Work Sample', pillBg: '#fffbeb', pillColor: '#92400e' },
                  ].map((cand, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: '#fbfaf8',
                        border: '1px solid #f0ebe0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{cand.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {cand.role} · <span style={{ color: cand.pillColor, fontWeight: 700 }}>{cand.status}</span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                        color: '#ffffff',
                      }}>
                        {cand.action}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Human Decision Guarantee */}
                <div style={{
                  marginTop: 18,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(5, 150, 105, 0.07)',
                  border: '1px solid rgba(5, 150, 105, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <UserCheck size={14} color="#059669" />
                  <span style={{ fontSize: 11.5, color: '#065f46', fontWeight: 600 }}>
                    100% Human Hiring Authority · Zero Automated AI Disqualification
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                For Companies
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 16px' }}>
                Review evidence with role context.<br />Human decisions, always.
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                Define exact role requirements and evaluation criteria. Review target-linked candidate work samples and evidence without opaque algorithmic filtering.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Define departments, roles, vacancies, and evaluation rubrics.',
                  'Review candidate evidence within your verified company workspace.',
                  'Request additional project artifacts where evidence is pending.',
                  'Maintain auditable hiring workflow history and vacancy versioning.',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0, marginTop: 3 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?role=company"
                style={{
                  padding: '12px 28px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 3px 14px rgba(184,134,11,0.28)',
                }}
              >
                Company Workspace <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── PRICING / SUBSCRIPTION SECTION ── */}
        <section id="pricing" style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '96px 24px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Pricing & Plans
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 14px' }}>
                Simple, transparent access.
              </h2>
              <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
                Core candidate access is always free. Company workspaces are verified and plan-based. No surprise fees.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 22, alignItems: 'stretch' }}>
              {PLANS.map((plan, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 20,
                    border: plan.highlight ? '2px solid #d4af37' : '1px solid #ece9e0',
                    padding: '34px 28px',
                    background: plan.highlight ? 'linear-gradient(180deg, #ffffff 0%, #fdfcf9 100%)' : '#ffffff',
                    boxShadow: plan.highlight ? '0 12px 36px rgba(184,134,11,0.15)' : '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div>
                    {/* Plan Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: 99,
                        background: plan.tagBg,
                        color: plan.tagColor,
                        letterSpacing: '0.04em',
                      }}>
                        {plan.tag}
                      </span>
                      {plan.highlight && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#b8860b',
                        }}>
                          <Sparkles size={12} /> Recommended
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>{plan.name}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, margin: '0 0 22px' }}>{plan.desc}</p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>/ {plan.cycle}</span>
                    </div>

                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                      What is included:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {plan.features.map((f, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
                          <Check size={15} style={{ color: plan.tagColor, flexShrink: 0, marginTop: 3 }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={plan.href}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: 10,
                      textAlign: 'center',
                      fontSize: 13.5,
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'block',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s',
                      background: plan.highlight ? 'linear-gradient(135deg, #b8860b, #d4af37)' : '#f8fafc',
                      color: plan.highlight ? '#ffffff' : '#334155',
                      border: plan.highlight ? 'none' : '1px solid #e2e8f0',
                      boxShadow: plan.highlight ? '0 4px 16px rgba(184,134,11,0.32)' : 'none',
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section id="faq" style={{ padding: '96px 24px', maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Common Questions
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', margin: '10px 0 14px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 15.5, color: '#64748b', margin: 0 }}>
              Truthful overview of GenuAI, role evidence, and privacy boundaries.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    border: '1px solid #ede8de',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s',
                    boxShadow: isOpen ? '0 4px 18px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(i)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a' }}>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="#b8860b" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 24px 20px', fontSize: 14.5, color: '#64748b', lineHeight: 1.65, borderTop: '1px solid #f8f6f0' }}>
                      <div style={{ paddingTop: 14 }}>{faq.a}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CALL TO ACTION BANNER ── */}
        <section style={{
          background: 'linear-gradient(135deg, #090e1f 0%, #151d38 60%, #1f2a4f 100%)',
          padding: '80px 24px',
          textAlign: 'center',
          color: '#ffffff',
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.8px' }}>
              Ready for transparent, evidence-based recruitment?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, margin: '0 0 34px' }}>
              Join candidates and companies building structured, verifiable hiring records today.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/login?role=candidate&mode=register"
                style={{
                  padding: '13px 30px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 18px rgba(184,134,11,0.4)',
                }}
              >
                Join as Candidate <ArrowRight size={15} />
              </Link>
              <Link
                href="/login?role=company&mode=register"
                style={{
                  padding: '13px 30px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Register Company
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#070b18', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '60px 24px 36px', color: 'rgba(255,255,255,0.7)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          
          <div>
            <span
              className="gold-gradient-text"
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '-0.3px',
                display: 'block',
                marginBottom: 6,
              }}
            >
              GenuAI Technologies
            </span>
            <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.8)', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
              Recruitment Intelligence
            </span>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              Requirement-centered recruitment platform connecting verified vacancies with candidate evidence and human decisions.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Product
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13.5 }}>
              <li><a href="#how-it-works" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>How It Works</a></li>
              <li><a href="#for-candidates" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>For Candidates</a></li>
              <li><a href="#for-companies" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>For Companies</a></li>
              <li><a href="#pricing" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Pricing</a></li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Workspace Portals
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13.5 }}>
              <li><Link href="/login?role=candidate" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Candidate Workspace</Link></li>
              <li><Link href="/login?role=company" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Company Workspace</Link></li>
              <li><Link href="/login?role=admin" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Platform Governance</Link></li>
              <li><Link href="/trust" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Trust & Compliance</Link></li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Legal & Trust
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13.5 }}>
              <li><Link href="/privacy" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Terms of Service</Link></li>
              <li><Link href="/accessibility" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Accessibility</Link></li>
              <li><Link href="/contact" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Contact Us</Link></li>
            </ul>
          </div>

        </div>

        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: 'rgba(255,255,255,0.45)',
        }}>
          <span>© {new Date().getFullYear()} GenuAI Technologies. All rights reserved.</span>
          <span>Requirement-Centered Recruitment Intelligence</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 820px) {
          .landing-nav { display: none !important; }
          .landing-mobile-btn { display: flex !important; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; padding: 4px; }
        }
        @media (min-width: 821px) {
          .landing-mobile-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
