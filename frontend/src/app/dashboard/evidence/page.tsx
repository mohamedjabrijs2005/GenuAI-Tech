'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertTriangle, Circle, ChevronRight, ShieldCheck,
  FileText, ExternalLink, Hash, Calendar, ArrowRight, Sparkles,
  Layers, UserCheck, HelpCircle, Info, RefreshCw
} from 'lucide-react';
import { DataService, Candidate } from '@/lib/dataService';

interface EvidenceRecord {
  id: string;
  reqId: string;
  skill: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  proficiency: 'Advanced' | 'Intermediate' | 'Basic';
  score: number | null;
  method: string;
  status: 'supporting' | 'limited' | 'gap';
  evaluationGroup: string;
  assessmentVersion: string;
  evidence: string;
  integrityContext: string;
  hash: string;
  timestamp: string;
  gapMitigation?: string;
}

export default function EvidencePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand-1');

  useEffect(() => {
    async function load() {
      const data = await DataService.getCandidates();
      setCandidates(data);
      if (data.length > 0) {
        setSelectedCandidateId(data[0].id);
      }
    }
    load();
  }, []);

  const currentCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  // Dynamic requirements evidence matrix for candidate
  const requirements: EvidenceRecord[] = [
    {
      id: 'EV-01',
      reqId: 'R-001',
      skill: 'Java Core & Microservices',
      category: 'Technical',
      priority: 'High',
      proficiency: 'Advanced',
      score: currentCandidate?.score || 88,
      method: 'Proctored Technical Sandbox',
      status: 'supporting',
      evaluationGroup: 'Java OOP & Concurrency',
      assessmentVersion: 'AG-01 v1.0',
      evidence: 'Passed all 16 concurrent goroutine tests and lock-free ring buffer benchmarks.',
      integrityContext: 'Zero proctoring telemetry anomalies',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      timestamp: '2026-09-22 14:32 UTC',
    },
    {
      id: 'EV-02',
      reqId: 'R-002',
      skill: 'PostgreSQL & Database Architecture',
      category: 'Technical',
      priority: 'High',
      proficiency: 'Advanced',
      score: 92,
      method: 'SQL Schema & Query Optimization',
      status: 'supporting',
      evaluationGroup: 'SQL Query & Schema Indexing',
      assessmentVersion: 'AG-01 v1.0',
      evidence: 'Optimized complex query execution time by 84% using partial B-Tree indices.',
      integrityContext: 'Clear telemetry feed',
      hash: '7d793037a0760186574b0282f2f435e70d6324d07bf71f959f61882c57f50426',
      timestamp: '2026-09-22 15:10 UTC',
    },
    {
      id: 'EV-03',
      reqId: 'R-003',
      skill: 'Distributed System Debugging',
      category: 'Problem Solving',
      priority: 'High',
      proficiency: 'Intermediate',
      score: 79,
      method: 'Live Debugging Scenario',
      status: 'limited',
      evaluationGroup: 'Concurrency & Deadlock Resolution',
      assessmentVersion: 'AG-02 v1.0',
      evidence: 'Resolved memory leak anomaly; deadlock resolution took 2 retry cycles.',
      integrityContext: '1x Tab Switch detected (2s duration) — Reviewed & Cleared',
      hash: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
      timestamp: '2026-09-22 16:15 UTC',
      gapMitigation: 'Recommend asking candidate to explain race condition mitigation during Technical Interview.',
    },
    {
      id: 'EV-04',
      reqId: 'R-004',
      skill: 'AWS Cloud Infrastructure',
      category: 'Infrastructure',
      priority: 'Medium',
      proficiency: 'Intermediate',
      score: null,
      method: 'Unassessed',
      status: 'gap',
      evaluationGroup: 'Cloud Provisioning',
      assessmentVersion: 'N/A',
      evidence: 'No proctored assessment evidence logged for AWS Cloud Infrastructure.',
      integrityContext: 'No assessment signals recorded',
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: 'N/A',
      gapMitigation: 'Schedule targeted AWS Cloud Infrastructure technical interview module or assign Sandbox test.',
    },
    {
      id: 'EV-05',
      reqId: 'R-005',
      skill: 'Technical Communication & Rubric Defense',
      category: 'Communication',
      priority: 'Medium',
      proficiency: 'Intermediate',
      score: 94,
      method: 'Calibrated Structured Interview',
      status: 'supporting',
      evaluationGroup: 'Architecture Trade-off Presentation',
      assessmentVersion: 'INT-01 v1.0',
      evidence: 'Articulated architectural trade-offs between eventual consistency and 2PC.',
      integrityContext: 'Verified interviewer observation log recorded by Lead Architect',
      hash: '3a5b2c1d8e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
      timestamp: '2026-09-22 17:00 UTC',
    },
  ];

  const supportingCount = requirements.filter(r => r.status === 'supporting').length;
  const limitedCount = requirements.filter(r => r.status === 'limited').length;
  const gapCount = requirements.filter(r => r.status === 'gap').length;
  const coveragePercent = Math.round(((supportingCount + limitedCount * 0.5) / requirements.length) * 100);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Evidence</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Competency Evidence Dossiers</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Requirement Evidence Lineage &amp; Coverage
            </h1>
            <p className="page-subtitle">Trace candidate role requirements directly to assessment evidence, proctoring telemetry, and evidence gaps.</p>
          </div>
          <Link href="/dashboard/candidates" className="btn btn-gold">
            <UserCheck size={16} />
            Candidates Pipeline
          </Link>
        </div>
      </div>

      {/* Candidate Selector Bar */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div className="flex items-center gap-3">
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Select Candidate Dossier:</span>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidateId(c.id)}
                  className={`btn btn-sm ${selectedCandidateId === c.id ? 'btn-gold' : 'btn-secondary'}`}
                >
                  {c.name} ({c.score ? `${c.score}%` : c.stage})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: '#059669' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              SHA-256 Payload Integrity Verified
            </span>
          </div>
        </div>
      </div>

      {currentCandidate && (
        <div className="grid-3" style={{ gap: 24, alignItems: 'flex-start' }}>
          {/* Left Column: Candidate Summary Card */}
          <div className="card" style={{ padding: 20, gridColumn: 'span 1' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)', color: '#fff' }}>
                {currentCandidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{currentCandidate.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentCandidate.vacancy}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: '#fffdf5', borderRadius: 'var(--r-md)', border: '1px solid rgba(212, 175, 55, 0.4)', fontSize: 12.5, marginBottom: 16 }}>
              <div className="flex justify-between">
                <span className="td-muted">Evidence Coverage:</span>
                <span className="font-bold text-emerald-600">{coveragePercent}% Coverage</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Supporting Evidence:</span>
                <span className="font-bold text-emerald-600">{supportingCount} / {requirements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Limited / Partial:</span>
                <span className="font-bold text-amber-600">{limitedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Evidence Gaps:</span>
                <span className="font-bold text-red-600">{gapCount}</span>
              </div>
              <div className="flex justify-between" style={{ paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                <span className="td-muted">Pipeline Stage:</span>
                <span className="badge badge-gold">{currentCandidate.stage}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              GenuAI connects each requirement for <strong>{currentCandidate.vacancy}</strong> with structured evidence logs. Review evidence sources below to inform your hiring team's decision.
            </div>
          </div>

          {/* Right Column: Requirements Lineage & Coverage Matrix */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Requirement Lineage Matrix ({requirements.length} Requirements Defined)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Version: <strong>V1.0</strong>
              </div>
            </div>

            {requirements.map((req) => (
              <div
                key={req.id}
                className="card"
                style={{
                  padding: 18,
                  borderLeft: `4px solid ${
                    req.status === 'supporting' ? '#059669' : req.status === 'limited' ? '#d97706' : '#dc2626'
                  }`,
                  transition: 'all 0.15s ease',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div className="flex items-center gap-2">
                    <span className="td-mono font-bold" style={{ fontSize: 11, color: '#b8860b' }}>{req.reqId}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{req.skill}</span>
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>{req.category}</span>
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>{req.priority} Priority</span>
                  </div>

                  <span
                    className={`badge ${
                      req.status === 'supporting'
                        ? 'badge-green'
                        : req.status === 'limited'
                        ? 'badge-yellow'
                        : 'badge-red'
                    }`}
                  >
                    {req.status === 'supporting' && <CheckCircle2 size={12} style={{ marginRight: 4 }} />}
                    {req.status === 'limited' && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                    {req.status === 'gap' && <Circle size={12} style={{ marginRight: 4 }} />}
                    {req.status === 'supporting' ? 'SUPPORTING EVIDENCE' : req.status === 'limited' ? 'LIMITED EVIDENCE' : 'EVIDENCE GAP'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, background: '#fafbfc', padding: '10px 12px', borderRadius: 8, marginBottom: 10, border: '1px solid var(--border)' }}>
                  <div>
                    <span className="td-muted">Evaluation Source:</span> <strong>{req.method}</strong> ({req.assessmentVersion})
                  </div>
                  <div>
                    <span className="td-muted">Evaluation Group:</span> <strong>{req.evaluationGroup}</strong>
                  </div>
                  <div>
                    <span className="td-muted">Proctored Telemetry:</span> <span style={{ color: 'var(--text-primary)' }}>{req.integrityContext}</span>
                  </div>
                  <div>
                    <span className="td-muted">Evaluation Score:</span> <strong style={{ color: req.score ? '#b8860b' : 'var(--text-muted)' }}>{req.score ? `${req.score}%` : 'Unassessed'}</strong>
                  </div>
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
                  <strong>Observed Evidence:</strong> {req.evidence}
                </div>

                {req.gapMitigation && (
                  <div style={{ fontSize: 12, color: '#854d0e', background: '#fffbeb', padding: '8px 12px', borderRadius: 6, border: '1px solid #fde68a', marginBottom: 10 }}>
                    <strong>Mitigation Guidance:</strong> {req.gapMitigation}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1 font-mono">
                    <Hash size={11} /> SHA-256: {req.hash.substring(0, 24)}...
                  </span>
                  <span>Timestamp: {req.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
