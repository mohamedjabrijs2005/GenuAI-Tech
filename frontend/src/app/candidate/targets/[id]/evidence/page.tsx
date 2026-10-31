'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileCheck, ArrowLeft, Plus, X, Send, Info, ExternalLink, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const EVIDENCE_TYPES = [
  'PROJECT_LINK', 'GITHUB_REPOSITORY', 'PDF_CERTIFICATE',
  'INTERNSHIP_LETTER', 'WORK_SAMPLE', 'VIDEO_EXPLANATION',
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  APPROVED:      { bg: '#dcfce7', color: '#166534' },
  ACCEPTED:      { bg: '#dcfce7', color: '#166534' },
  SUBMITTED:     { bg: '#eff6ff', color: '#1e40af' },
  PENDING_REVIEW:{ bg: '#fef3c7', color: '#b45309' },
  UNDER_REVIEW:  { bg: '#fef3c7', color: '#b45309' },
  REJECTED:      { bg: '#fef2f2', color: '#b91c1c' },
  WITHDRAWN:     { bg: '#f1f5f9', color: '#94a3b8' },
};

function badge(status: string) {
  const s = STATUS_STYLE[status] || { bg: '#f1f5f9', color: '#64748b' };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color }}>{status.replace(/_/g, ' ')}</span>;
}

export default function TargetEvidencePage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', evidenceType: 'PROJECT_LINK', url: '', description: '', requirementId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [evRes, wsRes] = await Promise.all([
        api.get(`/candidate-portal/targets/${targetId}/evidence`),
        api.get(`/candidate-portal/targets/${targetId}`),
      ]);
      setEvidenceList(evRes.data?.evidence || []);
      setRequirements(wsRes.data?.requirements || []);
    } catch {
      toast.error('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (targetId) load(); }, [targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim() || !form.description.trim()) {
      return toast.error('Title, URL, and explanation are required');
    }
    setSubmitting(true);
    try {
      await api.post(`/candidate-portal/targets/${targetId}/evidence`, {
        title: form.title, evidence_type: form.evidenceType, url: form.url,
        description: form.description, requirement_id: form.requirementId || null,
      });
      toast.success('Evidence submitted!');
      setForm({ title: '', evidenceType: 'PROJECT_LINK', url: '', description: '', requirementId: '' });
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (evidenceId: string) => {
    if (!window.confirm('Withdraw this evidence?')) return;
    setWithdrawingId(evidenceId);
    try {
      await api.post(`/candidate-portal/targets/${targetId}/evidence/${evidenceId}/withdraw`);
      toast.success('Evidence withdrawn');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Cannot withdraw after recruiter review');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <div className="spinner" />
    </div>
  );

  const canWithdraw = (ev: any) => ['SUBMITTED', 'PENDING_REVIEW'].includes(ev.review_status || ev.status || '');
  const active = evidenceList.filter(e => !['WITHDRAWN'].includes(e.review_status || ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      <Link href={`/candidate/targets/${targetId}`} style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to Target Workspace
      </Link>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '26px 30px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 11, fontWeight: 700, color: '#c2410c' }}>Evidence Locker</span>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#166534' }}>{active.length} Submitted</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 6px' }}>Evidence Locker</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Submit work samples, project links, certificates, and credentials linked to role requirements.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Cancel' : 'Add Evidence'}
          </button>
        </div>
      </div>

      {/* Policy */}
      <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', display: 'flex', gap: 8, fontSize: 12.5, color: '#1e40af' }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Evidence can be withdrawn before recruiter review begins. Coverage updates immediately after submission.</span>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 18px' }}>Submit New Evidence</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Evidence Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. React E-commerce Project" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Evidence Type *</label>
                <select value={form.evidenceType} onChange={e => setForm(f => ({ ...f, evidenceType: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  {EVIDENCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Link or File URL *</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://github.com/... or https://drive.google.com/..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Related Requirement</label>
              <select value={form.requirementId} onChange={e => setForm(f => ({ ...f, requirementId: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                <option value="">— Not linked to a specific requirement —</option>
                {requirements.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Short Explanation *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Briefly explain what this demonstrates..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical' }} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-gold" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Send size={13} /> {submitting ? 'Submitting…' : 'Submit Evidence'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {evidenceList.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <FileCheck size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#64748b', margin: '0 0 6px' }}>No evidence submitted yet</p>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0 }}>Add project links, certificates, or work samples to support your requirements.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted Evidence ({evidenceList.length})</h2>
          {evidenceList.map((ev: any) => {
            const withdrawn = (ev.review_status || ev.status || '') === 'WITHDRAWN';
            return (
              <div key={ev.id} style={{ borderRadius: 10, border: '1px solid #e2e8f0', background: withdrawn ? '#f8fafc' : '#fff', padding: '18px 20px', opacity: withdrawn ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>
                        {(ev.evidence_type || ev.type || '').replace(/_/g, ' ')}
                      </span>
                      {badge(ev.review_status || ev.status || 'SUBMITTED')}
                      {ev.requirement_name && <span style={{ fontSize: 11, color: '#94a3b8' }}>→ {ev.requirement_name}</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, marginBottom: 6 }}>{ev.description}</div>}
                    {ev.submitted_at && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Submitted {new Date(ev.submitted_at).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={12} /> View
                      </a>
                    )}
                    {canWithdraw(ev) && !withdrawn && (
                      <button onClick={() => handleWithdraw(ev.id)} disabled={withdrawingId === ev.id} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 10px', color: '#ef4444' }} title="Withdraw">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link href={`/candidate/targets/${targetId}/coverage`} className="btn btn-primary" style={{ textDecoration: 'none', alignSelf: 'flex-start', fontSize: 13 }}>
        View Coverage Matrix →
      </Link>
    </div>
  );
}
