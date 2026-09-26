'use client';

import { useState } from 'react';
import { Building2, Globe, MapPin, Users, Mail, Phone, Edit2, CheckCircle, Clock, XCircle, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK = {
  name: 'Acme Technologies Ltd.',
  logo: 'AT',
  industry: 'Enterprise Software & Artificial Intelligence',
  description: 'Acme Technologies builds enterprise software solutions for mid-market companies. We specialize in cloud infrastructure, data platforms, and AI-driven products.',
  website: 'https://acme.example.com',
  location: 'London, United Kingdom',
  size: '50-200 employees',
  email: 'hr@acme.example.com',
  phone: '+44 20 1234 5678',
  recruiter: 'Sarah Connor',
  verificationStatus: 'VERIFIED' as const,
};

const VERIFICATION_CONFIG = {
  VERIFIED: {
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: ShieldCheck,
    label: 'Verified Entity',
    desc: 'Your company is fully verified by GenuAI Technologies. All vacancies can be published immediately.',
  },
  UNDER_REVIEW: {
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: Clock,
    label: 'Under Review',
    desc: 'Your verification is being reviewed by GenuAI Technologies Compliance.',
  },
  UNVERIFIED: {
    color: '#64748b',
    bg: '#f1f5f9',
    border: '#e2e8f0',
    icon: XCircle,
    label: 'Unverified',
    desc: 'Submit your company details to begin verification with GenuAI Technologies.',
  },
};

export default function CompanyProfilePage() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(MOCK);
  const vc = VERIFICATION_CONFIG[form.verificationStatus];
  const VIcon = vc.icon;

  const handleSave = () => {
    setEditing(false);
    toast.success('Company Profile updated successfully!');
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Company</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Profile</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title flex items-center gap-3">
              Company Profile
              <span className="gold-badge">
                <Sparkles size={12} />
                GenuAI Technologies Partner
              </span>
            </h1>
            <p className="page-subtitle">Manage corporate identity, verified credentials, and recruiter contacts.</p>
          </div>
          <button className={`btn ${editing ? 'btn-secondary' : 'btn-gold'}`} onClick={() => setEditing(!editing)}>
            <Edit2 size={15} />
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Google Stitch Elevated Verification Banner */}
      <div
        className="verification-block"
        style={{
          borderLeft: `4px solid ${vc.color}`,
          background: '#ffffff',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="verification-icon"
          style={{
            background: `${vc.color}15`,
            color: vc.color,
            border: `1px solid ${vc.color}33`,
          }}
        >
          <VIcon size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="verification-label">GenuAI Technologies Verification Status</div>
          <div className="verification-status flex items-center gap-2" style={{ color: vc.color }}>
            <span>{vc.label}</span>
            <span className="gold-badge" style={{ fontSize: 10 }}>Official Certified</span>
          </div>
          <div className="verification-desc">{vc.desc}</div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column — Identity */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Corporate Identity</div>
              <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Logo & Gold Name */}
            <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
              <div className="gold-logo-box" style={{ width: 56, height: 56, borderRadius: 14, fontSize: 20 }}>
                {form.logo}
              </div>
              <div>
                <div className="gold-company-title" style={{ fontSize: 20 }}>{form.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{form.industry}</div>
              </div>
            </div>

            {editing ? (
              <>
                <div className="form-group">
                  <label className="form-label">Company Name <span className="required">*</span></label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry Domain</label>
                  <input className="form-input" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Overview</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {form.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Column — Details */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Verification & Contact Info</div>
            </div>
            {editing ? (
              <>
                <div className="form-group">
                  <label className="form-label">Official Website</label>
                  <input className="form-input" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">HQ Location</label>
                  <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Size</label>
                  <select className="form-select" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                    {['1-10', '11-50', '50-200', '200-1000', '1000+'].map(s => <option key={s}>{s} employees</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lead Recruiter</label>
                  <input className="form-input" value={form.recruiter} onChange={e => setForm(f => ({ ...f, recruiter: e.target.value }))} />
                </div>
                <button className="btn btn-gold w-full mt-2" onClick={handleSave}>
                  Save Profile Changes
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: Globe, label: 'Website', value: form.website },
                  { icon: MapPin, label: 'Location', value: form.location },
                  { icon: Users, label: 'Company Size', value: form.size },
                  { icon: Mail, label: 'Email', value: form.email },
                  { icon: Phone, label: 'Phone', value: form.phone },
                  { icon: Users, label: 'Lead Recruiter', value: form.recruiter },
                ].map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: '#f8fafc', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Icon size={15} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          {d.label}
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600 }}>
                          {d.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
