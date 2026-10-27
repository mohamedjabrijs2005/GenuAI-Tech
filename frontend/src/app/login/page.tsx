'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import {
  Eye, EyeOff, Lock, Mail,
  AlertCircle, ArrowRight, Building2, User,
  ShieldCheck, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type UserPersona = 'candidate' | 'company' | 'admin';

interface PersonaConfig {
  label: string;
  cardTitle: string;
  cardSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitText: string;
  allowRegister: boolean;
}

const PERSONA_CONFIG: Record<UserPersona, PersonaConfig> = {
  candidate: {
    label: 'Candidate',
    cardTitle: 'Candidate Login',
    cardSubtitle: 'Sign in to your candidate workspace & interview portal',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    submitText: 'Sign In to Workspace',
    allowRegister: true,
  },
  company: {
    label: 'Company',
    cardTitle: 'Employer Portal',
    cardSubtitle: 'Sign in to publish vacancies & review talent evaluations',
    emailLabel: 'Work Email',
    emailPlaceholder: 'recruiter@company.com',
    submitText: 'Access Company Portal',
    allowRegister: true,
  },
  admin: {
    label: 'Admin',
    cardTitle: 'Platform Governance',
    cardSubtitle: 'Sign in to the GenuAI trust & compliance console',
    emailLabel: 'Admin Email',
    emailPlaceholder: 'admin@genuai.io',
    submitText: 'Enter Governance Console',
    allowRegister: false,
  },
};

