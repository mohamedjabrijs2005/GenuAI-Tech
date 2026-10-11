'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Globe, MapPin, Users, Mail, Phone, Briefcase,
  ArrowRight, CheckCircle2, FileText
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Manufacturing',
  'Retail & E-Commerce', 'Logistics & Supply Chain', 'Media & Entertainment',
  'Consulting', 'Government & Public Sector', 'Real Estate', 'Automotive',
  'Energy & Utilities', 'Telecommunications', 'Other',
];
const SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'];

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    industry: '',
    description: '',
    website: '',
    location: '',
    size: '',
    officialEmail: '',
    phone: '',
    hiringContactName: '',
    hiringContactEmail: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.industry || !form.location) {
      toast.error('Please fill in required fields.');
      return;
    }
    setSaving(true);
    const profileData = {
      industry: form.industry,
      description: form.description,
      website: form.website,
      location: form.location,
      size: form.size,
      officialEmail: form.officialEmail,
      phone: form.phone,
      hiringContactName: form.hiringContactName,
      hiringContactEmail: form.hiringContactEmail,
    };
    try {
      localStorage.setItem('genuai_company_profile', JSON.stringify(profileData));
    } catch {}

    try {
      await api.patch('/company/profile', {
        industry: form.industry,
        description: form.description,
        website: form.website,
        location: form.location,
        size: form.size,
        officialEmail: form.officialEmail,
        hiringContactName: form.hiringContactName,
        hiringContactEmail: form.hiringContactEmail,
        hiringContactPhone: form.phone,
      }).catch(() => null);

      // Mark onboarding as complete for this user
      try {
        const storedUser = localStorage.getItem('genuai_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) localStorage.setItem(`genuai_onboarding_done_${u.id}`, 'true');
        }
      } catch {}

      toast.success('Company profile set up successfully!');
      router.push('/dashboard');
    } catch {
      try {
        const storedUser = localStorage.getItem('genuai_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) localStorage.setItem(`genuai_onboarding_done_${u.id}`, 'true');
        }
      } catch {}
      toast.success('Company profile set up successfully!');
      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 5,
    display: 'block',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <div>
              <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                GenuAI Technologies
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 3 }}>
                Enterprise Suite Setup
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Set up your company workspace
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            This information appears in your company profile and helps candidates see verified vacancy context.
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? '#0f172a' : '#e2e8f0',
                color: step >= s ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
              }}>{s >= step && step <= s ? s : <CheckCircle2 size={14} />}</div>
              {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? '#b8860b' : '#e2e8f0', borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
          padding: 32,
        }}>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} style={{ color: '#b8860b' }} />
                  Company Details
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Industry *</label>
                    <select
                      value={form.industry}
                      onChange={e => set('industry', e.target.value)}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select industry</option>
                      {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Company Size</label>
                    <select value={form.size} onChange={e => set('size', e.target.value)} style={inputStyle}>
                      <option value="">Select size</option>
                      {SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} employees</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Location / Headquarters *</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="e.g. Bengaluru, Karnataka"
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}><Globe size={13} style={{ display: 'inline', marginRight: 4 }} />Company Website</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://yourcompany.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}><FileText size={13} style={{ display: 'inline', marginRight: 4 }} />Company Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Brief description of your company and what you do..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!form.industry || !form.location) {
                      toast.error('Industry and Location are required.');
                      return;
                    }
                    setStep(2);
                  }}
                  style={{
                    width: '100%', padding: '12px 20px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  Continue to Contact Details <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: '#b8860b' }} />
                  Hiring Contact & Communications
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Official Company Email</label>
                    <input
                      type="email"
                      value={form.officialEmail}
                      onChange={e => set('officialEmail', e.target.value)}
                      placeholder="hr@yourcompany.com"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Contact Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}><Briefcase size={13} style={{ display: 'inline', marginRight: 4 }} />Hiring Contact Name</label>
                  <input
                    type="text"
                    value={form.hiringContactName}
                    onChange={e => set('hiringContactName', e.target.value)}
                    placeholder="e.g. Priya Sharma (Talent Lead)"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />Hiring Contact Email</label>
                  <input
                    type="email"
                    value={form.hiringContactEmail}
                    onChange={e => set('hiringContactEmail', e.target.value)}
                    placeholder="priya@yourcompany.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '12px 14px', marginBottom: 24, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                  This information is used for your company profile and is visible to your workspace team. You can update it anytime from Company Profile settings.
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 9,
                      background: '#f1f5f9', color: '#0f172a',
                      fontSize: 14, fontWeight: 700, border: '1px solid #cbd5e1', cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 2, padding: '12px 20px', borderRadius: 9,
                      background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                      color: '#fff', fontSize: 14, fontWeight: 800,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Setting up...' : <>Complete Setup &amp; Enter Dashboard <ArrowRight size={16} /></>}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  style={{
                    width: '100%', marginTop: 12, padding: '10px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#94a3b8', fontWeight: 600,
                  }}
                >
                  Skip for now — I'll complete this later
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
