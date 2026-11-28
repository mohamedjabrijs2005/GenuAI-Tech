'use client';

import { useState, useEffect } from 'react';
import { Building2, Globe, MapPin, Users, Mail, Phone, Edit2, CheckCircle, Clock, XCircle, Shield, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CompanyProfilePage() {
  const { company, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    description: '',
    website: '',
    location: '',
    size: '',
    officialEmail: '',
    phone: '',
    hiringContactName: '',
    hiringContactEmail: '',
    verificationStatus: 'PENDING_VERIFICATION',
  });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    api.get('/company/profile')
      .then(res => {
        if (!active) return;
        const c = res.data?.company;
        if (c) {
          setForm({
            name: c.name || company?.name || '',
            industry: c.industry || '',
            description: c.description || '',
            website: c.website || '',
            location: c.location || '',
            size: c.size || '',
            officialEmail: c.official_email || user?.email || '',
            phone: c.hiring_contact_phone || '',
            hiringContactName: c.hiring_contact_name || (user ? `${user.firstName} ${user.lastName}`.trim() : ''),
            hiringContactEmail: c.hiring_contact_email || user?.email || '',
            verificationStatus: (c.verification_status || company?.verificationStatus || 'PENDING_VERIFICATION').toUpperCase(),
          });
        }
      })
      .catch(err => {
        if (!active) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setLoadError('You do not have permission to view this company profile.');
        } else {
          setLoadError('Unable to load company profile. Please try again.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [company, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/company/profile', {
        name: form.name,
        industry: form.industry,
        description: form.description,
        website: form.website,
        location: form.location,
        size: form.size,
        officialEmail: form.officialEmail,
        hiringContactName: form.hiringContactName,
        hiringContactEmail: form.hiringContactEmail,
        hiringContactPhone: form.phone,
      });

      setEditing(false);
      toast.success('Company Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isVerified = form.verificationStatus === 'APPROVED' || form.verificationStatus === 'VERIFIED';

  return (
    <div className="page-content">
      {/* Page Header with Single Clear Action */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Company</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Profile</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Corporate Workspace Profile
            </h1>
            <p className="page-subtitle">Manage corporate identity, verified credentials, and recruitment contact points.</p>
          </div>
          <button
            className={`btn ${editing ? 'btn-secondary' : 'btn-gold'}`}
            onClick={() => setEditing(!editing)}
          >
            <Edit2 size={15} />
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Verification Trust Banner */}
      {loadError && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', marginBottom: 20, padding: '14px 18px', color: 'var(--danger)', fontSize: 13 }}>
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading company profile...
        </div>
      ) : (
      <>
      <div
        className="card flex-mobile-col"
        style={{
          borderLeft: `4px solid ${isVerified ? 'var(--success)' : 'var(--warning)'}`,
          marginBottom: 24,
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md" style={{ background: isVerified ? '#dcfce7' : '#fef3c7', color: isVerified ? '#059669' : '#b45309' }}>
            {isVerified ? <CheckCircle size={22} /> : <Clock size={22} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {isVerified ? 'Verified Enterprise Workspace' : 'Verification Status: ' + form.verificationStatus.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {isVerified
                ? 'Your organization is verified for structured competency evaluations and transparent candidate assessment.'
                : 'Your organization verification is reviewed by platform governance before public vacancy publishing.'}
            </div>
          </div>
        </div>
        <span className={`badge ${isVerified ? 'badge-green' : 'badge-warning'}`}>
          {form.verificationStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Profile Form / Display Grid */}
      <form onSubmit={handleSave} className="grid-3 grid-mobile-1" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Left: Organization Overview */}
        <div className="card" style={{ padding: 24, gridColumn: 'span 2' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Organization Details</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                disabled={!editing}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="grid-2 grid-mobile-1" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Industry &amp; Domain</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={form.industry}
                  onChange={e => setForm({ ...form, industry: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Size</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={form.size}
                  onChange={e => setForm({ ...form, size: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Bio &amp; Mission</label>
              <textarea
                rows={4}
                disabled={!editing}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="form-input"
              />
            </div>

            {editing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn btn-gold" disabled={isSaving}>
                  <Save size={15} />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Contact & Verification Meta */}
        <div className="card" style={{ padding: 20, gridColumn: 'span 1' }}>
          <div className="card-title" style={{ fontSize: 14, marginBottom: 14 }}>Recruitment Contact Points</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5 }}>
            <div className="form-group">
              <label className="form-label">Location / HQ</label>
              <input
                type="text"
                disabled={!editing}
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="text"
                disabled={!editing}
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hiring Lead Name</label>
              <input
                type="text"
                disabled={!editing}
                value={form.hiringContactName}
                onChange={e => setForm({ ...form, hiringContactName: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Recruiting Email</label>
              <input
                type="email"
                disabled={!editing}
                value={form.hiringContactEmail}
                onChange={e => setForm({ ...form, hiringContactEmail: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </form>
      </>
      )}
    </div>
  );
}
