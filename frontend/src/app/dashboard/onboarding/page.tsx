'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Globe, MapPin, Users, Mail, Phone, Briefcase,
  ArrowRight, CheckCircle2, FileText, Shield, ShieldCheck,
  AlertCircle, Lock, Sparkles
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const INDUSTRY_OPTIONS = [
  'Technology & Software',
  'Finance & Banking',
  'Healthcare & Life Sciences',
  'Education & EdTech',
  'Manufacturing & Robotics',
  'Retail & E-Commerce',
  'Logistics & Supply Chain',
  'Media & Design',
  'Consulting & Professional Services',
  'Government & Public Sector',
  'Energy & Utilities',
  'Other',
];

const SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'];

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    legalName: '',
    website: '',
    industry: '',
    location: '',
    size: '11–50',
    description: '',
    officialEmail: '',
    phone: '',
    hiringContactName: '',
    hiringContactEmail: '',
    hiringContactRole: 'Talent Acquisition Lead',
    isAuthorizedRepresentative: false,
    registrationNumber: '',
    verificationDocumentUrl: '',
    agreedVerificationPolicy: true,
  });

  // Prepopulate company name from auth if available
  useEffect(() => {
    try {
      const storedComp = localStorage.getItem('genuai_company');
      const storedUser = localStorage.getItem('genuai_user');
      if (storedComp) {
        const c = JSON.parse(storedComp);
        if (c?.name) {
          setForm(prev => ({
            ...prev,
            companyName: c.name,
            legalName: c.name,
          }));
        }
      }
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.email) {
          setForm(prev => ({
            ...prev,
            officialEmail: u.email,
            hiringContactEmail: u.email,
            hiringContactName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          }));
        }
      }
    } catch {}
  }, []);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmitVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.isAuthorizedRepresentative) {
      toast.error('Please confirm authorization to represent this organization in Step 2.');
      setStep(2);
      return;
    }
    setSaving(true);

    const payload = {
      name: form.companyName,
      legalName: form.legalName || form.companyName,
      industry: form.industry,
      description: form.description,
      website: form.website,
      location: form.location,
      size: form.size,
      officialEmail: form.officialEmail,
      hiringContactName: form.hiringContactName,
      hiringContactEmail: form.hiringContactEmail,
      hiringContactPhone: form.phone,
      hiringContactRole: form.hiringContactRole,
      registrationNumber: form.registrationNumber,
      verificationDocumentUrl: form.verificationDocumentUrl,
      verificationStatus: 'PENDING_VERIFICATION',
    };

    try {
      // 1. Save company profile details
      await api.patch('/company/profile', payload).catch(() => null);
      // 2. Mark onboarding as submitted in database
      await api.post('/company/submit-onboarding').catch(() => null);

      // 3. Update localStorage cache
      try {
        const u = JSON.parse(localStorage.getItem('genuai_user') || '{}');
        if (u?.id) {
          localStorage.setItem(`genuai_onboarding_done_${u.id}`, 'true');
        }
        localStorage.setItem('genuai_company_profile', JSON.stringify(payload));
        const existingComp = localStorage.getItem('genuai_company');
        if (existingComp) {
          const parsed = JSON.parse(existingComp);
          parsed.verificationStatus = 'PENDING_VERIFICATION';
          parsed.name = form.companyName;
          parsed.onboardingSubmitted = true;
          localStorage.setItem('genuai_company', JSON.stringify(parsed));
        }
      } catch {}

      // 4. Refresh auth state so DashboardLayout unblocks
      await refreshAuth().catch(() => null);

      toast.success('Onboarding submitted for Admin Review! Welcome to your dashboard.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding submit error:', err);
      toast.error('Failed to submit onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 13.5,
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '36px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
            <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              GenuAI Technologies
            </div>
            <span style={{ fontSize: 10, color: '#854d0e', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginTop: 2 }}>
              Enterprise Compliance Setup
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            {step === 1 && 'Step 1: Company Profile'}
            {step === 2 && 'Step 2: Authorized Contact & Governance'}
            {step === 3 && 'Step 3: Official Verification Details & Documents'}
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
            {step === 1 && 'Establish your organization details for company vacancy listings.'}
            {step === 2 && 'Designate the official contact authorized to represent this workspace.'}
            {step === 3 && 'Submit corporate verification details & documents for platform admin review.'}
          </p>
        </div>

        {/* Step Progress Bar (3-Step Flow) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          {[
            { num: 1, label: 'Company Profile' },
            { num: 2, label: 'Authorized Contact' },
            { num: 3, label: 'Verification & Docs' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: step >= s.num ? '#0f172a' : '#e2e8f0',
                  color: step >= s.num ? '#ffffff' : '#64748b',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {step > s.num ? <CheckCircle2 size={15} /> : s.num}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: step === s.num ? 800 : 600,
                  color: step === s.num ? '#0f172a' : '#94a3b8',
                }}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && <div style={{ width: 36, height: 2, background: step > s.num ? '#b8860b' : '#e2e8f0' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '32px 30px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        }}>
          {/* ================= STEP 1: COMPANY PROFILE ================= */}
          {step === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <Building2 size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Workspace Display Name *
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    placeholder="e.g. Acme Technologies"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Legal Entity Name</label>
                  <input
                    type="text"
                    value={form.legalName}
                    onChange={e => set('legalName', e.target.value)}
                    placeholder="e.g. Acme Tech Solutions Ltd."
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Industry Sector *</label>
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
                  <select
                    value={form.size}
                    onChange={e => set('size', e.target.value)}
                    style={inputStyle}
                  >
                    {SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} employees</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <Globe size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Corporate Website
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://acme.com"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Headquarters / Office Location *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="e.g. Bengaluru, India or New York, USA"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  <FileText size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                  Company Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Provide an overview of your organization's mission, engineering domains, and work environment..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.companyName.trim()) {
                      toast.error('Company Name is required.');
                      return;
                    }
                    if (!form.industry) {
                      toast.error('Please select an industry.');
                      return;
                    }
                    if (!form.location.trim()) {
                      toast.error('Location is required.');
                      return;
                    }
                    setStep(2);
                  }}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: AUTHORIZED CONTACT ================= */}
          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Authorized Contact Name *</label>
                  <input
                    type="text"
                    value={form.hiringContactName}
                    onChange={e => set('hiringContactName', e.target.value)}
                    placeholder="e.g. John Doe"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Designation / Role in Company *</label>
                  <input
                    type="text"
                    value={form.hiringContactRole}
                    onChange={e => set('hiringContactRole', e.target.value)}
                    placeholder="e.g. Head of Talent Acquisition"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <Mail size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Official Work Email *
                  </label>
                  <input
                    type="email"
                    value={form.officialEmail}
                    onChange={e => set('officialEmail', e.target.value)}
                    placeholder="john@acme.com"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Phone size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Legal Authorization Checkbox */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '16px',
                marginBottom: 24,
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={form.isAuthorizedRepresentative}
                    onChange={e => set('isAuthorizedRepresentative', e.target.checked)}
                    style={{ marginTop: 3, accentColor: '#b8860b' }}
                  />
                  <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>
                    <strong style={{ color: '#0f172a' }}>Authorization Confirmation:</strong> I confirm that I am authorized to represent <strong>{form.companyName || 'this company'}</strong>, publish vacancies, evaluate candidate work samples, and conduct recruitment processes on GenuAI.
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.hiringContactName.trim()) {
                      toast.error('Contact Name is required.');
                      return;
                    }
                    if (!form.officialEmail.trim()) {
                      toast.error('Official Email is required.');
                      return;
                    }
                    if (!form.isAuthorizedRepresentative) {
                      toast.error('Please confirm you are authorized to represent the company.');
                      return;
                    }
                    setStep(3);
                  }}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: OFFICIAL VERIFICATION DETAILS & DOCUMENTS ================= */}
          {step === 3 && (
            <div>
              {/* Privacy & Purpose Explanation */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '16px',
                marginBottom: 20,
                display: 'flex',
                gap: 12,
              }}>
                <ShieldCheck size={22} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    Why GenuAI Verifies Companies
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    Platform governance requires corporate verification prior to public vacancy publishing. This eliminates ghost jobs, fraudulent solicitations, and protects candidates' work submissions. Only platform compliance administrators review these details.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  Corporate Registration Number / Tax ID / CIN (Optional)
                </label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={e => set('registrationNumber', e.target.value)}
                  placeholder="e.g. U72200KA2020PTC123456 or EIN / Business Reg ID"
                  style={inputStyle}
                />
                <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  Official government or state business registry identifier.
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Official Verification Document URL / Certificate Link (Optional)
                </label>
                <input
                  type="url"
                  value={form.verificationDocumentUrl}
                  onChange={e => set('verificationDocumentUrl', e.target.value)}
                  placeholder="https://drive.google.com/... or company registration certificate URL"
                  style={inputStyle}
                />
                <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  Link to Certificate of Incorporation, GST/Tax document, or corporate domain record.
                </span>
              </div>

              {/* Notice of Admin Review */}
              <div style={{
                background: 'rgba(184, 134, 11, 0.06)',
                border: '1px solid rgba(184, 134, 11, 0.25)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
                display: 'flex',
                gap: 10,
              }}>
                <Sparkles size={18} style={{ color: '#b8860b', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12.5, color: '#854d0e', lineHeight: 1.5 }}>
                  <strong>Next Step: Submitting to Admin Review:</strong> Your organization will be submitted for platform verification. You will be routed immediately to your company workspace to prepare vacancies, rubrics, and departments.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitVerification()}
                  disabled={saving}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
                  }}
                >
                  <span>{saving ? 'Submitting...' : 'Submit to Admin Review & Open Dashboard'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
