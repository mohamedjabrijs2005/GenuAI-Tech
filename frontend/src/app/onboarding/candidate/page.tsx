'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, MapPin, Phone, Briefcase, GraduationCap,
  Globe, Link2, Code, ArrowRight, CheckCircle2, FileText
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const WORK_MODE_OPTIONS = ['On-site', 'Remote', 'Hybrid', 'Flexible'];
const AVAILABILITY_OPTIONS = ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months', 'Not actively looking'];

export default function CandidateOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    phone: '',
    location: '',
    resumeUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    linkedinUrl: '',
    experienceSummary: '',
    skillInput: '',
    skills: [] as string[],
    degree: '',
    institution: '',
    graduationYear: '',
    workMode: 'Flexible',
    availability: 'Immediate',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: '' }));
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const profileData = {
      phone: form.phone,
      location: form.location,
      resume_url: form.resumeUrl,
      github_url: form.githubUrl,
      portfolio_url: form.portfolioUrl,
      linkedin_url: form.linkedinUrl,
      experience_summary: form.experienceSummary,
      general_skills: form.skills,
      education: form.degree ? [{ degree: form.degree, institution: form.institution, year: form.graduationYear }] : [],
      work_preferences: { workMode: form.workMode, availability: form.availability },
    };
    try {
      localStorage.setItem('genuai_candidate_profile', JSON.stringify(profileData));
    } catch {}

    try {
      await api.patch('/candidate-portal/profile', {
        phone: form.phone,
        location: form.location,
        resume_url: form.resumeUrl,
        github_url: form.githubUrl,
        portfolio_url: form.portfolioUrl,
        linkedin_url: form.linkedinUrl,
        experience_summary: form.experienceSummary,
        general_skills: form.skills,
        education: form.degree ? [{ degree: form.degree, institution: form.institution, year: form.graduationYear }] : [],
        work_preferences: { workMode: form.workMode, availability: form.availability },
      }).catch(() => null);

      // Mark onboarding as complete for this user
      try {
        const storedUser = localStorage.getItem('genuai_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) localStorage.setItem(`genuai_onboarding_done_${u.id}`, 'true');
        }
      } catch {}

      toast.success('Profile set up successfully!');
      router.push('/candidate');
    } catch {
      // Even if API fails, mark onboarding done and proceed
      try {
        const storedUser = localStorage.getItem('genuai_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) localStorage.setItem(`genuai_onboarding_done_${u.id}`, 'true');
        }
      } catch {}
      toast.success('Profile set up successfully!');
      router.push('/candidate');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a',
    background: '#ffffff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 5, display: 'block',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '24px',
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
                Candidate Workspace Setup
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Complete your candidate profile
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            This information is shown in your profile and helps recruiters review your application context.
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? '#0f172a' : '#e2e8f0',
                color: step >= s ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
              }}>{step > s ? <CheckCircle2 size={14} /> : s}</div>
              {s < 3 && <div style={{ width: 40, height: 2, background: step > s ? '#b8860b' : '#e2e8f0', borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 24px rgba(15,23,42,0.06)', padding: 32,
        }}>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} style={{ color: '#b8860b' }} /> Personal & Contact Info
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Phone Number</label>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Location</label>
                    <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, State" style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}><FileText size={13} style={{ display: 'inline', marginRight: 4 }} />Resume / CV URL</label>
                  <input type="url" value={form.resumeUrl} onChange={e => set('resumeUrl', e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}><Link2 size={13} style={{ display: 'inline', marginRight: 4 }} />LinkedIn Profile</label>
                  <input type="url" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/yourname" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}><Globe size={13} style={{ display: 'inline', marginRight: 4 }} />GitHub</label>
                    <input type="url" value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}><Globe size={13} style={{ display: 'inline', marginRight: 4 }} />Portfolio URL</label>
                    <input type="url" value={form.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)} placeholder="https://yoursite.com" style={inputStyle} />
                  </div>
                </div>

                <button type="button" onClick={() => setStep(2)} style={{
                  width: '100%', padding: '12px 20px', borderRadius: 9,
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>Continue <ArrowRight size={16} /></button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code size={18} style={{ color: '#b8860b' }} /> Skills & Experience
                </h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Skills (press Enter to add)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={form.skillInput}
                      onChange={e => set('skillInput', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="e.g. Java, Python, SQL..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button type="button" onClick={addSkill} style={{
                      padding: '10px 16px', borderRadius: 8, background: '#0f172a', color: '#fff',
                      border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>Add</button>
                  </div>
                  {form.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {form.skills.map(s => (
                        <span key={s} style={{
                          padding: '4px 10px', borderRadius: 99, background: '#f1f5f9',
                          border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {s}
                          <button type="button" onClick={() => removeSkill(s)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#94a3b8', fontWeight: 900, fontSize: 14, lineHeight: 1,
                          }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}><Briefcase size={13} style={{ display: 'inline', marginRight: 4 }} />Experience Summary</label>
                  <textarea
                    value={form.experienceSummary}
                    onChange={e => set('experienceSummary', e.target.value)}
                    placeholder="Brief overview of your professional background and key experience..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setStep(1)} style={{
                    flex: 1, padding: '12px', borderRadius: 9, background: '#f1f5f9', color: '#0f172a',
                    fontSize: 14, fontWeight: 700, border: '1px solid #cbd5e1', cursor: 'pointer',
                  }}>Back</button>
                  <button type="button" onClick={() => setStep(3)} style={{
                    flex: 2, padding: '12px 20px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>Continue <ArrowRight size={16} /></button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={18} style={{ color: '#b8860b' }} /> Education & Preferences
                </h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Degree / Qualification</label>
                  <input type="text" value={form.degree} onChange={e => set('degree', e.target.value)} placeholder="e.g. B.Tech Computer Science" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Institution</label>
                    <input type="text" value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="University name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Graduation Year</label>
                    <input type="text" value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)} placeholder="2024" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Work Mode Preference</label>
                    <select value={form.workMode} onChange={e => set('workMode', e.target.value)} style={inputStyle}>
                      {WORK_MODE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Availability</label>
                    <select value={form.availability} onChange={e => set('availability', e.target.value)} style={inputStyle}>
                      {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '12px 14px', marginBottom: 24, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                  Only the details you enter here appear in your candidate profile. You can update this anytime from Profile settings.
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setStep(2)} style={{
                    flex: 1, padding: '12px', borderRadius: 9, background: '#f1f5f9', color: '#0f172a',
                    fontSize: 14, fontWeight: 700, border: '1px solid #cbd5e1', cursor: 'pointer',
                  }}>Back</button>
                  <button type="submit" disabled={saving} style={{
                    flex: 2, padding: '12px 20px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                    color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: saving ? 0.7 : 1,
                  }}>
                    {saving ? 'Saving...' : <>Complete Profile &amp; Enter Dashboard <ArrowRight size={16} /></>}
                  </button>
                </div>

                <button type="button" onClick={() => router.push('/candidate')} style={{
                  width: '100%', marginTop: 12, padding: '10px', borderRadius: 8,
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8', fontWeight: 600,
                }}>
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
