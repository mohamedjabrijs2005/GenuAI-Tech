'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import {
  Eye, EyeOff, Lock, Mail,
  AlertCircle, ArrowRight, Building2, User,
  ShieldCheck, X, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type UserPersona = 'candidate' | 'company' | 'admin';

interface PersonaConfig {
  label: string;
  cardSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitText: string;
  allowRegister: boolean;
}

const PERSONA_CONFIG: Record<UserPersona, PersonaConfig> = {
  candidate: {
    label: 'Candidate',
    cardSubtitle: 'Access your recruitment workspace & evidence locker',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    submitText: 'Sign In to Workspace',
    allowRegister: true,
  },
  company: {
    label: 'Company',
    cardSubtitle: 'Manage vacancies & evaluate candidate evidence',
    emailLabel: 'Work Email',
    emailPlaceholder: 'recruiter@company.com',
    submitText: 'Access Company Portal',
    allowRegister: true,
  },
  admin: {
    label: 'Admin',
    cardSubtitle: 'GenuAI platform compliance & audit console',
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
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const modeParam = params.get('mode');
      if (modeParam === 'register') setIsLogin(false);
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
    if (!pass) return { score: 0, label: '', color: '#e2e8f0' };
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

  // ─── ICON MAP ───────────────────────────────────────────────────────────────
  const personaIcons: Record<UserPersona, React.ReactNode> = {
    candidate: <User size={14} />,
    company: <Building2 size={14} />,
    admin: <ShieldCheck size={14} />,
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: '#f8f7f5',
    }}>

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Background Image + Branding
      ══════════════════════════════════════════════════════ */}
      <div style={{
        flex: '0 0 48%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
      }} className="auth-left-panel">

        {/* Full-bleed background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/auth-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }} />

        {/* Dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(8,14,35,0.72) 0%, rgba(8,14,35,0.55) 45%, rgba(184,134,11,0.25) 100%)',
          zIndex: 1,
        }} />

        {/* Top: Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              fontSize: 22, fontWeight: 900, letterSpacing: '-0.4px', lineHeight: 1.15,
              background: 'linear-gradient(90deg, #d4af37, #f5d890)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              GenuAI Technologies
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(212,175,55,0.75)',
              textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 3,
            }}>
              Recruitment Intelligence
            </div>
          </Link>
        </div>

        {/* Center: Hero copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 900,
            color: '#ffffff', letterSpacing: '-0.8px', lineHeight: 1.25,
            margin: '0 0 16px',
          }}>
            Where evidence<br />
            <span style={{ background: 'linear-gradient(90deg,#d4af37,#f5d890)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              meets opportunity.
            </span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, maxWidth: 320, margin: 0 }}>
            GenuAI connects verified vacancies with role-specific evidence, transparent requirement coverage, and human-led hiring decisions.
          </p>

          {/* Pillars */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Verified company & vacancy workflow',
              'Target-specific candidate privacy',
              'Human-led hiring decisions only',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={15} color="#d4af37" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: back link */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.3px' }}>
            ← Back to home
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Auth Form
      ══════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 28px',
        background: '#ffffff',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Persona tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: '#f4f2ee', borderRadius: 12, padding: 4,
            marginBottom: 28, border: '1px solid #ece9e0',
          }}>
            {(['candidate', 'company', 'admin'] as UserPersona[]).map((p) => (
              <button
                key={p}
                type="button"
                id={`auth-persona-tab-${p}`}
                onClick={() => handlePersonaChange(p)}
                style={{
                  flex: 1, padding: '8px 6px',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: persona === p ? '#ffffff' : 'transparent',
                  color: persona === p ? '#92400e' : '#64748b',
                  boxShadow: persona === p ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {personaIcons[p]}
                {PERSONA_CONFIG[p].label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
              {isLogin
                ? (persona === 'admin' ? 'Platform Governance' : 'Welcome back')
                : (persona === 'company' ? 'Register Company' : 'Create Account')}
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              {isLogin ? config.cardSubtitle : 'Get started — free to register'}
            </p>
          </div>

          {/* Sign In / Create Account toggle */}
          {config.allowRegister && (
            <div style={{
              display: 'flex', marginBottom: 24,
              background: '#f8f7f5', borderRadius: 10, padding: 3,
              border: '1px solid #e8e4db',
            }}>
              {[{ id: 'auth-mode-signin', label: 'Sign In', active: isLogin }, { id: 'auth-mode-register', label: 'Create Account', active: !isLogin }].map((btn) => (
                <button
                  key={btn.id}
                  id={btn.id}
                  type="button"
                  onClick={() => { setIsLogin(btn.label === 'Sign In'); setError(''); }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                    fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    transition: 'all 0.18s ease',
                    background: btn.active ? '#ffffff' : 'transparent',
                    color: btn.active ? '#0f172a' : '#94a3b8',
                    boxShadow: btn.active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', fontSize: 12.5, fontWeight: 600,
              padding: '10px 14px', borderRadius: 10, marginBottom: 18,
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Register extras */}
            {!isLogin && config.allowRegister && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: persona === 'company' ? '1fr 1fr' : '1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <div style={inputWrapStyle}>
                      <User size={14} style={iconStyle} />
                      <input type="text" placeholder="e.g. Alex Morgan" value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} className="auth-input" required />
                    </div>
                  </div>
                  {persona === 'company' && (
                    <div>
                      <label style={labelStyle}>Company Name</label>
                      <div style={inputWrapStyle}>
                        <Building2 size={14} style={iconStyle} />
                        <input type="text" placeholder="e.g. Acme Corp" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} style={inputStyle} className="auth-input" required />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label style={labelStyle}>{config.emailLabel}</label>
              <div style={inputWrapStyle}>
                <Mail size={14} style={iconStyle} />
                <input
                  type="email"
                  placeholder={config.emailPlaceholder}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                {isLogin && (
                  <button type="button" onClick={() => { setForgotEmail(form.email || ''); setShowForgotModal(true); }}
                    style={{ fontSize: 12, fontWeight: 700, color: '#b8860b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={inputWrapStyle}>
                <Lock size={14} style={iconStyle} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  className="auth-input"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength meter */}
              {!isLogin && form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                  <div style={{ flex: 1, display: 'flex', gap: 4, height: 3 }}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} style={{ flex: 1, borderRadius: 2, background: passStrength.score >= n ? passStrength.color : '#e2e8f0', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: passStrength.color }}>{passStrength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            {!isLogin && config.allowRegister && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={inputWrapStyle}>
                  <Lock size={14} style={iconStyle} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    style={{ ...inputStyle, paddingRight: 42 }}
                    className="auth-input"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me */}
            {isLogin && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: '#b8860b', width: 14, height: 14 }} />
                Stay signed in to GenuAI
              </label>
            )}

            {/* Terms */}
            {!isLogin && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#475569', cursor: 'pointer', lineHeight: 1.55 }}>
                <input type="checkbox" id="terms-cb" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} style={{ accentColor: '#b8860b', marginTop: 2, flexShrink: 0 }} />
                I agree to the{' '}
                <span onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#b8860b', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
                  Terms of Service
                </span>{' '}and{' '}
                <span onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#b8860b', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
                  Privacy Policy
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              style={{
                width: '100%', height: 50, borderRadius: 12, border: 'none',
                background: loading ? '#d4af37' : 'linear-gradient(135deg, #b8860b 0%, #d4af37 60%, #c9a227 100%)',
                color: '#fff', fontSize: 14.5, fontWeight: 800,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: '0 4px 18px rgba(184,134,11,0.35)',
                transition: 'all 0.2s ease',
                marginTop: 4, letterSpacing: '0.1px',
              }}
            >
              {loading ? (
                <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'auth-spin 0.75s linear infinite', display: 'inline-block' }} />
              ) : isLogin ? (
                <>{config.submitText} <ArrowRight size={16} /></>
              ) : (
                <>{persona === 'company' ? 'Register Company' : 'Complete Registration'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Google Sign-In */}
          {persona !== 'admin' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 14px' }}>
                <div style={{ flex: 1, height: 1, background: '#ece9e0' }} />
                <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#ece9e0' }} />
              </div>

              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%', height: 46, borderRadius: 12,
                  border: '1.5px solid #e8e4db', background: '#ffffff',
                  color: '#334155', fontSize: 13.5, fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.18s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d4af37'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 12px rgba(184,134,11,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e4db'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Admin note */}
          {persona === 'admin' && (
            <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 16 }}>
              Restricted to authorized <strong style={{ color: '#b8860b' }}>GenuAI Governance</strong> administrators.
            </p>
          )}

          {/* Footer links */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            justifyContent: 'center', marginTop: 28, paddingTop: 20,
            borderTop: '1px solid #f0ebe0', fontSize: 12, color: '#94a3b8',
          }}>
            {[['/', 'Home'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/trust', 'Trust Center']].map(([href, label], i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: '#d8d4cc', fontSize: 9 }}>•</span>}
                <Link href={href} style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#b8860b')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                  {label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FORGOT PASSWORD MODAL ─────────────────────────────────────── */}
      {showForgotModal && (
        <div onClick={() => setShowForgotModal(false)} style={modalBackdropStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Reset Password</h3>
              <button type="button" onClick={() => setShowForgotModal(false)} style={modalCloseStyle}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 20px', lineHeight: 1.6 }}>
              Enter your registered email and we'll send you secure reset instructions.
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email Address</label>
                <div style={inputWrapStyle}>
                  <Mail size={14} style={iconStyle} />
                  <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} style={inputStyle} className="auth-input" required />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', height: 46, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#b8860b,#d4af37)', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 3px 12px rgba(184,134,11,0.3)' }}>
                {forgotSent ? '✓ Reset Link Sent!' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── TERMS MODAL ───────────────────────────────────────────────── */}
      {showTermsModal && (
        <div onClick={() => setShowTermsModal(false)} style={modalBackdropStyle}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalStyle, maxWidth: 520 }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Terms & Privacy Overview</h3>
              <button type="button" onClick={() => setShowTermsModal(false)} style={modalCloseStyle}><X size={18} /></button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4, fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>
              <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: 14 }}>1. Evidence-Based Evaluation</h4>
              <p style={{ margin: '0 0 14px' }}>GenuAI provides role-specific evaluation workspaces. All scoring rubrics and assessments are objective and based on documented vacancy criteria.</p>
              <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: 14 }}>2. Candidate Privacy & Data Isolation</h4>
              <p style={{ margin: '0 0 14px' }}>Your personal and evaluation data is strictly partitioned. Data is never sold, shared across unverified third parties, or used to train public generative models.</p>
              <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: 14 }}>3. Human-in-the-Loop Governance</h4>
              <p style={{ margin: 0 }}>AI evaluations are analytical recommendations. All final recruitment decisions are made by human hiring leaders.</p>
            </div>
            <button
              type="button"
              onClick={() => { setAgreedTerms(true); setShowTermsModal(false); }}
              style={{ width: '100%', height: 46, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#b8860b,#d4af37)', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', marginTop: 20, boxShadow: '0 3px 12px rgba(184,134,11,0.3)' }}>
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

      <style>{`
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        .auth-input:focus {
          outline: none;
          border-color: #d4af37 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.18) !important;
        }
        .auth-left-panel { display: flex; }
        @media (max-width: 760px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared inline styles ──────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#374151', marginBottom: 6, letterSpacing: '0.1px',
};

const inputWrapStyle: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center',
};

const iconStyle: React.CSSProperties = {
  position: 'absolute', left: 13, color: '#94a3b8', pointerEvents: 'none', zIndex: 1,
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 46, padding: '0 14px 0 38px',
  fontSize: 13.5, color: '#0f172a', background: '#f8f7f5',
  border: '1.5px solid #e8e4db', borderRadius: 10, outline: 'none',
  boxSizing: 'border-box', transition: 'all 0.18s ease',
  fontFamily: 'inherit',
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
  backdropFilter: 'blur(4px)', zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: '#ffffff', borderRadius: 18, padding: '28px 28px',
  width: '100%', maxWidth: 420,
  boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
  animation: 'fadeUp 0.2s ease',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
};

const modalCloseStyle: React.CSSProperties = {
  background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer',
  padding: 6, display: 'flex', alignItems: 'center', color: '#64748b',
};
