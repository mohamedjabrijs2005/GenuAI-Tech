'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VerificationBadge from '@/components/VerificationBadge';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
  size: string;
  website: string;
  official_email: string;
  location: string;
  hiring_contact_name: string;
  hiring_contact_email: string;
  hiring_contact_phone: string;
  verification_status: string;
}

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Manufacturing',
  'Retail & E-commerce', 'Media & Entertainment', 'Real Estate', 'Energy', 'Consulting',
  'Legal', 'Agriculture', 'Transportation & Logistics', 'Other',
];

const SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-1000', label: '501–1,000 employees' },
  { value: '1001-5000', label: '1,001–5,000 employees' },
  { value: '5000+', label: '5,000+ employees' },
];

export default function CompanyProfilePage() {
  const { company: authCompany, refreshAuth } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<Partial<CompanyProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/company');
      setProfile(data.company);
      setForm({
        name: data.company.name,
        industry: data.company.industry || '',
        description: data.company.description || '',
        size: data.company.size || '',
        website: data.company.website || '',
        official_email: data.company.official_email || '',
        location: data.company.location || '',
        hiring_contact_name: data.company.hiring_contact_name || '',
        hiring_contact_email: data.company.hiring_contact_email || '',
        hiring_contact_phone: data.company.hiring_contact_phone || '',
      });
    } catch {
      setError('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const set = (field: keyof CompanyProfile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        name: form.name,
        industry: form.industry || undefined,
        description: form.description || undefined,
        size: form.size || undefined,
        website: form.website || undefined,
        officialEmail: form.official_email || undefined,
        location: form.location || undefined,
        hiringContactName: form.hiring_contact_name || undefined,
        hiringContactEmail: form.hiring_contact_email || undefined,
        hiringContactPhone: form.hiring_contact_phone || undefined,
      };
      const { data } = await api.patch('/company', payload);
      setProfile(data.company);
      await refreshAuth();
      toast.success('Company profile saved');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.errors) {
        const map: Record<string, string> = {};
        err.response.data.errors.forEach((fe: { path: string; msg: string }) => {
          map[fe.path] = fe.msg;
        });
        setFieldErrors(map);
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div className="skeleton" style={{ height: 24, width: 200 }} />
        </div>
        <div className="card">
          {[1,2,3,4].map(i => (
            <div key={i} className="form-group">
              <div className="skeleton" style={{ height: 12, width: 120, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 38, width: '100%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="alert alert-error"><AlertCircle size={15} /> {error}</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Company Profile</h1>
          <p className="page-subtitle">Manage your company information visible to GenuAI and candidates.</p>
        </div>
      </div>

      {/* Verification status */}
      <VerificationBadge status={profile?.verification_status ?? 'UNVERIFIED'} />

      <form onSubmit={handleSave}>
        {/* Basic Info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Company Information</div>
              <div className="card-subtitle">Basic details about your company</div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="cp-name">Company Name <span className="required">*</span></label>
              <input id="cp-name" type="text" className={`form-input${fieldErrors.name ? ' error' : ''}`}
                value={form.name ?? ''} onChange={set('name')} required />
              {fieldErrors.name && <div className="form-error"><AlertCircle size={11} /> {fieldErrors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cp-industry">Industry</label>
              <select id="cp-industry" className="form-select" value={form.industry ?? ''} onChange={set('industry')}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="cp-description">Company Description</label>
              <textarea id="cp-description" className="form-textarea"
                placeholder="Describe what your company does, your mission, and culture..."
                value={form.description ?? ''} onChange={set('description')}
                style={{ minHeight: 120 }} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cp-size">Company Size</label>
              <select id="cp-size" className="form-select" value={form.size ?? ''} onChange={set('size')}>
                <option value="">Select size</option>
                {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cp-location">Location</label>
              <input id="cp-location" type="text" className="form-input"
                placeholder="e.g. London, UK" value={form.location ?? ''} onChange={set('location')} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cp-website">Official Website</label>
              <input id="cp-website" type="url" className={`form-input${fieldErrors.website ? ' error' : ''}`}
                placeholder="https://company.com" value={form.website ?? ''} onChange={set('website')} />
              {fieldErrors.website && <div className="form-error"><AlertCircle size={11} /> {fieldErrors.website}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cp-email">Official Email / Domain</label>
              <input id="cp-email" type="email" className={`form-input${fieldErrors.officialEmail ? ' error' : ''}`}
                placeholder="hr@company.com" value={form.official_email ?? ''} onChange={set('official_email')} />
              {fieldErrors.officialEmail && <div className="form-error"><AlertCircle size={11} /> {fieldErrors.officialEmail}</div>}
            </div>
          </div>
        </div>

        {/* Hiring Contact */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Hiring Contact</div>
              <div className="card-subtitle">Primary point of contact for recruitment</div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="cp-hc-name">Contact Name</label>
              <input id="cp-hc-name" type="text" className="form-input"
                placeholder="Jane Smith" value={form.hiring_contact_name ?? ''} onChange={set('hiring_contact_name')} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cp-hc-phone">Contact Phone</label>
              <input id="cp-hc-phone" type="tel" className="form-input"
                placeholder="+44 7700 000000" value={form.hiring_contact_phone ?? ''} onChange={set('hiring_contact_phone')} />
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="cp-hc-email">Contact Email</label>
              <input id="cp-hc-email" type="email" className={`form-input${fieldErrors.hiringContactEmail ? ' error' : ''}`}
                placeholder="hiring@company.com" value={form.hiring_contact_email ?? ''} onChange={set('hiring_contact_email')} />
              {fieldErrors.hiringContactEmail && <div className="form-error"><AlertCircle size={11} /> {fieldErrors.hiringContactEmail}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button id="save-profile" type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> Saving...</>
              : <><Save size={14} /> Save Changes</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
