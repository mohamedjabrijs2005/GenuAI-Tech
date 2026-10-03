'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

interface FieldError {
  path: string;
  msg: string;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', password: '', companyName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await register(form);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.errors) {
          const map: Record<string, string> = {};
          err.response.data.errors.forEach((fe: FieldError) => {
            map[fe.path] = fe.msg;
          });
          setFieldErrors(map);
        } else {
          setError(err.response?.data?.error || 'Registration failed.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fe = (f: string) => fieldErrors[f] || '';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-mark">G</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>GenuAI</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Technologies</div>
          </div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Set up your company workspace on GenuAI</p>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-first-name">First name <span className="required">*</span></label>
              <input id="reg-first-name" type="text" className={`form-input${fe('firstName') ? ' error' : ''}`}
                placeholder="John" value={form.firstName} onChange={set('firstName')} required />
              {fe('firstName') && <div className="form-error"><AlertCircle size={11} /> {fe('firstName')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-last-name">Last name <span className="required">*</span></label>
              <input id="reg-last-name" type="text" className={`form-input${fe('lastName') ? ' error' : ''}`}
                placeholder="Doe" value={form.lastName} onChange={set('lastName')} required />
              {fe('lastName') && <div className="form-error"><AlertCircle size={11} /> {fe('lastName')}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-company">Company name <span className="required">*</span></label>
            <input id="reg-company" type="text" className={`form-input${fe('companyName') ? ' error' : ''}`}
              placeholder="Acme Technologies" value={form.companyName} onChange={set('companyName')} required />
            {fe('companyName') && <div className="form-error"><AlertCircle size={11} /> {fe('companyName')}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Work email <span className="required">*</span></label>
            <input id="reg-email" type="email" className={`form-input${fe('email') ? ' error' : ''}`}
              placeholder="you@company.com" value={form.email} onChange={set('email')} required autoComplete="email" />
            {fe('email') && <div className="form-error"><AlertCircle size={11} /> {fe('email')}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input id="reg-password" type={showPassword ? 'text' : 'password'}
                className={`form-input${fe('password') ? ' error' : ''}`}
                placeholder="At least 8 characters"
                value={form.password} onChange={set('password')} required
                style={{ paddingRight: 40 }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fe('password') && <div className="form-error"><AlertCircle size={11} /> {fe('password')}</div>}
            <div className="form-hint">Minimum 8 characters</div>
          </div>

          <button id="register-submit" type="submit" className="btn btn-primary w-full" style={{ marginTop: 4, justifyContent: 'center' }} disabled={isLoading}>
            {isLoading ? <><Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> Creating account...</> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
