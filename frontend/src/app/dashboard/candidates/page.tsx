'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, ChevronRight, User, Sparkles, ShieldCheck, CheckCircle2, Phone, Mail, Clock, X, ArrowRight } from 'lucide-react';
import { DataService, Candidate } from '@/lib/dataService';
import toast from 'react-hot-toast';

const STAGES: Candidate['stage'][] = ['Applied', 'Eligible', 'Verified', 'Invited', 'Assessed', 'Review', 'Interview', 'Decision'];

const STAGE_COLOR: Record<string, string> = {
  Applied: 'badge-gray',
  Eligible: 'badge-blue',
  Verified: 'badge-indigo',
  Invited: 'badge-purple',
  Assessed: 'badge-yellow',
  Review: 'badge-yellow',
  Interview: 'badge-blue',
  Decision: 'badge-green',
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const loadCandidates = async () => {
    try {
      const data = await DataService.getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleStageChange = async (candidateId: string, nextStage: Candidate['stage']) => {
    await DataService.updateCandidateStage(candidateId, nextStage);
    toast.success(`Candidate moved to ${nextStage}`);
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, stage: nextStage });
    }
    await loadCandidates();
  };

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.vacancy.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Candidates Pipeline</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Candidate Evidence Pipeline
            </h1>
            <p className="page-subtitle">Track, evaluate verified evidence, and advance candidates through structured assessment stages.</p>
          </div>
          <Link href="/dashboard/evidence" className="btn btn-gold">
            <ShieldCheck size={16} />
            Evidence Dossiers
          </Link>
        </div>
      </div>

      {/* Pipeline Overview Stage Filter Grid */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="card-title">Recruitment Pipeline Stages</div>
            <div className="card-subtitle">Click any stage to filter candidate records</div>
          </div>
          <button
            className={`btn btn-sm ${stageFilter === 'All' ? 'btn-gold' : 'btn-secondary'}`}
            onClick={() => setStageFilter('All')}
          >
            Show All ({candidates.length})
          </button>
        </div>

        {/* Responsive Horizontal Pipeline Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {STAGES.map((s) => {
            const count = candidates.filter(c => c.stage === s).length;
            const isSelected = stageFilter === s;
            return (
              <div
                key={s}
                onClick={() => setStageFilter(isSelected ? 'All' : s)}
                style={{
                  background: isSelected ? '#fefce8' : count > 0 ? '#ffffff' : '#f8fafc',
                  border: isSelected ? '2px solid #d4af37' : count > 0 ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '14px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? '#a16207' : count > 0 ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#a16207' : count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap' }}>
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            placeholder="Search candidate name or position..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search candidates"
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing <strong>{filtered.length}</strong> candidates in pipeline
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Applied Role</th>
              <th>Stage</th>
              <th>Score</th>
              <th>Evidence Covered</th>
              <th>Integrity Status</th>
              <th>Applied Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon"><User size={22} /></div>
                    <div className="empty-title">No candidates match the filter</div>
                    <div className="empty-desc">Adjust the search query or pipeline filter above.</div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="avatar avatar-sm">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>{c.name}</div>
                      <div className="td-muted" style={{ fontSize: 11 }}>{c.email || 'Verified Candidate'}</div>
                    </div>
                  </div>
                </td>
                <td className="font-medium">{c.vacancy}</td>
                <td>
                  <span className={`badge ${STAGE_COLOR[c.stage] || 'badge-gray'}`}>
                    {c.stage}
                  </span>
                </td>
                <td>
                  {c.score !== null ? (
                    <span className="td-mono font-bold" style={{ color: c.score >= 80 ? 'var(--success)' : 'var(--warning)', fontSize: 14 }}>
                      {c.score}%
                    </span>
                  ) : (
                    <span className="td-muted td-mono">—</span>
                  )}
                </td>
                <td className="td-mono font-semibold">{c.evidence}</td>
                <td>
                  {c.integrity === 'clear' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold" style={{ fontSize: 12 }}>
                      <CheckCircle2 size={13} /> Clear
                    </span>
                  ) : c.integrity === 'signals' ? (
                    <span className="flex items-center gap-1 text-amber-600 font-semibold" style={{ fontSize: 12 }}>
                      <Clock size={13} /> Signals
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 font-semibold" style={{ fontSize: 12 }}>
                      Flagged
                    </span>
                  )}
                </td>
                <td className="td-muted td-mono" style={{ whiteSpace: 'nowrap' }}>{c.date}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedCandidate(c)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={13} />
                    <span>Review</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Candidate Review Modal */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="avatar avatar-md">
                  {selectedCandidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="modal-title">{selectedCandidate.name}</div>
                  <div className="modal-subtitle">{selectedCandidate.vacancy} • Applied {selectedCandidate.date}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-3" style={{ gap: 12 }}>
                <div className="card" style={{ padding: '12px 14px' }}>
                  <div className="stat-label">Assessment Score</div>
                  <div className="stat-value" style={{ fontSize: 20, color: selectedCandidate.score && selectedCandidate.score >= 80 ? 'var(--success)' : 'var(--text-primary)' }}>
                    {selectedCandidate.score ? `${selectedCandidate.score}%` : 'Pending'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div className="stat-label">Evidence Matrix</div>
                  <div className="stat-value" style={{ fontSize: 20 }}>
                    {selectedCandidate.evidence}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div className="stat-label">Current Stage</div>
                  <div className="stat-value" style={{ fontSize: 16 }}>
                    <span className={`badge ${STAGE_COLOR[selectedCandidate.stage] || 'badge-gray'}`}>
                      {selectedCandidate.stage}
                    </span>
                  </div>
                </div>
              </div>

              {selectedCandidate.notes && (
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 12.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reviewer Notes:</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{selectedCandidate.notes}</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Advance Candidate Stage</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStageChange(selectedCandidate.id, s)}
                      className={`btn btn-sm ${selectedCandidate.stage === s ? 'btn-gold' : 'btn-secondary'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Link href={`/dashboard/evidence`} className="btn btn-secondary btn-sm">
                View Evidence Dossier
              </Link>
              <button onClick={() => setSelectedCandidate(null)} className="btn btn-gold btn-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
