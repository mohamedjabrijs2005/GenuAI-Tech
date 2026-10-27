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
    cardTitle: 'Welcome to GenuAI',
    cardSubtitle: 'Sign in to access your candidate workspace',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    submitText: 'Sign In',
    allowRegister: true,
  },
  company: {
    label: 'Company',
    cardTitle: 'Company Workspace',
    cardSubtitle: 'Sign in to manage vacancies and candidate evidence',
    emailLabel: 'Work Email Address',
    emailPlaceholder: 'you@company.com',
    submitText: 'Sign In',
    allowRegister: true,
  },
  admin: {
    label: 'Admin',
    cardTitle: 'Admin Dashboard',
    cardSubtitle: 'Sign in to the governance and administration console',
    emailLabel: 'Admin Email Address',
    emailPlaceholder: 'admin@genuai.io',
    submitText: 'Access Dashboard',
    allowRegister: true,
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
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score <= 1) return { score: 1, label: 'Weak', color: '#f87171' };
    if (score <= 3) return { score: 2, label: 'Good', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const validate = () => {
    if (!form.email?.trim()) return `Please enter your email address.`;
    if (!validateEmail(form.email)) return 'Please enter a valid email address.';
    if (!form.password?.trim()) return 'Please enter your password.';
    if (!isLogin && config.allowRegister) {
      if (!agreedTerms) return 'Please agree to the Terms of Service and Privacy Policy.';
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
          firstName,
          lastName,
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
      toast.success('Password reset instructions sent if an account exists.');
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
    if (!clientId) {
      toast.error('Google Sign-In is not configured.');
      return;
    }
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
    <div className="auth-page-wrapper">
      {/* Decorative background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      <div className="auth-center-container">

        {/* Logo */}
        <div className="auth-brand-header">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              GenuAI Technologies
            </div>
            <span style={{ fontSize: 10, color: '#b8860b', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', display: 'block', marginTop: 3 }}>
              Recruitment Intelligence
            </span>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="auth-card-elegant">

          {/* Persona Switcher */}
          <div className="auth-persona-tabs">
            <button type="button" onClick={() => handlePersonaChange('candidate')} className={`auth-persona-tab ${persona === 'candidate' ? 'active' : ''}`}>
              <User size={13} /><span>Candidate</span>
            </button>
            <button type="button" onClick={() => handlePersonaChange('company')} className={`auth-persona-tab ${persona === 'company' ? 'active' : ''}`}>
              <Building2 size={13} /><span>Company</span>
            </button>
            <button type="button" onClick={() => handlePersonaChange('admin')} className={`auth-persona-tab ${persona === 'admin' ? 'active' : ''}`}>
              <ShieldCheck size={13} /><span>Admin</span>
            </button>
          </div>

          {/* Sign In / Create Account toggle */}
          {config.allowRegister && (
            <div className="auth-pill-switch">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`auth-pill-btn ${isLogin ? 'active' : ''}`}
              >Sign In</button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`auth-pill-btn ${!isLogin ? 'active' : ''}`}
              >Create Account</button>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <h2 className="auth-form-title">
              {isLogin ? config.cardTitle : (persona === 'company' ? 'Create Company Account' : persona === 'admin' ? 'Create Admin Account' : 'Create Candidate Account')}
            </h2>
            <p className="auth-form-subtitle">
              {isLogin ? config.cardSubtitle : 'Get started with your GenuAI account'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
              fontSize: 12, fontWeight: 600, padding: '10px 14px', borderRadius: 10,
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && config.allowRegister && (
              <div className={persona === 'company' ? 'auth-two-col-grid' : ''} style={{ gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="auth-input-label">Full Name *</label>
                  <div className="auth-input-wrapper">
                    <User size={15} className="auth-input-icon" />
                    <input type="text" placeholder="Your full name" value={form.name} onChange={(e) => set('name', e.target.value)} className="auth-text-input" />
                  </div>
                </div>
                {persona === 'company' && (
                  <div>
                    <label className="auth-input-label">Company Name *</label>
                    <div className="auth-input-wrapper">
                      <Building2 size={15} className="auth-input-icon" />
                      <input type="text" placeholder="Your company" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} className="auth-text-input" />
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
                    onClick={() => { setForgotEmail(form.email || ''); setShowForgotModal(true); }}
                    style={{ fontSize: 11, fontWeight: 700, color: '#b8860b', cursor: 'pointer' }}
                  >Forgot Password?</span>
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
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {!isLogin && form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, height: 3, marginBottom: 4 }}>
                    <div style={{ flex: 1, borderRadius: 2, background: passStrength.score >= 1 ? passStrength.color : '#e2e8f0' }} />
                    <div style={{ flex: 1, borderRadius: 2, background: passStrength.score >= 2 ? passStrength.color : '#e2e8f0' }} />
                    <div style={{ flex: 1, borderRadius: 2, background: passStrength.score >= 3 ? passStrength.color : '#e2e8f0' }} />
                  </div>
                  <span style={{ fontSize: 10, color: passStrength.color, fontWeight: 700 }}>Password Strength: {passStrength.label}</span>
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
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#64748b', marginBottom: 14 }}>
                <input
                  type="checkbox"
                  id="remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#b8860b', cursor: 'pointer' }}
                />
                <label htmlFor="remember-checkbox" style={{ cursor: 'pointer', userSelect: 'none' }}>Stay signed in</label>
              </div>
            )}

            {!isLogin && (
              <div className="auth-terms-box" onClick={() => setAgreedTerms(!agreedTerms)}>
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: 2, cursor: 'pointer', accentColor: '#b8860b' }}
                />
                <label htmlFor="terms-checkbox" style={{ cursor: 'pointer', fontSize: 11, color: '#475569', lineHeight: 1.45 }}>
                  I agree to the{' '}
                  <span onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#854d0e', fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</span>.
                </label>
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? <span>Signing in…</span> : isLogin ? (
                <><span>{config.submitText}</span><ArrowRight size={15} /></>
              ) : (
                <><span>{persona === 'company' ? 'Create Company Account' : persona === 'admin' ? 'Create Admin Account' : 'Create Candidate Account'}</span><ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Google Sign-In */}
          {persona !== 'admin' && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 10px' }}>
                <div style={{ flex: 1, height: 1, background: '#e8e0cc' }} />
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#e8e0cc' }} />
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%', height: 44, borderRadius: 10,
                  border: '1px solid #e2d8c0', background: '#ffffff',
                  color: '#334155', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 10, cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(184,134,11,0.08)',
                  transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d4af37'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(184,134,11,0.16)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2d8c0'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(184,134,11,0.08)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

          {persona === 'admin' && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                Restricted to authorized <strong style={{ color: '#854d0e' }}>administrator</strong> accounts.
              </p>
            </div>
          )}

          {/* Footer links */}
          <div style={{
            marginTop: 22, paddingTop: 16, borderTop: '1px solid #f0ebe0',
            display: 'flex', flexDirection: 'column', gap: 8,
            alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/" style={{ fontSize: 12, fontWeight: 700, color: '#475569', textDecoration: 'none' }}>← Home</Link>
              <span style={{ color: '#d4c9a8' }}>•</span>
              <Link href="/register" style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', textDecoration: 'none' }}>Get Started</Link>
              <span style={{ color: '#d4c9a8' }}>•</span>
              <Link href="/trust" style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>Privacy</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11, color: '#94a3b8' }}>
              <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Use</Link>
              <span>•</span>
              <Link href="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 24px 56px rgba(0,0,0,0.18)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Reset Password</h3>
              <button type="button" onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
              Enter your registered email address and we'll send you password reset instructions.
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-input-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={15} className="auth-input-icon" />
                  <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="auth-text-input" required />
                </div>
              </div>
              <button type="submit" className="auth-submit-btn" style={{ marginTop: 0 }}>
                {forgotSent ? 'Reset Link Sent!' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 28, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 56px rgba(0,0,0,0.18)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Terms of Service & Privacy Policy</h3>
              <button type="button" onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p><strong>1. Evidence-Based Evaluation</strong>: GenuAI provides recruitment intelligence with verifiable skill assessment records. All evaluation evidence is traceable to company-defined role requirements.</p>
              <p><strong>2. Human Authority</strong>: GenuAI does not make automated hiring or rejection decisions. Final recruitment authority remains exclusively with human recruiters and hiring managers.</p>
              <p><strong>3. Data Privacy</strong>: Candidate and company evaluation data is compartmentalized with strict multi-tenant isolation and not shared across organizations.</p>
            </div>
            <button type="button" onClick={() => { setAgreedTerms(true); setShowTermsModal(false); }} className="auth-submit-btn" style={{ marginTop: 20 }}>
              I Accept & Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
