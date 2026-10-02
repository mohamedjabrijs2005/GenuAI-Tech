'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, ShieldCheck, Lock, Mail, CheckCircle2,
  AlertCircle, ArrowRight, Sparkles, Building2, User,
  Terminal, Cpu, Check, FileCheck, Shield, Target, UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GenuAILogo } from '@/components/GenuAILogo';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const router = useRouter();
  const { login, register: authRegister } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (error) setError('');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const validate = () => {
    if (!form.email || !form.email.trim()) {
      return 'Please enter your work email address.';
    }
    if (!validateEmail(form.email)) {
      return 'Please enter a valid work email address.';
    }
    if (!form.password || !form.password.trim()) {
      return 'Please enter your password.';
    }

    if (!isLogin) {
      if (!agreedTerms) {
        return 'Please agree to the Terms of Service and Privacy Policy.';
      }
      if (!form.name.trim()) {
        return 'Full name is required.';
      }
      if (!form.companyName.trim()) {
        return 'Company or organization name is required.';
      }
      if (form.password.length < 6) {
        return 'Password must be at least 6 characters.';
      }
      if (form.password !== form.confirmPassword) {
        return 'Passwords do not match.';
      }
    } else {
      if (!agreedTerms) {
        return 'Please agree to the Terms of Service and Privacy Policy.';
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
    setSuccess('');

    try {
      if (isLogin) {
        await login(form.email.trim(), form.password);
        toast.success('Signed in successfully');
        router.push('/dashboard');
      } else {
        const nameParts = form.name.trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Admin';

        await authRegister({
          firstName,
          lastName,
          email: form.email.trim(),
          password: form.password,
          companyName: form.companyName.trim() || 'My Company',
        });

        toast.success('Company account created successfully');
        router.push('/dashboard');
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

  return (
    <div className="auth-fullscreen-layout">
      {/* ================= LEFT SIDE: FULL-SIZE DEEP BRAND HERO ================= */}
      <div className="auth-fullscreen-left">
        {/* Top Navigation & Status Badge */}
        <div className="auth-hero-top-nav">
          <GenuAILogo size="lg" />
          <div className="auth-hero-soc2-badge">
            <ShieldCheck size={14} style={{ color: '#56b3f9' }} />
            <span>Security-First Architecture • Auditability • Role-Based Access</span>
          </div>
        </div>

        {/* Main Center Pitch */}
        <div className="auth-hero-main-content">
          <div className="auth-hero-tagline">
            <Sparkles size={15} />
            <span>Recruitment Intelligence & Evidence Engine</span>
          </div>

          <h1 className="auth-hero-headline" style={{ fontSize: '32px', lineHeight: '1.2' }}>
            Define the Role. Assess the Capability.<br />
            <span style={{ color: '#56b3f9' }}>See the Evidence.</span>
          </h1>

          <p className="auth-hero-subtext" style={{ fontSize: '13.5px', marginBottom: '20px', lineHeight: '1.55' }}>
            GenuAI connects <strong>company-defined role requirements</strong> with structured assessments, traceable candidate evidence, evidence coverage, and recruiter review—while keeping the final hiring decision with the company.
          </p>

          {/* Core Pillars */}
          <div className="auth-hero-pillars" style={{ gridTemplateColumns: '1fr', gap: '10px', marginBottom: '20px' }}>
            <div className="auth-hero-pillar-item">
              <div className="auth-hero-pillar-icon">
                <Target size={16} />
              </div>
              <div>
                <div className="auth-hero-pillar-title">Requirement-Centered Evidence</div>
                <div className="auth-hero-pillar-desc">Every assessment, evaluation, and interview can be traced back to the specific role requirements it supports.</div>
              </div>
            </div>

            <div className="auth-hero-pillar-item">
              <div className="auth-hero-pillar-icon">
                <FileCheck size={16} />
              </div>
              <div>
                <div className="auth-hero-pillar-title">Evidence You Can Review</div>
                <div className="auth-hero-pillar-desc">See the source, result, assessment version, evaluation context, timestamp, and evidence status for each requirement.</div>
              </div>
            </div>

            <div className="auth-hero-pillar-item">
              <div className="auth-hero-pillar-icon">
                <UserCheck size={16} />
              </div>
              <div>
                <div className="auth-hero-pillar-title">Human Decision Authority</div>
                <div className="auth-hero-pillar-desc">GenuAI does not automatically hire or reject candidates. Recruiters review the available evidence and the company makes the final decision.</div>
              </div>
            </div>
          </div>

          {/* Core Product Flow Code/Terminal Block */}
          <div className="auth-hero-code-box" style={{ padding: '14px 18px', marginBottom: '18px' }}>
            <div className="auth-hero-code-header" style={{ marginBottom: '8px', paddingBottom: '6px' }}>
              <div className="auth-hero-code-dots">
                <span className="auth-hero-code-dot" style={{ background: '#f87171' }} />
                <span className="auth-hero-code-dot" style={{ background: '#fbbf24' }} />
                <span className="auth-hero-code-dot" style={{ background: '#34d399' }} />
                <span style={{ marginLeft: 8, color: '#94a3b8', fontWeight: 600 }}>Core Product Flow</span>
              </div>
              <span style={{ color: '#56b3f9', fontSize: '11px', fontWeight: 600 }}>Role Requirements → Recruiter Evidence</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(86, 179, 249, 0.2)', color: '#56b3f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, minWidth: '72px', textAlign: 'center' }}>DEFINE</span>
                <span style={{ color: '#cbd5e1' }}>Company creates the vacancy and role requirements</span>
              </div>
              <div style={{ color: '#64748b', paddingLeft: '34px', fontSize: '9px', lineHeight: '1' }}>↓</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(86, 179, 249, 0.2)', color: '#56b3f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, minWidth: '72px', textAlign: 'center' }}>ASSESS</span>
                <span style={{ color: '#cbd5e1' }}>Requirements are mapped to assessments and evaluations</span>
              </div>
              <div style={{ color: '#64748b', paddingLeft: '34px', fontSize: '9px', lineHeight: '1' }}>↓</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(86, 179, 249, 0.2)', color: '#56b3f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, minWidth: '72px', textAlign: 'center' }}>EVIDENCE</span>
                <span style={{ color: '#cbd5e1' }}>Candidate results generate traceable supporting evidence</span>
              </div>
              <div style={{ color: '#64748b', paddingLeft: '34px', fontSize: '9px', lineHeight: '1' }}>↓</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(86, 179, 249, 0.2)', color: '#56b3f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, minWidth: '72px', textAlign: 'center' }}>COVERAGE</span>
                <span style={{ color: '#cbd5e1' }}>Recruiters see what requirements have supporting evidence</span>
              </div>
              <div style={{ color: '#64748b', paddingLeft: '34px', fontSize: '9px', lineHeight: '1' }}>↓</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(86, 179, 249, 0.2)', color: '#56b3f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, minWidth: '72px', textAlign: 'center' }}>REVIEW</span>
                <span style={{ color: '#cbd5e1' }}>Recruiters examine evidence, interviews, and integrity signals</span>
              </div>
              <div style={{ color: '#64748b', paddingLeft: '34px', fontSize: '9px', lineHeight: '1' }}>↓</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(52, 211, 153, 0.25)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, minWidth: '72px', textAlign: 'center' }}>DECISION</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>The company makes the final recruitment decision</span>
              </div>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '10.5px', color: '#60a5fa' }}>
              Evidence Integrity • Cryptographic Hashing • Human Review
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              From Role Requirements to Recruiter-Ready Evidence.
            </div>
          </div>
        </div>

        {/* Bottom Compliance Strip */}
        <div className="auth-hero-bottom-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>GenuAI Technologies</span>
            <span>•</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#cce5ff' }}>Enterprise B2B SaaS • Recruitment Evidence Intelligence</span>
          </div>
          <div>
            <span style={{ color: '#cce5ff' }}>Secure Data Transmission • Encryption in Transit</span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: FULL-SIZE INTERACTIVE FORM ================= */}
      <div className="auth-fullscreen-right">
        <div className="auth-fullscreen-form-card">
          {/* Segmented Mode Switcher */}
          <div className="auth-pill-switch">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
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
                setSuccess('');
              }}
              className={`auth-pill-btn ${!isLogin ? 'active' : ''}`}
            >
              Create Account
            </button>
          </div>

          <h2 className="auth-form-title">
            {isLogin ? 'Sign in to GenuAI' : 'Create Company Workspace'}
          </h2>
          <p className="auth-form-subtitle">
            {isLogin
              ? 'Enter your credentials to manage vacancies and candidates'
              : 'Launch your recruitment intelligence pipeline with verifiable assessments'}
          </p>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: '#ffdad6',
                border: '1px solid #ffb4ab',
                color: '#93000a',
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
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
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
                </div>
              </>
            )}

            <div className="auth-input-group">
              <label className="auth-input-label">Work Email Address *</label>
              <input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="auth-text-input"
              />
            </div>

            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="auth-input-label" style={{ margin: 0 }}>Password *</label>
                {isLogin && (
                  <span
                    onClick={() => {
                      toast.custom((t) => (
                        <div style={{ background: '#fff', border: '1px solid #e0e3e5', padding: '12px 16px', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          Password reset link will be sent to your work email.
                        </div>
                      ));
                    }}
                    style={{ fontSize: 11, fontWeight: 700, color: '#00236f', cursor: 'pointer' }}
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
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#757682',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
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
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#757682',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Terms and conditions */}
            <div
              className="auth-terms-box"
              onClick={() => setAgreedTerms(!agreedTerms)}
            >
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ marginTop: 2, cursor: 'pointer' }}
              />
              <label htmlFor="terms-checkbox" style={{ cursor: 'pointer' }}>
                I agree to the <strong style={{ color: '#00236f' }}>Terms of Service</strong> and <strong style={{ color: '#00236f' }}>Privacy Policy</strong>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : isLogin ? (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <span>Create Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: '#e0e3e5' }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#757682', letterSpacing: '0.8px' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: 1, background: '#e0e3e5' }} />
          </div>

          {/* Social SSO Grid */}
          <div className="auth-sso-grid">
            <button
              type="button"
              onClick={() => handleOAuth('Google')}
              className="auth-sso-btn"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 14, height: 14 }} />
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('Microsoft')}
              className="auth-sso-btn"
            >
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H1z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>Microsoft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
