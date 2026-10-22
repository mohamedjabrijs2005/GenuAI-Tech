'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, Lock, Mail, CheckCircle2,
  AlertCircle, ArrowRight, Building2, User,
  FileCheck, Target, UserCheck, ChevronRight,
  Check, X, KeyRound, Compass, ShieldCheck,
  Layers, Award, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

type UserPersona = 'candidate' | 'company' | 'admin';

interface PersonaConfig {
  label: string;
  tagline: string;
  headline: string;
  subtext: string;
  roleBadge: string;
  flowSteps: string[];
  features: { title: string; desc: string; icon: any }[];
  ledgerSample: {
    roleTitle: string;
    companyName: string;
    requirement: string;
    reqType: string;
    evidenceTitle: string;
    evidenceType: string;
    coverageStatus: string;
    reviewOutcome: string;
  };
  trustFooter: string;
  cardTitle: string;
  cardSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitText: string;
  allowRegister: boolean;
  demoCredentials: { email: string; pass: string; name?: string; company?: string };
}

const PERSONA_CONFIG: Record<UserPersona, PersonaConfig> = {
  candidate: {
    label: 'Candidate',
    tagline: 'Candidate Workspace & Evidence Profile',
    headline: 'Target verified roles. Present relevant evidence.',
    subtext: 'Connect your real projects, work samples, and assessments directly to published vacancy criteria for transparent, human-led review.',
    roleBadge: 'Candidate Portal',
    flowSteps: ['TARGET ROLE', 'PREPARE', 'SUBMIT EVIDENCE', 'RECRUITER REVIEW'],
    features: [
      {
        title: 'Explicit Role Rubrics',
        desc: 'Review exact vacancy requirements, priority weights, and accepted evidence types upfront.',
        icon: Compass,
      },
      {
        title: 'Target Privacy Isolation',
        desc: 'Applications and submissions are strictly isolated per company; never cross-shared.',
        icon: Lock,
      },
      {
        title: 'Direct Evidence Mapping',
        desc: 'Connect portfolio work, code repositories, and work samples directly to role rubrics.',
        icon: ShieldCheck,
      },
    ],
    ledgerSample: {
      roleTitle: 'Senior Backend Engineer',
      companyName: 'Alpha Technologies',
      requirement: 'Distributed Systems & Data Consensus',
      reqType: 'Required Skill',
      evidenceTitle: 'Raft Consensus Protocol Implementation',
      evidenceType: 'Project Work Sample',
      coverageStatus: 'Supported',
      reviewOutcome: 'Human Recruiter Contextual Review',
    },
    trustFooter: 'Candidate Privacy • Isolated Targets • Human-Led Decisions',
    cardTitle: 'Welcome to GenuAI',
    cardSubtitle: 'Sign in to access your candidate workspace and active targets',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    submitText: 'Sign In to Workspace',
    allowRegister: true,
    demoCredentials: { email: 'candidate@genuai.test', pass: 'Candidate123!', name: 'Alex Rivera' },
  },
  company: {
    label: 'Company',
    tagline: 'Evidence-Centered Recruitment Intelligence',
    headline: 'Define the role. Review the evidence. Decide with clarity.',
    subtext: 'Evaluate candidate work samples, projects, and structured assessments against explicit role requirements — without automated AI filtering.',
    roleBadge: 'Employer Workspace',
    flowSteps: ['DEFINE REQUIREMENTS', 'MODERATION', 'COLLECT EVIDENCE', 'HUMAN DECISION'],
    features: [
      {
        title: 'Structured Vacancy Builder',
        desc: 'Define departments, roles, and weighted requirement criteria with transparent rubrics.',
        icon: Layers,
      },
      {
        title: 'Requirement-Linked Evidence',
        desc: 'Review code samples, certifications, and portfolio evidence mapped to each requirement.',
        icon: FileCheck,
      },
      {
        title: 'Human-Led Hiring Outcomes',
        desc: 'Zero automated algorithmic rejections; human hiring managers retain total authority.',
        icon: UserCheck,
      },
    ],
    ledgerSample: {
      roleTitle: 'Principal Cloud Architect',
      companyName: 'Flow Test Enterprises',
      requirement: 'Kubernetes & AWS Infrastructure',
      reqType: 'High Priority',
      evidenceTitle: 'Production Terraform Cluster Architecture',
      evidenceType: 'Infrastructure Sample',
      coverageStatus: 'Supported',
      reviewOutcome: 'Recruiter Evaluated & Accepted',
    },
    trustFooter: 'Multi-Tenant Isolation • Audit History • Human Authority',
    cardTitle: 'Company Workspace',
    cardSubtitle: 'Sign in to manage vacancies, requirements, and candidate evidence',
    emailLabel: 'Work Email Address',
    emailPlaceholder: 'you@company.com',
    submitText: 'Sign In to Workspace',
    allowRegister: true,
    demoCredentials: { email: 'companya@genuai.test', pass: 'CompanyA123!', name: 'Alice Owner', company: 'Alpha Technologies' },
  },
  admin: {
    label: 'Admin',
    tagline: 'Platform Governance & Trust Administration',
    headline: 'Verify employers. Moderate vacancies. Audit platform compliance.',
    subtext: 'Administrative console for company verification, vacancy moderation, user security, and platform audit trail inspection.',
    roleBadge: 'Governance Console',
    flowSteps: ['VERIFY COMPANY', 'MODERATE VACANCIES', 'MONITOR SIGNALS', 'AUDIT LOGS'],
    features: [
      {
        title: 'Company Verification',
        desc: 'Review corporate domains and business registration before granting publishing rights.',
        icon: CheckCircle2,
      },
      {
        title: 'Vacancy Moderation',
        desc: 'Ensure published vacancies meet quality rubrics and transparent requirement standards.',
        icon: ShieldCheck,
      },
      {
        title: 'System Audit Logs',
        desc: 'Inspect platform activity logs and maintain transparent accountability records.',
        icon: Award,
      },
    ],
    ledgerSample: {
      roleTitle: 'Corporate Identity Verification',
      companyName: 'Alpha Technologies',
      requirement: 'Domain & Legal Entity Verification',
      reqType: 'Governance Prerequisite',
      evidenceTitle: 'Corporate Registration Certificate',
      evidenceType: 'Official Document',
      coverageStatus: 'Verified',
      reviewOutcome: 'Platform Admin Approved',
    },
    trustFooter: 'Platform Governance • Verification • Compliance Audits',
    cardTitle: 'Governance Sign In',
    cardSubtitle: 'Authorized platform administration personnel only',
    emailLabel: 'Admin Email Address',
    emailPlaceholder: 'admin@genuai.test',
    submitText: 'Sign In to Console',
    allowRegister: false,
    demoCredentials: { email: 'admin@genuai.test', pass: 'Admin12345!', name: 'Platform Admin' },
  },
};

