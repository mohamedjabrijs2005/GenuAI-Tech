'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, Shield, ShieldCheck, Lock, Mail, CheckCircle2,
  AlertCircle, ArrowRight, Sparkles, Building2, User,
  FileCheck, Target, UserCheck, ChevronRight, Activity, Award,
  Check, X, HelpCircle, KeyRound, Laptop, Compass, BookOpen,
  ClipboardCheck, BadgeCheck, Sliders, ShieldAlert, FileText, CheckCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GenuAILogo } from '@/components/GenuAILogo';
import toast from 'react-hot-toast';

type UserPersona = 'candidate' | 'company' | 'admin';

interface PersonaConfig {
  label: string;
  tagline: string;
  headline: string;
  subtext: string;
  flowSteps: string[];
  workings: { title: string; desc: string; icon: any }[];
  trustFooter: string;
  cardTitle: string;
  cardSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitText: string;
  ssoText: string;
  ssoIcon: 'google' | 'sso';
  allowRegister: boolean;
  demoCredentials: { email: string; pass: string; name?: string; company?: string };
}

const PERSONA_CONFIG: Record<UserPersona, PersonaConfig> = {
  candidate: {
    label: 'Candidate',
    tagline: 'Candidate Capabilities & Traceable Evidence',
    headline: 'Target the Role. Build the Skills. Prove Your Capability.',
    subtext: 'Connect your verified skills directly with company requirements through structured assessments and traceable evidence.',
    flowSteps: ['TARGET', 'LEARN', 'PRACTICE', 'PROVE'],
    workings: [
      { title: '1. Target', desc: 'Explore open vacancies matching your skills with transparent requirements', icon: Compass },
      { title: '2. Learn', desc: 'Review explicit role requirement rubrics and capability benchmarks', icon: BookOpen },
      { title: '3. Practice', desc: 'Complete interactive, timed assessments with instant task verification', icon: ClipboardCheck },
      { title: '4. Prove', desc: 'Generate tamper-evident evidence submitted directly for recruiter review', icon: BadgeCheck },
    ],
    trustFooter: 'Secure Access • Evidence Traceability • Candidate Control',
    cardTitle: 'Welcome to GenuAI',
    cardSubtitle: 'Sign in to access your skills portfolio and role assessments',
    emailLabel: 'Email Address *',
    emailPlaceholder: 'you@example.com',
    submitText: 'Sign In to Workspace',
    ssoText: 'Continue with Google',
    ssoIcon: 'google',
    allowRegister: true,
    demoCredentials: { email: 'candidate@genuai.test', pass: 'Candidate123!', name: 'Alex Rivera' },
  },
  company: {
    label: 'Company',
    tagline: 'Recruitment Intelligence & Evidence Engine',
    headline: 'Define the Role. Assess the Capability. See the Evidence.',
    subtext: 'GenuAI connects company-defined role requirements with structured assessments, candidate evidence, and recruiter review — while keeping the final decision with the company.',
    flowSteps: ['DEFINE', 'ASSESS', 'EVIDENCE', 'REVIEW', 'DECISION'],
    workings: [
      { title: '1. Define', desc: 'Create vacancy criteria, role requirements, and assessment weights', icon: Sliders },
      { title: '2. Assess', desc: 'Dispatch standardized assessments mapped directly to role capabilities', icon: Laptop },
      { title: '3. Evidence', desc: 'Trace each candidate submission back to the specific requirement it supports', icon: FileCheck },
      { title: '4. Review', desc: 'Recruiters examine evidence coverage, interview records, and integrity signals', icon: UserCheck },
      { title: '5. Decision', desc: 'Human recruiters and hiring managers make the final hiring decisions', icon: Award },
    ],
    trustFooter: 'Security-First Architecture • Auditability • Role-Based Access',
    cardTitle: 'Welcome Back',
    cardSubtitle: 'Sign in to your enterprise recruitment workspace',
    emailLabel: 'Work Email Address *',
    emailPlaceholder: 'you@company.com',
    submitText: 'Sign In to Workspace',
    ssoText: 'Continue with Enterprise SSO',
    ssoIcon: 'sso',
    allowRegister: true,
    demoCredentials: { email: 'companya@genuai.test', pass: 'CompanyA123!', name: 'Alice Owner', company: 'Alpha Technologies' },
  },
  admin: {
    label: 'Admin',
    tagline: 'Platform Governance & Trust Center',
    headline: 'Verify. Govern. Monitor. Audit.',
    subtext: 'Centralized governance engine for company verification, assessment taxonomy, platform security signals, and compliance audits.',
    flowSteps: ['VERIFY', 'GOVERN', 'MONITOR', 'RESOLVE', 'AUDIT'],
    workings: [
      { title: '1. Verify', desc: 'Review & approve company identities, vacancy submissions, and compliance status', icon: ShieldCheck },
      { title: '2. Govern', desc: 'Standardize platform role taxonomies and benchmark evaluation models', icon: FileText },
      { title: '3. Monitor', desc: 'Inspect real-time anti-cheat integrity signals and system health telemetry', icon: Activity },
      { title: '4. Resolve', desc: 'Adjudicate candidate dispute tickets, policy flags, and moderation reports', icon: ShieldAlert },
      { title: '5. Audit', desc: 'Maintain complete, immutable system audit logs with cryptographic auditability', icon: KeyRound },
    ],
    trustFooter: 'Platform Security • Governance • Auditability',
    cardTitle: 'Admin Sign In',
    cardSubtitle: 'Authorized platform administration personnel only',
    emailLabel: 'Admin Email *',
    emailPlaceholder: 'name@genuai.test',
    submitText: 'Secure Sign In',
    ssoText: 'Use Admin SSO',
    ssoIcon: 'sso',
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

      if (path.includes('/register') || modeParam === 'register') {
        setIsLogin(false);
      } else if (path.includes('/login') || modeParam === 'login') {
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
    toast.success(`Loaded ${config.label} credentials`);
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
        const trimmedEmail = form.email.trim().toLowerCase();
        const isAdmin = trimmedEmail.endsWith('@genuaiadmin.com') || trimmedEmail.endsWith('@genuai.io') || persona === 'admin';
        await login(trimmedEmail, form.password);
        if (isAdmin) {
          toast.success('Admin identity verified. Entering Governance Console...');
          router.push('/admin');
        } else if (persona === 'candidate') {
          toast.success('Signed in to Candidate Workspace');
          router.push('/candidate');
        } else {
          toast.success('Signed in to Company Workspace');
          router.push('/dashboard');
        }
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

        toast.success('Account created successfully');
        if (persona === 'candidate') {
          router.push('/candidate');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    toast.loading(`Connecting with ${provider}...`, { duration: 1200 });
    setTimeout(() => {
      setError(`${provider.toUpperCase()} Single-Sign-On is provisioned for enterprise domains.`);
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setForgotSent(true);
    toast.success('Password reset link sent to ' + forgotEmail);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 2000);
  };

  const passStrength = getPasswordStrength(form.password);

  return (
    <div className="auth-fullscreen-layout">
      {/* ================= LEFT SIDE: BRAND / VALUE PROPOSITION ================= */}
      <div className="auth-fullscreen-left">
        {/* Top Header */}
        <div className="auth-hero-top-nav">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 50%, #fef3c7 100%)',
                border: '1.5px solid rgba(212, 175, 55, 0.6)',
                boxShadow: '0 4px 14px rgba(184, 134, 11, 0.15)',
              }}
            >
              <Shield size={20} style={{ color: '#b8860b' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                GenuAI
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b8860b' }}>
                Technologies
              </div>
            </div>
          </div>

          <div className="auth-hero-badge">
            <Sparkles size={13} style={{ color: '#b8860b' }} />
            <span>Recruitment Intelligence &amp; Evidence</span>
          </div>
        </div>

        {/* Main Center Proposition */}
        <div className="auth-hero-main-content">
          <div className="auth-hero-tagline">
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#b8860b' }} />
            <span>{config.tagline}</span>
          </div>

          <h1 className="auth-hero-headline">
            {config.headline}
          </h1>

          <p className="auth-hero-subtext">
            {config.subtext}
          </p>

          {/* Flow Strip */}
          <div className="auth-hero-flow-box">
            <div className="auth-hero-flow-header">
              <span style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Working Flow
              </span>
              <span style={{ color: '#b8860b', fontWeight: 800 }}>
                {persona === 'candidate' ? 'Candidate Verification' : persona === 'company' ? 'Role to Evidence' : 'Governance & Audit'}
              </span>
            </div>

            <div className="auth-hero-flow-steps">
              {config.flowSteps.map((step, idx) => (
                <React.Fragment key={step}>
                  <span className="auth-hero-flow-step">{step}</span>
                  {idx < config.flowSteps.length - 1 && (
                    <span className="auth-hero-flow-arrow">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Detailed Workings for Selected Persona */}
          <div className="auth-workings-grid">
            {config.workings.map((w) => {
              const IconComponent = w.icon;
              return (
                <div key={w.title} className="auth-working-card">
                  <div className="auth-working-icon">
                    <IconComponent size={14} style={{ color: '#854d0e' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                      {w.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.45 }}>
                      {w.desc}
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
            <span style={{ color: '#0f172a', fontWeight: 700 }}>GenuAI Technologies</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#854d0e', fontWeight: 700, fontSize: 11.5 }}>{config.trustFooter}</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>TLS 1.3 Transmission • Cryptographic Auditability</span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: COMPACT AUTHENTICATION CARD ================= */}
      <div className="auth-fullscreen-right">
        <div className="auth-fullscreen-form-card">
          {/* Persona Switcher Tabs: Candidate | Company | Admin */}
          <div className="auth-persona-tabs">
            <button
              type="button"
              onClick={() => handlePersonaChange('candidate')}
              className={`auth-persona-tab ${persona === 'candidate' ? 'active' : ''}`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => handlePersonaChange('company')}
              className={`auth-persona-tab ${persona === 'company' ? 'active' : ''}`}
            >
              Company
            </button>
            <button
              type="button"
              onClick={() => handlePersonaChange('admin')}
              className={`auth-persona-tab ${persona === 'admin' ? 'active' : ''}`}
            >
              Admin
            </button>
          </div>

          {/* Mode Switcher for Candidate and Company */}
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

          <h2 className="auth-form-title">
            {isLogin ? config.cardTitle : (persona === 'company' ? 'Create Company Workspace' : 'Create Candidate Account')}
          </h2>
          <p className="auth-form-subtitle">
            {isLogin ? config.cardSubtitle : 'Get started with verifiable role requirements and assessment tracking'}
          </p>

          {/* Error Feedback */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 12,
                fontWeight: 600,
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, color: '#dc2626' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && config.allowRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: persona === 'company' ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="auth-input-label">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Sarah Connor"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="auth-text-input"
                  />
                </div>
                {persona === 'company' && (
                  <div>
                    <label className="auth-input-label">Company Name *</label>
                    <input
                      type="text"
                      placeholder="Acme Tech"
                      value={form.companyName}
                      onChange={(e) => set('companyName', e.target.value)}
                      className="auth-text-input"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-input-label">{config.emailLabel}</label>
              <input
                type="email"
                placeholder={config.emailPlaceholder}
                autoComplete="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="auth-text-input"
              />
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
              <div style={{ position: 'relative' }}>
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
                <div style={{ position: 'relative' }}>
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

            {/* Remember Me & Terms Agreement */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <input
                  type="checkbox"
                  id="remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#b8860b', cursor: 'pointer' }}
                />
                <label htmlFor="remember-checkbox" style={{ cursor: 'pointer' }}>Stay signed in</label>
              </div>
            </div>

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
              <label htmlFor="terms-checkbox" style={{ cursor: 'pointer' }}>
                I agree to the <span onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>Terms of Service</span> and <span onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</span>.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : isLogin ? (
                <>
                  <span>{config.submitText}</span>
                  <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <span>{persona === 'company' ? 'Create Workspace' : 'Create Account'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Social SSO Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.8px' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          <div className="auth-sso-grid">
            <button
              type="button"
              onClick={() => handleOAuth(config.ssoText)}
              className="auth-sso-btn"
            >
              {config.ssoIcon === 'google' ? (
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 14, height: 14 }} />
              ) : (
                <ShieldCheck size={15} style={{ color: '#b8860b' }} />
              )}
              <span>{config.ssoText}</span>
            </button>
          </div>

          {/* 1-Click Quick Demo Bar */}
          <div className="auth-demo-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <KeyRound size={13} style={{ color: '#b8860b' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e' }}>
                Test credentials:
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="auth-demo-btn"
            >
              Autofill {config.label} Demo
            </button>
          </div>

          {/* Admin Restricted Notice */}
          {persona === 'admin' && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                Restricted to authorized <strong style={{ color: '#854d0e' }}>@genuaiadmin.com</strong> accounts.
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
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Reset Your Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16, lineHeight: 1.45 }}>
              Enter your registered work email and we will send you secure instructions to reset your workspace access.
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-input-label">Registered Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="auth-text-input"
                  required
                />
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
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 480,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
            <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p>
                <strong>1. Role-Based Evidence Governance</strong>: GenuAI provides recruitment intelligence and verifiable skill assessment records. All evaluation evidence is traceable back to company-defined role requirements.
              </p>
              <p>
                <strong>2. Human Authority</strong>: GenuAI does not make automated hiring or rejection decisions. Final recruitment authority remains exclusively with human recruiters.
              </p>
              <p>
                <strong>3. Data Privacy &amp; Security</strong>: Candidate and company evaluation data is encrypted in transit and at rest with strict role-based access control.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAgreedTerms(true);
                setShowTermsModal(false);
              }}
              className="auth-submit-btn"
              style={{ marginTop: 16 }}
            >
              I Accept &amp; Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
