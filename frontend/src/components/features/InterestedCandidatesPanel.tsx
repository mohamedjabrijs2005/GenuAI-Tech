'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, MapPin, Mail } from 'lucide-react';
import api from '@/lib/api';

interface InterestedCandidate {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  location?: string;
  interest_id: string;
  interested_at: string;
  target_id?: string | null;
  target_status?: string | null;
}

export function InterestedCandidatesPanel({ vacancyId }: { vacancyId: string }) {
  const [candidates, setCandidates] = useState<InterestedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInterested = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/company/vacancies/${vacancyId}/interested-candidates`);
      setCandidates(res.data?.candidates || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load interested candidates.');
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    if (vacancyId) loadInterested();
  }, [vacancyId, loadInterested]);

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: '#2563eb' }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            Interested Candidates ({candidates.length})
          </h2>
        </div>
        <button type="button" onClick={loadInterested} disabled={loading} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: 12 }}>Loading interested candidates...</div>
      ) : error ? (
        <div style={{ fontSize: 13, color: '#991b1b', padding: 12, background: '#fef2f2', borderRadius: 8 }}>{error}</div>
      ) : candidates.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          No candidates have expressed interest in this vacancy yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {candidates.map((c) => (
            <div key={c.interest_id} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: '#fcfcfd' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 4 }}>
                {`${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Candidate'}
              </div>
              {c.email && (
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Mail size={11} /> {c.email}
                </div>
              )}
              {c.location && (
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <MapPin size={11} /> {c.location}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                <span>{c.target_id ? `Target: ${c.target_status || 'ACTIVE'}` : 'Interest Expressed'}</span>
                <span>{new Date(c.interested_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
