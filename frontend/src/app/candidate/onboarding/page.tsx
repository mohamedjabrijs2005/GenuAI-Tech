'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, MapPin, Phone, Briefcase, GraduationCap,
  Globe, Link2, Code, ArrowRight, CheckCircle2, FileText,
  Upload, Sparkles, ChevronRight, Shield, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const WORK_MODE_OPTIONS = ['Flexible', 'Remote', 'Hybrid', 'On-site'];
const AVAILABILITY_OPTIONS = ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months', 'Not actively looking'];
const POPULAR_SKILLS = ['JavaScript', 'TypeScript', 'React', 'Python', 'Java', 'Node.js', 'SQL', 'Docker', 'AWS', 'Go'];

export default function CandidateOnboardingPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    phone: '',
    location: '',
    workMode: 'Flexible',
    availability: 'Immediate',
    degree: '',
    institution: '',
    graduationYear: '',
    experienceSummary: '',
    skillInput: '',
    skills: [] as string[],
    githubUrl: '',
    portfolioUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
  });

  // Pre-load if existing profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem('genuai_candidate_profile');
      if (raw) {
        const p = JSON.parse(raw);
        setForm(prev => ({
          ...prev,
          phone: p.phone || '',
          location: p.location || '',
          degree: p.education?.[0]?.degree || '',
          institution: p.education?.[0]?.institution || '',
          graduationYear: p.education?.[0]?.year || '',
          experienceSummary: p.experience_summary || p.experienceSummary || '',
          skills: p.general_skills || p.generalSkills || [],
          githubUrl: p.github_url || p.githubUrl || '',
          portfolioUrl: p.portfolio_url || p.portfolioUrl || '',
          linkedinUrl: p.linkedin_url || p.linkedinUrl || '',
          workMode: p.work_preferences?.workMode || p.workPreferences?.workMode || 'Flexible',
          availability: p.work_preferences?.availability || p.workPreferences?.availability || 'Immediate',
          resumeUrl: p.resume_url || p.resumeUrl || '',
        }));
      }
    } catch {}
  }, []);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const addSkill = (val?: string) => {
    const s = (val || form.skillInput).trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: '' }));
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleFinish = async (skipOptional = false) => {
    setSaving(true);
    const userId = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('genuai_user') || '{}');
        return u?.id || 'default';
      } catch {
        return 'default';
      }
    })();

    const profilePayload = {
      phone: form.phone || (skipOptional ? '' : '—'),
      location: form.location || (skipOptional ? 'Open to Remote' : ''),
      degree: form.degree,
      institution: form.institution,
      graduationYear: form.graduationYear,
      education: form.degree ? [{ degree: form.degree, institution: form.institution, year: form.graduationYear }] : [],
      experienceSummary: form.experienceSummary,
      experience_summary: form.experienceSummary,
      generalSkills: form.skills,
      general_skills: form.skills,
      githubUrl: form.githubUrl,
      github_url: form.githubUrl,
      portfolioUrl: form.portfolioUrl,
      portfolio_url: form.portfolioUrl,
      linkedinUrl: form.linkedinUrl,
      linkedin_url: form.linkedinUrl,
      resumeUrl: form.resumeUrl,
      resume_url: form.resumeUrl,
      workPreferences: { workMode: form.workMode, availability: form.availability },
      work_preferences: { workMode: form.workMode, availability: form.availability },
    };

    try {
      localStorage.setItem('genuai_candidate_profile', JSON.stringify(profilePayload));
      localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
    } catch {}

    try {
      await api.put('/candidate-portal/profile', profilePayload).catch(() => null);
    } catch {}

    try {
      await refreshAuth().catch(() => null);
    } catch {}

    toast.success('Onboarding complete! Welcome to your candidate workspace.');
    router.push('/candidate');
    setSaving(false);
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
      padding: '32px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
            <div className="sidebar-logo-text gold-gradient-text" style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              GenuAI Technologies
            </div>
            <span style={{ fontSize: 10, color: '#854d0e', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', marginTop: 2 }}>
              Candidate Progressive Profiling
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            {step === 1 && 'Step 1: Basic Profile'}
            {step === 2 && 'Step 2: Education & Experience'}
            {step === 3 && 'Step 3: Skills, Portfolio & Optional Resume'}
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
            {step === 1 && 'Add your location and work preferences to discover matching verified opportunities.'}
            {step === 2 && 'Highlight your education history and background for recruiter visibility.'}
            {step === 3 && 'Add your verified skills, portfolio links, and optional resume. Skip any non-essential fields.'}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          {[
            { num: 1, label: 'Basic Profile' },
            { num: 2, label: 'Education & Experience' },
            { num: 3, label: 'Skills & Portfolio' },
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
              {idx < 2 && <div style={{ width: 28, height: 2, background: step > s.num ? '#b8860b' : '#e2e8f0' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '32px 30px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        }}>
          {/* ================= STEP 1: BASIC PROFILE ================= */}
          {step === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Current Location / City
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="e.g. Bengaluru, India or London, UK"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Phone size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Phone Number (Optional)
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Work Mode Preference</label>
                  <select
                    value={form.workMode}
                    onChange={e => set('workMode', e.target.value)}
                    style={inputStyle}
                  >
                    {WORK_MODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Availability</label>
                  <select
                    value={form.availability}
                    onChange={e => set('availability', e.target.value)}
                    style={inputStyle}
                  >
                    {AVAILABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
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
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    padding: '11px 22px',
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

          {/* ================= STEP 2: EDUCATION & EXPERIENCE ================= */}
          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <GraduationCap size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    Highest Degree / Field of Study (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.degree}
                    onChange={e => set('degree', e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Institution / University (Optional)</label>
                  <input
                    type="text"
                    value={form.institution}
                    onChange={e => set('institution', e.target.value)}
                    placeholder="e.g. National Institute of Technology"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Graduation Year (Optional)</label>
                <input
                  type="text"
                  value={form.graduationYear}
                  onChange={e => set('graduationYear', e.target.value)}
                  placeholder="e.g. 2024"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  <Briefcase size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                  Experience Summary (Optional)
                </label>
                <textarea
                  value={form.experienceSummary}
                  onChange={e => set('experienceSummary', e.target.value)}
                  placeholder="e.g. 4+ years developing scalable backend APIs with Java, Go, and PostgreSQL..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
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
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      padding: '11px 22px',
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
            </div>
          )}

          {/* ================= STEP 3: SKILLS, PORTFOLIO & OPTIONAL RESUME ================= */}
          {step === 3 && (
            <div>
              {/* Skills Section */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  <Code size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                  Technical & Domain Skills (Optional)
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={form.skillInput}
                    onChange={e => set('skillInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g. React, Docker, Python..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => addSkill()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Popular Skill chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4, alignSelf: 'center' }}>Suggestions:</span>
                  {POPULAR_SKILLS.filter(s => !form.skills.includes(s)).slice(0, 5).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px dashed #cbd5e1',
                        background: '#f8fafc',
                        fontSize: 11.5,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      + {skill}
                    </button>
                  ))}
                </div>

                {/* Selected Skills */}
                {form.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    {form.skills.map(s => (
                      <span
                        key={s}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 99,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#0f172a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            fontSize: 14,
                            lineHeight: 1,
                            padding: 0,
                          }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio & Profiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <Globe size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    GitHub Profile (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={e => set('githubUrl', e.target.value)}
                    placeholder="https://github.com/username"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Link2 size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                    LinkedIn Profile (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={e => set('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  <Globe size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                  Portfolio / Personal Website (Optional)
                </label>
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={e => set('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.dev"
                  style={inputStyle}
                />
              </div>

              {/* Resume Document URL */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  <FileText size={13} style={{ display: 'inline', marginRight: 4, color: '#b8860b' }} />
                  Resume Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.resumeUrl}
                  onChange={e => set('resumeUrl', e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or Dropbox link"
                  style={inputStyle}
                />
                <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  Ensure sharing permissions are set to viewable by anyone with the link.
                </span>
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
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleFinish(true)}
                    disabled={saving}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    disabled={saving}
                    style={{
                      padding: '11px 24px',
                      borderRadius: 9,
                      background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                      color: '#ffffff',
                      fontSize: 13.5,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
                    }}
                  >
                    <span>{saving ? 'Completing...' : 'Finish & Go to Workspace'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
