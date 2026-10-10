'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Code,
  Globe,
  Link2,
  Shield,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Lock,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [completion, setCompletion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');

  // Array states
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [education, setEducation] = useState<any[]>([]);
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [workPreferences, setWorkPreferences] = useState({
    workMode: 'Flexible',
    availability: 'Immediate',
    relocation: 'Open to discussion',
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get('/candidate-portal/profile')
      .then((res) => {
        if (!isMounted) return;
        const p = res.data?.profile || {};
        setProfile(p);
        setCompletion(res.data?.completion);

        setFirstName(p.first_name || user?.firstName || '');
        setLastName(p.last_name || user?.lastName || '');
        setPhone(p.phone && p.phone !== '—' ? p.phone : '');
        setLocation(p.location && p.location !== 'Global' ? p.location : '');
        setResumeUrl(p.resume_url || '');
        setExperienceSummary(p.experience_summary || '');
        setGithubUrl(p.github_url || '');
        setPortfolioUrl(p.portfolio_url || '');
        setLinkedinUrl(p.linkedin_url || '');
        setAccessibilityNeeds(p.accessibility_needs || '');

        setSkills(Array.isArray(p.general_skills) ? p.general_skills : ['Java', 'SQL', 'TypeScript']);
        setEducation(
          Array.isArray(p.education) && p.education.length > 0
            ? p.education
            : [{ degree: 'B.S. Computer Science', institution: 'State University', year: '2024' }]
        );
        setEmploymentHistory(
          Array.isArray(p.employment_history) && p.employment_history.length > 0
            ? p.employment_history
            : [{ role: 'Software Engineer Intern', company: 'Tech Corp', duration: '2023 - 2024', description: 'Built backend REST services.' }]
        );
        setLanguages(Array.isArray(p.languages) && p.languages.length > 0 ? p.languages : ['English']);
        if (p.work_preferences && typeof p.work_preferences === 'object') {
          setWorkPreferences({ ...workPreferences, ...p.work_preferences });
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      const res = await api.put('/candidate-portal/profile', {
        firstName,
        lastName,
        phone,
        location,
        resumeUrl,
        education,
        generalSkills: skills,
        experienceSummary,
        employmentHistory,
        githubUrl,
        portfolioUrl,
        linkedinUrl,
        languages,
        workPreferences,
        accessibilityNeeds,
      });

      setProfile(res.data.profile);
      setCompletion(res.data.completion);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddEducation = () => {
    setEducation([...education, { degree: '', institution: '', year: '' }]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleAddEmployment = () => {
    setEmploymentHistory([...employmentHistory, { role: '', company: '', duration: '', description: '' }]);
  };

  const handleRemoveEmployment = (index: number) => {
    setEmploymentHistory(employmentHistory.filter((_, i) => i !== index));
  };

  const handleEmploymentChange = (index: number, field: string, value: string) => {
    const updated = [...employmentHistory];
    updated[index] = { ...updated[index], [field]: value };
    setEmploymentHistory(updated);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Global Candidate Profile...</div>
        </div>
      </div>
    );
  }

  const completionPct = completion?.percentage || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'rgba(212, 175, 55, 0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fef08a',
                  textTransform: 'uppercase',
                }}
              >
                Global Candidate Profile
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
              {firstName} {lastName}
            </h1>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 600 }}>
              This is your reusable candidate background. It provides foundational details across all targets, while
              target-specific evidence is submitted per vacancy requirement.
            </p>
          </div>

          {/* Profile Completion Checklist */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: '16px 20px',
              minWidth: 260,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Profile Completion</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fef08a' }}>{completionPct}%</span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 99,
                background: 'rgba(255, 255, 255, 0.15)',
                overflow: 'hidden',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, #d4af37, #fde047)',
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            {completion?.missingItems && completion.missingItems.length > 0 ? (
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                <span style={{ fontWeight: 600 }}>Optional items to complete:</span>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {completion.missingItems.slice(0, 3).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} />
                <span>All core profile checklist items completed!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Important Separation Notice */}
      <div
        style={{
          padding: '14px 18px',
          background: '#f0fdf4',
          borderRadius: 10,
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12.5,
          color: '#166534',
        }}
      >
        <Shield size={18} style={{ flexShrink: 0, color: '#16a34a' }} />
        <div>
          <strong>Important Architecture Separation:</strong> Your Global Profile holds resume, education, and general experience. Projects, work samples, certificates, and specialized evidence are submitted inside each individual <strong>Target Workspace</strong> against exact vacancy requirements.
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {saveSuccess && (
          <div
            style={{
              padding: '12px 16px',
              background: '#ecfdf5',
              borderRadius: 8,
              border: '1px solid #6ee7b7',
              color: '#065f46',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>Profile updated successfully and synchronized to your recruitment workspace.</span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              borderRadius: 8,
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <span>Personal & Contact Information</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                First Name
              </label>
              <input
                type="text"
                className="input-field"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Last Name
              </label>
              <input
                type="text"
                className="input-field"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  value={profile?.email || user?.email || ''}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                />
                <Lock size={14} style={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }} />
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Email changes require security verification in Settings.</span>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Phone Number
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Location / Timezone
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. San Francisco, CA (UTC-8)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Resume / CV URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://example.com/my-resume.pdf"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Online Presence & Links */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} style={{ color: 'var(--primary)' }} />
            <span>Links & Professional Profiles</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                GitHub Profile URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Portfolio / Website URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://myportfolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: General Skills Checklist */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code size={18} style={{ color: 'var(--primary)' }} />
            <span>General Skills Checklist</span>
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>
            List your foundational technical and domain skills. When you create targets, you can link specific proof to each role requirement.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Python, Docker, PostgreSQL"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              style={{ maxWidth: 300 }}
            />
            <button type="button" onClick={handleAddSkill} className="btn btn-secondary" style={{ fontSize: 12 }}>
              <Plus size={14} />
              <span>Add Skill</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((skill) => (
              <span
                key={skill}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                  title="Remove skill"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Section 4: Experience Summary & Employment History */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} style={{ color: 'var(--primary)' }} />
            <span>Experience Summary & History</span>
          </h2>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Executive Summary
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Summarize your engineering background, key technical strengths, and architectural interests..."
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Employment History</span>
            <button type="button" onClick={handleAddEmployment} className="btn btn-secondary" style={{ fontSize: 11.5, padding: '4px 10px' }}>
              <Plus size={13} />
              <span>Add Position</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {employmentHistory.map((job, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: 8,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRemoveEmployment(idx)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                  title="Remove position"
                >
                  <Trash2 size={15} />
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Role Title</label>
                    <input
                      type="text"
                      className="input-field"
                      value={job.role || ''}
                      onChange={(e) => handleEmploymentChange(idx, 'role', e.target.value)}
                      placeholder="e.g. Backend Engineer"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Company Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={job.company || ''}
                      onChange={(e) => handleEmploymentChange(idx, 'company', e.target.value)}
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Duration</label>
                    <input
                      type="text"
                      className="input-field"
                      value={job.duration || ''}
                      onChange={(e) => handleEmploymentChange(idx, 'duration', e.target.value)}
                      placeholder="e.g. 2022 - Present"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Key Responsibilities / Impact</label>
                  <input
                    type="text"
                    className="input-field"
                    value={job.description || ''}
                    onChange={(e) => handleEmploymentChange(idx, 'description', e.target.value)}
                    placeholder="e.g. Designed data pipelines processing 10M events daily."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Education */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
              <span>Education & Academic Background</span>
            </h2>
            <button type="button" onClick={handleAddEducation} className="btn btn-secondary" style={{ fontSize: 11.5, padding: '4px 10px' }}>
              <Plus size={13} />
              <span>Add Education</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {education.map((edu, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: 8,
                  background: '#fafaf9',
                  border: '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(idx)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                  title="Remove education"
                >
                  <Trash2 size={15} />
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Degree / Certificate</label>
                    <input
                      type="text"
                      className="input-field"
                      value={edu.degree || ''}
                      onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                      placeholder="e.g. B.S. Computer Science"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Institution</label>
                    <input
                      type="text"
                      className="input-field"
                      value={edu.institution || ''}
                      onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                      placeholder="e.g. University of California"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Graduation Year</label>
                    <input
                      type="text"
                      className="input-field"
                      value={edu.year || ''}
                      onChange={(e) => handleEducationChange(idx, 'year', e.target.value)}
                      placeholder="e.g. 2024"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Accessibility & Accommodation Request Channel */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Accessibility size={18} style={{ color: 'var(--primary)' }} />
            <span>Accessibility & Accommodation Channel</span>
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>
            We support inclusive hiring. If you need assistive software, time adjustments for assessments, or alternative interview formats, let us know here.
          </p>
          <textarea
            className="input-field"
            rows={2}
            placeholder="e.g. Request 1.5x time extension for online coding sessions, or screen reader compatible assessments."
            value={accessibilityNeeds}
            onChange={(e) => setAccessibilityNeeds(e.target.value)}
          />
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Link href="/candidate" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140, justifyContent: 'center' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
