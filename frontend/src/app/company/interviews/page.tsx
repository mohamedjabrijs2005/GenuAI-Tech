'use client';

import { useState, useEffect } from 'react';
import { Calendar, Mic, CheckCircle2, Clock, User, AlertCircle, RefreshCw, Video, MapPin, FileText } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Interview {
  id: string;
  candidate_name?: string;
  vacancy_title?: string;
  interviewer_name?: string;
  interview_date?: string;
  status?: string;
  type?: string;
  notes?: string;
  feedback?: string;
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#2563eb', completed: '#059669', cancelled: '#dc2626',
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/interviews');
      setInterviews(res.data?.interviews || res.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load interviews');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = interviews.filter(i => filter === 'all' || i.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Interviews</h1>
            <p className="page-subtitle">Track scheduled and completed interviews from your vacancy shortlists.</p>
          </div>
          <button className="btn btn-secondary btn-mobile-full" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar flex-mobile-col" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', 'scheduled', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-mobile-full ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: 44, textTransform: 'capitalize' }}>
            {f === 'all' ? 'All Interviews' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {error && <div className="card" style={{ padding: 24, textAlign: 'center', color: '#dc2626' }}><AlertCircle size={24} style={{ marginBottom: 8 }} /><p>{error}</p></div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            No {filter !== 'all' ? filter : ''} interviews yet. Invite candidates to assessment from the shortlist to schedule interviews.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(i => (
            <div key={i.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i.type === 'Video' ? <Video size={18} style={{ color: '#2563eb' }} /> : <Mic size={18} style={{ color: '#7c3aed' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {i.candidate_name || 'Candidate'} — {i.vacancy_title || 'Role'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {i.interviewer_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} />{i.interviewer_name}</span>}
                    {i.interview_date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{new Date(i.interview_date).toLocaleString()}</span>}
                    {i.type && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{i.type}</span>}
                  </div>
                  {i.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>{i.notes}</p>}
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  background: `${STATUS_COLOR[i.status || 'scheduled']}18`,
                  color: STATUS_COLOR[i.status || 'scheduled'],
                }}>
                  {(i.status || 'scheduled').charAt(0).toUpperCase() + (i.status || 'scheduled').slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
