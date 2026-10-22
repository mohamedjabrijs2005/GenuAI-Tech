'use client';

import React from 'react';
import Link from 'next/link';
import { User, Building2, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';

export default function RegisterAccountSelectPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Top Navigation */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              GenuAI Technologies
            </div>
            <span style={{ fontSize: 10, color: '#b8860b', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginTop: 2 }}>
              Recruitment Intelligence
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Already have an account?</span>
          <Link
            href="/login"
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 960 }}>
          {/* Header Title Section */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 99,
              background: 'rgba(184, 134, 11, 0.08)',
              border: '1px solid rgba(184, 134, 11, 0.25)',
              color: '#854d0e',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
            }}>
              <Sparkles size={13} style={{ color: '#b8860b' }} />
              <span>Progressive Account Creation</span>
            </div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.6px',
              margin: '0 0 10px',
            }}>
              Choose your workspace pathway
            </h1>
            <p style={{
              fontSize: 15,
              color: '#64748b',
              margin: 0,
              maxWidth: 620,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}>
              Create your account with essential details first. Build role rubrics or complete your career profile when relevant.
            </p>
          </div>

          {/* Dual Selection Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            marginBottom: 32,
          }}>
            {/* 1. Candidate Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '32px 28px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(212, 175, 55, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#854d0e',
                  }}>
                    <User size={24} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#854d0e',
                    background: '#fef3c7',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    For Candidates
                  </span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                  Candidate Account
                </h2>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                  Target verified vacancies, understand explicit role rubrics, and submit evidence directly to human hiring teams.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Direct evidence mapping to role rubrics</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Zero automated AI rejection decisions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Step-by-step progressive profile setup</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register/candidate"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
                }}
              >
                <span>Join as Candidate</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* 2. Company Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '32px 28px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}>
                    <Building2 size={24} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#0f172a',
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    For Employers
                  </span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                  Company Workspace
                </h2>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                  Establish an enterprise hiring hub, post transparent vacancy rubrics, and review evidence-backed talent applications.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Verified company workspace &amp; moderation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Candidate evidence review &amp; work samples</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span>Draft rubrics prior to formal verification</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register/company"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                }}
              >
                <span>Create Company Workspace</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Discovery Links (Public Information) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 13,
            color: '#64748b',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
              <span>Platform Governance &amp; Public Transparency:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/vacancies" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                Browse Vacancies
              </Link>
              <span>&middot;</span>
              <Link href="/about" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                How GenuAI Works
              </Link>
              <span>&middot;</span>
              <Link href="/pricing" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                Pricing
              </Link>
              <span>&middot;</span>
              <Link href="/login?role=admin" style={{ color: '#b8860b', fontWeight: 700, textDecoration: 'none' }}>
                Admin Console &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 32px',
        textAlign: 'center',
        fontSize: 12,
        color: '#94a3b8',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        &copy; {new Date().getFullYear()} GenuAI Technologies &middot; Structured Evidence Recruitment &middot; Privacy &amp; Terms Compliant
      </footer>
    </div>
  );
}