export default function AuthPage() {
  const router = useRouter();
  const { login, register: authRegister } = useAuth();

  const [persona, setPersona] = useState<UserPersona>('company');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const modeParam = params.get('mode');

      const wantsRegister = path.includes('/register') || modeParam === 'register';
      if (wantsRegister) {
        setIsLogin(false);
      } else {
        setIsLogin(true);
      }

      if (roleParam === 'candidate') {
        setPersona('candidate');
      } else if (roleParam === 'company') {
        setPersona('company');
      } else if (roleParam === 'admin') {
        setPersona('admin');
        setIsLogin(true);
      }
    }
  }, []);

  const config = PERSONA_CONFIG[persona];

  const handlePersonaChange = (p: UserPersona) => {
    setPersona(p);
    setError('');
    if (p === 'admin') {
      setIsLogin(true);
    }
  };

  const set = (k: string, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (error) setError('');
  };

  const handleQuickDemo = () => {
    const demo = config.demoCredentials;
    setForm({
      name: demo.name || '',
      email: demo.email,
      password: demo.pass,
      confirmPassword: demo.pass,
      companyName: demo.company || '',
    });
    setAgreedTerms(true);
    toast.success(`Loaded demo credentials for ${config.label}`);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#cbd5e1' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#f87171' };
    if (score === 2 || score === 3) return { score: 2, label: 'Good', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const validate = () => {
    if (!form.email || !form.email.trim()) {
      return `Please enter your ${persona === 'admin' ? 'admin' : persona === 'company' ? 'work' : ''} email address.`;
    }
    if (!validateEmail(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (!form.password || !form.password.trim()) {
      return 'Please enter your password.';
    }

    if (!isLogin && config.allowRegister) {
      if (!agreedTerms) {
        return 'Please agree to the Terms of Service and Privacy Policy.';
      }
      if (!form.name.trim()) {
        return 'Full name is required.';
      }
      if (persona === 'company' && !form.companyName.trim()) {
        return 'Company or organization name is required.';
      }
      if (form.password.length < 6) {
        return 'Password must be at least 6 characters.';
      }
      if (form.password !== form.confirmPassword) {
        return 'Passwords do not match.';
      }
    }
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(form.email.trim().toLowerCase(), form.password);
      } else {
        const nameParts = form.name.trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Member';

        await authRegister({
          firstName,
          lastName,
          email: form.email.trim(),
          password: form.password,
          companyName: persona === 'company' ? (form.companyName.trim() || 'My Company') : 'Candidate Workspace',
        });
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.error('Password reset via email is not yet available. Please contact support at admin@genuai.test.');
    setShowForgotModal(false);
    setForgotEmail('');
  };

  const passStrength = getPasswordStrength(form.password);
  const ledger = config.ledgerSample;

  return (
    <div className="auth-fullscreen-layout">
      {/* ================= LEFT SIDE: SLEEK HERO & LIVE RECRUITMENT LEDGER ================= */}
      <div className="auth-fullscreen-left">
        {/* Top Header */}
        <div className="auth-hero-top-nav">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
                GenuAI Technologies
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  color: '#d4af37',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginTop: 2,
                }}
              >
                Recruitment Intelligence
              </span>
            </div>
          </Link>

          <div className="auth-hero-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8860b' }} />
            <span>{config.roleBadge}</span>
          </div>
        </div>

        {/* Main Center Content */}
        <div className="auth-hero-main-content">
          <div className="auth-hero-tagline">
            <Sparkles size={13} style={{ color: '#d4af37' }} />
            <span>{config.tagline}</span>
          </div>

          <h1 className="auth-hero-headline">
            {config.headline}
          </h1>

          <p className="auth-hero-subtext">
            {config.subtext}
          </p>

          {/* Interactive Live Recruitment Context Ledger Card */}
          <div className="auth-ledger-card">
            <div className="auth-ledger-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="auth-pulse-dot" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Illustrative Requirement &amp; Evidence Ledger
                </span>
              </div>
              <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>
                {ledger.companyName}
              </span>
            </div>

            <div className="auth-ledger-body">
              <div className="auth-ledger-row">
                <span className="auth-ledger-label">Role &amp; Requirement:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#ffffff' }}>{ledger.roleTitle}</span>
                  <span className="auth-tag-pill">{ledger.requirement}</span>
                  <span className="auth-tag-sub">{ledger.reqType}</span>
                </div>
              </div>

              <div className="auth-ledger-row">
                <span className="auth-ledger-label">Candidate Evidence:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{ledger.evidenceTitle}</span>
                  <span style={{ fontSize: 10, background: 'rgba(212, 175, 55, 0.15)', padding: '2px 7px', borderRadius: 4, color: '#fbbf24', fontWeight: 600 }}>
                    Evidence Attached
                  </span>
                </div>
              </div>

              <div className="auth-ledger-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Coverage State:</span>
                  <span className="auth-coverage-badge">✓ {ledger.coverageStatus}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                  <UserCheck size={13} />
                  <span>{ledger.reviewOutcome}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Value Features */}
          <div className="auth-features-list">
            {config.features.map((f) => {
              const IconComp = f.icon;
              return (
                <div key={f.title} className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <IconComp size={15} style={{ color: '#d4af37' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 2 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Trust Strip */}
        <div className="auth-hero-bottom-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 12 }}>GenuAI Technologies</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>•</span>
            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 11.5 }}>{config.trustFooter}</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Zero automated AI rejection decisions</span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: COMPACT, MODERN AUTH CARD ================= */}
      <div className="auth-fullscreen-right">
        <div className="auth-fullscreen-form-card">
          {/* Mobile-only logo */}
          <div className="auth-mobile-logo">
            <div>
              <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.3px', textAlign: 'center' }}>
                GenuAI Technologies
              </div>
              <span style={{ fontSize: 9.5, color: '#b8860b', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', textAlign: 'center' }}>
                Recruitment Intelligence
              </span>
            </div>
          </div>
          {/* Persona Switcher: Candidate | Company | Admin */}
          <div className="auth-persona-tabs">
            <button
              type="button"
              onClick={() => handlePersonaChange('candidate')}
              className={`auth-persona-tab ${persona === 'candidate' ? 'active' : ''}`}
            >
              <User size={13} />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => handlePersonaChange('company')}
              className={`auth-persona-tab ${persona === 'company' ? 'active' : ''}`}
            >
              <Building2 size={13} />
              <span>Company</span>
            </button>
            <button
              type="button"
              onClick={() => handlePersonaChange('admin')}
              className={`auth-persona-tab ${persona === 'admin' ? 'active' : ''}`}
            >
              <ShieldCheck size={13} />
              <span>Admin</span>
            </button>
          </div>

          {/* Mode Switcher (Sign In vs Create Account) */}
          {config.allowRegister && (
            <div className="auth-pill-switch">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`auth-pill-btn ${isLogin ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`auth-pill-btn ${!isLogin ? 'active' : ''}`}
              >
                Create Account
              </button>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <h2 className="auth-form-title">
              {isLogin ? config.cardTitle : (persona === 'company' ? 'Create Company Workspace' : 'Create Candidate Account')}
            </h2>
            <p className="auth-form-subtitle">
              {isLogin ? config.cardSubtitle : 'Get started with requirement-linked evidence and structured evaluation'}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 12,
                fontWeight: 600,
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && config.allowRegister && (
              <div className={persona === 'company' ? 'auth-two-col-grid' : ''} style={{ gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="auth-input-label">Full Name *</label>
                  <div className="auth-input-wrapper">
                    <User size={15} className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder="Sarah Connor"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      className="auth-text-input"
                    />
                  </div>
                </div>
                {persona === 'company' && (
                  <div>
                    <label className="auth-input-label">Company Name *</label>
                    <div className="auth-input-wrapper">
                      <Building2 size={15} className="auth-input-icon" />
                      <input
                        type="text"
                        placeholder="Acme Tech"
                        value={form.companyName}
                        onChange={(e) => set('companyName', e.target.value)}
                        className="auth-text-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-input-label">{config.emailLabel} *</label>
              <div className="auth-input-wrapper">
                <Mail size={15} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder={config.emailPlaceholder}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="auth-text-input"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label className="auth-input-label" style={{ margin: 0 }}>Password *</label>
                {isLogin && (
                  <span
                    onClick={() => {
                      setForgotEmail(form.email || '');
                      setShowForgotModal(true);
                    }}
                    style={{ fontSize: 11, fontWeight: 700, color: '#b8860b', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </span>
                )}
              </div>
              <div className="auth-input-wrapper">
                <Lock size={15} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="auth-text-input"
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength meter on register */}
              {!isLogin && form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, height: 3, marginBottom: 4 }}>
                    <div style={{ flex: 1, borderRadius: 2, background: passStrength.score >= 1 ? passStrength.color : '#e2e8f0' }} />
                    <div style={{ flex: 1, borderRadius: 2, background: passStrength.score >= 2 ? passStrength.color : '#e2e8f0' }} />
                    <div style={{ flex: 1, borderRadius: 2, background: passStrength.score >= 3 ? passStrength.color : '#e2e8f0' }} />
                  </div>
                  <span style={{ fontSize: 10, color: passStrength.color, fontWeight: 700 }}>
                    Password Strength: {passStrength.label}
                  </span>
                </div>
              )}
            </div>

            {!isLogin && config.allowRegister && (
              <div className="auth-input-group">
                <label className="auth-input-label">Confirm Password *</label>
                <div className="auth-input-wrapper">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    className="auth-text-input"
                    style={{ paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me */}
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#64748b' }}>
                  <input
                    type="checkbox"
                    id="remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#b8860b', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <label htmlFor="remember-checkbox" style={{ cursor: 'pointer', userSelect: 'none' }}>Stay signed in</label>
                </div>
              </div>
            )}

            {/* Terms checkbox on register */}
            {!isLogin && (
              <div
                className="auth-terms-box"
                onClick={() => setAgreedTerms(!agreedTerms)}
              >
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: 2, cursor: 'pointer', accentColor: '#b8860b' }}
                />
                <label htmlFor="terms-checkbox" style={{ cursor: 'pointer', fontSize: 11, color: '#475569', lineHeight: 1.45 }}>
                  I agree to the{' '}
                  <span onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>
                    Privacy Policy
                  </span>.
                </label>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span>Authenticating…</span>
              ) : isLogin ? (
                <>
                  <span>{config.submitText}</span>
                  <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <span>{persona === 'company' ? 'Create Company Workspace' : 'Create Candidate Account'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Discreet Quick-Demo Access Chip */}
          <div className="auth-demo-chip-box">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="auth-demo-chip-btn"
            >
              <KeyRound size={12} style={{ color: '#b8860b' }} />
              <span>Autofill {config.label} test credentials</span>
            </button>
          </div>

          {/* Admin Restricted Notice */}
          {persona === 'admin' && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                Restricted to authorized <strong style={{ color: '#854d0e' }}>@genuai.test</strong> accounts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 26,
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Reset Workspace Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
              Enter your registered email address and we will dispatch secure instructions to reset your workspace access.
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-input-label">Registered Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={15} className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="auth-text-input"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="auth-submit-btn"
                style={{ marginTop: 0 }}
              >
                {forgotSent ? 'Reset Link Dispatched!' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TERMS & PRIVACY MODAL ================= */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 26,
            maxWidth: 500,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Terms of Service &amp; Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>
                <strong>1. Role-Based Evidence Governance</strong>: GenuAI provides recruitment intelligence and verifiable skill assessment records. All evaluation evidence is traceable back to company-defined role requirements.
              </p>
              <p>
                <strong>2. Human Authority</strong>: GenuAI does not make automated hiring or rejection decisions. Final recruitment authority remains exclusively with human recruiters and hiring managers.
              </p>
              <p>
                <strong>3. Target Data Privacy</strong>: Candidate and company evaluation data is compartmentalized by Target with strict multi-tenant isolation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAgreedTerms(true);
                setShowTermsModal(false);
              }}
              className="auth-submit-btn"
              style={{ marginTop: 20 }}
            >
              I Accept &amp; Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