export default function AuthPage() {
  const router = useRouter();
  const { login, register: authRegister } = useAuth();

  const [persona, setPersona] = useState<UserPersona>('candidate');
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
      setIsLogin(!wantsRegister);

      if (roleParam === 'candidate') setPersona('candidate');
      else if (roleParam === 'company') setPersona('company');
      else if (roleParam === 'admin') { setPersona('admin'); setIsLogin(true); }
    }
  }, []);

  const config = PERSONA_CONFIG[persona];

  const handlePersonaChange = (p: UserPersona) => {
    setPersona(p);
    setError('');
    if (p === 'admin') setIsLogin(true);
  };

  const set = (k: string, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (error) setError('');
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#cbd5e1' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score: 2, label: 'Good', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const validate = () => {
    if (!form.email?.trim()) return 'Please enter your email address.';
    if (!validateEmail(form.email)) return 'Please enter a valid email address.';
    if (!form.password?.trim()) return 'Please enter your password.';
    if (!isLogin && config.allowRegister) {
      if (!agreedTerms) return 'Please agree to the Terms of Service & Privacy Policy.';
      if (!form.name.trim()) return 'Full name is required.';
      if (persona === 'company' && !form.companyName.trim()) return 'Company name is required.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
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
          firstName, lastName,
          email: form.email.trim(),
          password: form.password,
          role: persona === 'admin' ? 'SUPER_ADMIN' : (persona === 'candidate' ? 'CANDIDATE' : 'COMPANY_OWNER'),
          companyName: persona === 'company'
            ? (form.companyName.trim() || 'My Company')
            : (persona === 'admin' ? 'GenuAI Administration' : 'Candidate Workspace'),
        });
      }
    } catch (e: any) {
      if (e.response?.status === 409) {
        setIsLogin(true);
        const msg = 'This email is already registered. Please sign in instead.';
        setError(msg);
        toast(msg, { icon: 'ℹ️' });
        return;
      }
      const msg = e.response?.data?.error || e.message || 'Authentication failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
      setForgotSent(true);
      toast.success('Reset instructions sent if an account exists.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSent(false);
        setForgotEmail('');
      }, 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit reset request.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (persona === 'admin') {
      toast.error('Google Sign-In is not available for admin accounts.');
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) { toast.error('Google Sign-In is not configured.'); return; }
    try {
      setLoading(true);
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              const res = await api.post('/auth/google', {
                idToken: response.credential,
                requestedRole: persona === 'company' ? 'COMPANY_OWNER' : 'CANDIDATE',
                companyName: form.companyName || undefined,
              });
              if (res.data?.token) {
                localStorage.setItem('genuai_token', res.data.token);
                localStorage.setItem('genuai_user', JSON.stringify(res.data.user));
                if (res.data.company) localStorage.setItem('genuai_company', JSON.stringify(res.data.company));
                toast.success('Signed in with Google!');
                router.push(res.data.user?.role === 'COMPANY_OWNER' ? '/dashboard' : '/candidate');
              }
            } catch (err: any) {
              toast.error(err.response?.data?.error || 'Google authentication failed.');
            } finally {
              setLoading(false);
            }
          },
        });
        (window as any).google.accounts.id.prompt();
      } else {
        toast.error('Google Sign-In is loading. Please try again.');
      }
    } catch {
      toast.error('Failed to initialize Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  const passStrength = getPasswordStrength(form.password);

  return (
    <div className="sail-auth-layout">

      {/* ======= LEFT: HERO IMAGE & TRUTHFUL OVERVIEW PANEL ======= */}
      <div className="sail-left-panel">
        {/* Background image & gradient tint clipped with precise diagonal slant */}
        <div className="sail-image-bg" style={{ backgroundImage: "url('/auth-hero.jpg')" }} />
        <div className="sail-image-tint" />

        {/* Content on left panel */}
        <div className="sail-left-content">
          {/* Top Brand Link - matching dashboard top-left */}
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }} className="sail-left-brand-link">
            <div
              className="sidebar-logo-text gold-gradient-text"
              style={{
                fontSize: 22,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.3px',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45))',
              }}
            >
              GenuAI Technologies
            </div>
            <span
              className="sidebar-logo-sub"
              style={{
                fontSize: 10.5,
                color: '#fde68a',
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                display: 'block',
                marginTop: 4,
              }}
            >
              Recruitment Intelligence
            </span>
          </Link>



          {/* Bottom Copyright */}
          <div className="sail-left-footer">
            <span>&copy; {new Date().getFullYear()} GenuAI Technologies &middot; Confidential &amp; Encrypted</span>
          </div>
        </div>
      </div>

      {/* ======= RIGHT: FORM PANEL WITH ELEGANT FRAMED CARD ======= */}
      <div className="sail-right-panel">
        <div className="sail-form-card">

          {/* Top Logo + Decorative Lines (SAIL-Signature) - matching dashboard top-left */}
          <div className="sail-form-logo-row">
            <div className="sail-deco-line" />
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                flexShrink: 0,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                className="sidebar-logo-text gold-gradient-text"
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.3px',
                  textAlign: 'center',
                }}
              >
                GenuAI Technologies
              </div>
              <span
                className="sidebar-logo-sub"
                style={{
                  fontSize: 10,
                  color: '#854d0e',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginTop: 3,
                  textAlign: 'center',
                }}
              >
                Recruitment Intelligence
              </span>
            </Link>
            <div className="sail-deco-line" />
          </div>

          {/* Persona Selection Tabs */}
          <div className="sail-persona-tabs">
            {(['candidate', 'company', 'admin'] as UserPersona[]).map((p) => {
              const icons: Record<UserPersona, React.ReactNode> = {
                candidate: <User size={13} />,
                company: <Building2 size={13} />,
                admin: <ShieldCheck size={13} />,
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePersonaChange(p)}
                  className={`sail-persona-tab${persona === p ? ' active' : ''}`}
                  id={`auth-persona-tab-${p}`}
                >
                  {icons[p]}
                  <span>{PERSONA_CONFIG[p].label}</span>
                </button>
              );
            })}
          </div>

          {/* Sign In / Create Account Toggle */}
          {config.allowRegister && (
            <div className="sail-mode-toggle">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`sail-mode-btn${isLogin ? ' active' : ''}`}
                id="auth-mode-signin"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`sail-mode-btn${!isLogin ? ' active' : ''}`}
                id="auth-mode-register"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Welcome Text */}
          <div className="sail-welcome-block">
            <h2 className="sail-welcome-title">
              {isLogin
                ? (persona === 'admin' ? 'Platform Governance' : `Welcome to GenuAI Technologies!`)
                : (persona === 'company' ? 'Register Company Account' : 'Create Candidate Account')}
            </h2>
            <p className="sail-welcome-sub">
              {isLogin ? config.cardSubtitle : 'Get started with verified recruitment — free to register'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="sail-error-box">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>

            {/* Register-only fields */}
            {!isLogin && config.allowRegister && (
              <div className={persona === 'company' ? 'sail-two-col' : ''} style={{ marginBottom: 14 }}>
                <div className="sail-field">
                  <label className="sail-label">Full Name</label>
                  <div className="sail-input-wrap">
                    <User size={15} className="sail-input-icon" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      className="sail-input"
                      required
                    />
                  </div>
                </div>
                {persona === 'company' && (
                  <div className="sail-field">
                    <label className="sail-label">Company Name</label>
                    <div className="sail-input-wrap">
                      <Building2 size={15} className="sail-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={form.companyName}
                        onChange={(e) => set('companyName', e.target.value)}
                        className="sail-input"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="sail-field">
              <label className="sail-label">{config.emailLabel}</label>
              <div className="sail-input-wrap">
                <Mail size={15} className="sail-input-icon" />
                <input
                  type="email"
                  placeholder={config.emailPlaceholder}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="sail-input"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="sail-field">
              <div className="sail-label-row">
                <label className="sail-label">Password</label>
                {isLogin && (
                  <span
                    className="sail-forgot"
                    onClick={() => { setForgotEmail(form.email || ''); setShowForgotModal(true); }}
                  >
                    Forgot Password?
                  </span>
                )}
              </div>
              <div className="sail-input-wrap">
                <Lock size={15} className="sail-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="sail-input"
                  style={{ paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  className="sail-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength (when registering) */}
              {!isLogin && form.password && (
                <div className="sail-strength-bar">
                  <div className="sail-strength-track">
                    <div style={{ flex: 1, height: '100%', borderRadius: 2, background: passStrength.score >= 1 ? passStrength.color : '#e2e8f0' }} />
                    <div style={{ flex: 1, height: '100%', borderRadius: 2, background: passStrength.score >= 2 ? passStrength.color : '#e2e8f0' }} />
                    <div style={{ flex: 1, height: '100%', borderRadius: 2, background: passStrength.score >= 3 ? passStrength.color : '#e2e8f0' }} />
                  </div>
                  <span style={{ fontSize: 10.5, color: passStrength.color, fontWeight: 700 }}>
                    {passStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password (when registering) */}
            {!isLogin && config.allowRegister && (
              <div className="sail-field">
                <label className="sail-label">Confirm Password</label>
                <div className="sail-input-wrap">
                  <Lock size={15} className="sail-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    className="sail-input"
                    style={{ paddingRight: 40 }}
                    required
                  />
                  <button
                    type="button"
                    className="sail-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me */}
            {isLogin && (
              <div className="sail-remember">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me">Stay signed in to GenuAI</label>
              </div>
            )}

            {/* Terms & Privacy */}
            {!isLogin && (
              <div className="sail-terms-row" onClick={() => setAgreedTerms(!agreedTerms)}>
                <input
                  type="checkbox"
                  id="terms-cb"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{ accentColor: '#b8860b', marginTop: 2, flexShrink: 0 }}
                />
                <label htmlFor="terms-cb">
                  I agree to the{' '}
                  <span
                    onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }}
                    style={{ color: '#b8860b', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Terms of Service
                  </span>
                  {' '}and{' '}
                  <span
                    onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }}
                    style={{ color: '#b8860b', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Privacy Policy
                  </span>
                </label>
              </div>
            )}

            {/* Submit Pill Button (SAIL-Style) */}
            <button
              type="submit"
              disabled={loading}
              className="sail-submit-btn"
              id="auth-submit-btn"
            >
              {loading ? (
                <span className="sail-spinner" />
              ) : isLogin ? (
                <>{config.submitText} <ArrowRight size={16} /></>
              ) : (
                <>{persona === 'company' ? 'Register Company' : 'Complete Registration'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Social Sign-In Divider & Button */}
          {persona !== 'admin' && (
            <>
              <div className="sail-divider">
                <div className="sail-divider-line" />
                <span>or continue with</span>
                <div className="sail-divider-line" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="sail-google-btn"
                id="auth-google-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}

          <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

          {/* Admin Note */}
          {persona === 'admin' && (
            <p className="sail-admin-note">
              Restricted to authorized <strong style={{ color: '#b8860b' }}>GenuAI Governance</strong> administrators.
            </p>
          )}

          {/* Footer Links */}
          <div className="sail-footer-links">
            <Link href="/">← Home</Link>
            <span>&middot;</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span>&middot;</span>
            <Link href="/terms">Terms of Service</Link>
            <span>&middot;</span>
            <Link href="/trust">Trust Center</Link>
          </div>
        </div>
      </div>

      {/* ======= FORGOT PASSWORD MODAL ======= */}
      {showForgotModal && (
        <div className="sail-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="sail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sail-modal-header">
              <h3>Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="sail-modal-close"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.55 }}>
              Enter your registered email address and we will send you secure password reset instructions.
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div className="sail-field">
                <label className="sail-label">Email Address</label>
                <div className="sail-input-wrap">
                  <Mail size={15} className="sail-input-icon" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="sail-input"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="sail-submit-btn" style={{ marginTop: 12 }}>
                {forgotSent ? 'Reset Link Sent!' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======= TERMS & PRIVACY MODAL ======= */}
      {showTermsModal && (
        <div className="sail-modal-backdrop" onClick={() => setShowTermsModal(false)}>
          <div className="sail-modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="sail-modal-header">
              <h3>Terms &amp; Privacy Overview</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="sail-modal-close"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 6, fontSize: 13, color: '#475569', lineHeight: 1.65 }}>
              <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: 14 }}>1. Evidence-Based Evaluation</h4>
              <p style={{ margin: '0 0 12px' }}>
                GenuAI Technologies provides role-specific evaluation workspaces. All scoring rubrics and assessments are objective and based on documented vacancy criteria.
              </p>
              <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: 14 }}>2. Candidate Privacy &amp; Data Isolation</h4>
              <p style={{ margin: '0 0 12px' }}>
                Your personal and evaluation data is strictly partitioned. Data is never sold, shared across unverified third parties, or used to train public generative models.
              </p>
              <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: 14 }}>3. Human-in-the-Loop Governance</h4>
              <p style={{ margin: 0 }}>
                AI evaluations are analytical recommendations provided to employers. All final recruitment decisions are made by human hiring leaders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setAgreedTerms(true); setShowTermsModal(false); }}
              className="sail-submit-btn"
              style={{ marginTop: 20 }}
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
