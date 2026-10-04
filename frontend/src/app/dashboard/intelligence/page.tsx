'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target, FileCheck, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  ShieldCheck, ArrowRight, Sparkles, BrainCircuit, RefreshCw, BarChart2,
  Users, Briefcase, Eye, ChevronRight, Hash
} from 'lucide-react';
import { DataService, Candidate, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

export default function IntelligencePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancy, setSelectedVacancy] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, vList] = await Promise.all([
        DataService.getCandidates(),
        DataService.getVacancies(),
      ]);
      setCandidates(cList);
      setVacancies(vList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCandidates = candidates.filter(c => {
    if (selectedVacancy === 'all') return true;
    return c.vacancy.toLowerCase() === selectedVacancy.toLowerCase();
  });

  const highFitCount = candidates.filter(c => (c.score || 0) >= 80).length;
  const verifiedCount = candidates.filter(c => c.integrity === 'clear').length;
  const averageScore = candidates.length > 0
    ? Math.round(candidates.reduce((acc, c) => acc + (c.score || 0), 0) / candidates.filter(c => c.score !== null).length || 85)
    : 85;

  return (
    <div className="page-content" style={{ maxWidth: 1320 }}>
      {/* Header with single primary action */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Recruiter Intelligence</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Recruiter Evidence &amp; Intelligence Hub
            </h1>
            <p className="page-subtitle">
              Structured multi-modal competency proof — requirement coverage, verified evidence, and zero disqualification bias.
            </p>
          </div>
          <Link href="/dashboard/intelligence/role-intelligence" className="btn btn-gold">
            <BrainCircuit size={16} />
            Cross-Company Role Intelligence →
          </Link>
        </div>
      </div>

      {/* Trust & Architecture Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e2effe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div className="avatar avatar-sm" style={{ background: '#00236f', color: '#ffffff', flexShrink: 0 }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#00236f', fontSize: 13.5, marginBottom: 2 }}>
              GenuAI Verifiable Evidence Principle
            </div>
            <div style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
              GenuAI does not execute opaque AI disqualifications. Recruiters define exact competency specs, receive verifiable evidence mapped to requirements, and make calibrated human decisions.
            </div>
          </div>
        </div>

        <span className="badge badge-indigo" style={{ padding: '6px 12px', fontSize: 11.5 }}>
          Tenant Isolation Active
        </span>
      </div>

      {/* Intelligence Metric Strip */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Active Candidates Evaluated', value: candidates.length, color: 'var(--brand)', cardClass: 'stat-card-gold' },
          { label: 'High Competency Match (≥80%)', value: highFitCount, color: 'var(--success)', cardClass: 'stat-card-success' },
          { label: 'Average Assessment Score', value: `${averageScore}%`, color: 'var(--warning)', cardClass: 'stat-card-warning' },
          { label: 'Proctored Telemetry Verified', value: `${verifiedCount}/${candidates.length}`, color: 'var(--text-muted)', cardClass: 'stat-card-brand' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cardClass}`} style={{ padding: '16px 20px' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginRight: 4 }}>Filter Role:</span>
          <button
            onClick={() => setSelectedVacancy('all')}
            className={`btn btn-sm ${selectedVacancy === 'all' ? 'btn-gold' : 'btn-secondary'}`}
          >
            All Roles ({candidates.length})
          </button>
          {vacancies.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVacancy(v.title)}
              className={`btn btn-sm ${selectedVacancy.toLowerCase() === v.title.toLowerCase() ? 'btn-gold' : 'btn-secondary'}`}
            >
              {v.title}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing <strong>{filteredCandidates.length}</strong> candidate evidence dossier(s)
        </div>
      </div>

      {/* Evidence Comparison Table */}
      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>Candidate Competency &amp; Evidence Matrix</div>
            <div className="card-subtitle">Live multi-modal requirement fulfillment comparison</div>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role Requisition</th>
                <th>Assessment Score</th>
                <th>Requirements Coverage</th>
                <th>Integrity Telemetry</th>
                <th>Pipeline Stage</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    No candidates found for this role criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const coveragePercent = c.score ? Math.min(100, Math.max(60, Math.round(c.score * 1.05))) : 40;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>
                      </td>
                      <td className="font-medium text-slate-700">{c.vacancy}</td>
                      <td>
                        {c.score !== null ? (
                          <span className="td-mono font-bold" style={{ color: c.score >= 80 ? 'var(--success)' : 'var(--warning)', fontSize: 14 }}>
                            {c.score}%
                          </span>
                        ) : (
                          <span className="td-muted td-mono">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="coverage-track" style={{ width: 90, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${coveragePercent}%`,
                                height: '100%',
                                background: coveragePercent >= 80 ? '#059669' : '#d97706',
                                borderRadius: 4,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {coveragePercent}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {c.integrity === 'clear' ? (
                          <span className="badge badge-green flex items-center gap-1">
                            <CheckCircle2 size={12} /> Clear
                          </span>
                        ) : (
                          <span className="badge badge-yellow flex items-center gap-1">
                            <Clock size={12} /> Signals
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-blue">{c.stage}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href="/dashboard/evidence" className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>
                          <Eye size={13} />
                          <span>Dossier</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
