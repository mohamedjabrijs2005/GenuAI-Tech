'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Shield, Eye, CheckCircle2, X,
  FileText, Clock, ChevronDown, ShieldAlert, MonitorOff,
  Clipboard, UserX, RefreshCw
} from 'lucide-react';

type ReviewStatus = 'Unreviewed' | 'Reviewed' | 'Dismissed' | 'Escalated';

interface IntegritySignal {
  type: string;
  count: number;
  severity: 'none' | 'low' | 'medium' | 'high';
  timestamps?: string[];
  context?: string;
}

interface CandidateRecord {
  id: number;
  incidentId: string;
  name: string;
  candidateId: string;
  vacancy: string;
  assessmentDate: string;
  assessmentId: string;
  signals: IntegritySignal[];
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const INITIAL_RECORDS: CandidateRecord[] = [
  {
    id: 1,
    incidentId: 'INC-2026-001',
    name: 'Aisha Rahman',
    candidateId: 'c2',
    vacancy: 'Software Developer',
    assessmentDate: '2026-09-21',
    assessmentId: 'AG-01 v1.0',
    signals: [
      { type: 'Tab switching', count: 2, severity: 'medium', timestamps: ['09:14:23', '09:31:07'], context: 'Browser tab focus lost twice during coding section' },
      { type: 'Copy/Paste attempt', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 1, severity: 'low', timestamps: ['09:22:15'], context: 'Camera feed blank for ~4 seconds — may be adjustment' },
      { type: 'Multiple person detected', count: 0, severity: 'none' },
      { type: 'Prohibited shortcut used', count: 0, severity: 'none' },
    ],
    reviewStatus: 'Unreviewed',
  },
  {
    id: 2,
    incidentId: 'INC-2026-002',
    name: 'James Okonkwo',
    candidateId: 'c3',
    vacancy: 'Software Developer',
    assessmentDate: '2026-09-20',
    assessmentId: 'AG-01 v1.0',
    signals: [
      { type: 'Tab switching', count: 0, severity: 'none' },
      { type: 'Copy/Paste attempt', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 0, severity: 'none' },
      { type: 'Multiple person detected', count: 0, severity: 'none' },
      { type: 'Prohibited shortcut used', count: 0, severity: 'none' },
    ],
    reviewStatus: 'Reviewed',
    reviewedBy: 'Sarah Connor',
    reviewedAt: '2026-09-20 16:00',
    reviewNote: 'Full proctoring audit complete — no signals detected. Candidate is cleared.',
  },
  {
    id: 3,
    incidentId: 'INC-2026-003',
    name: 'Mohamed Jabri',
    candidateId: 'c1',
    vacancy: 'Software Developer',
    assessmentDate: '2026-09-22',
    assessmentId: 'AG-01 v1.0',
    signals: [
      { type: 'Tab switching', count: 1, severity: 'low', timestamps: ['10:05:44'], context: 'Single tab switch — duration < 2 seconds' },
      { type: 'Copy/Paste attempt', count: 1, severity: 'medium', timestamps: ['10:42:19'], context: 'Paste action detected in code editor area (outside authorized code buffer)' },
      { type: 'Face missing from frame', count: 0, severity: 'none' },
      { type: 'Multiple person detected', count: 0, severity: 'none' },
      { type: 'Prohibited shortcut used', count: 0, severity: 'none' },
    ],
    reviewStatus: 'Unreviewed',
  },
];

const SEVERITY_COLOR: Record<string, string> = {
  none: 'text-slate-400',
  low: 'text-amber-600',
  medium: 'text-orange-600',
  high: 'text-red-700',
};

const SEVERITY_BG: Record<string, string> = {
  none: 'bg-slate-50 border-slate-200',
  low: 'bg-amber-50 border-amber-200',
  medium: 'bg-orange-50 border-orange-200',
  high: 'bg-red-50 border-red-200',
};

const SIGNAL_ICON: Record<string, React.ReactNode> = {
  'Tab switching': <MonitorOff size={14} />,
  'Copy/Paste attempt': <Clipboard size={14} />,
  'Face missing from frame': <UserX size={14} />,
  'Multiple person detected': <UserX size={14} />,
  'Prohibited shortcut used': <ShieldAlert size={14} />,
};

export default function IntegrityPage() {
  const [records, setRecords] = useState<CandidateRecord[]>(INITIAL_RECORDS);
  const [expanded, setExpanded] = useState<number[]>([1, 3]);
  const [reviewModal, setReviewModal] = useState<CandidateRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<ReviewStatus>('Reviewed');

  const toggleExpanded = (id: number) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submitReview = () => {
    if (!reviewModal) return;
    setRecords(prev => prev.map(r =>
      r.id === reviewModal.id
        ? {
            ...r,
            reviewStatus: reviewAction,
            reviewedBy: 'Sarah Connor (You)',
            reviewedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            reviewNote,
          }
        : r
    ));
    setReviewModal(null);
    setReviewNote('');
  };

  const unreviewed = records.filter(r => r.reviewStatus === 'Unreviewed' && r.signals.some(s => s.count > 0));
  const cleared = records.filter(r => !r.signals.some(s => s.count > 0));

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Intelligence</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Integrity Review</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Assessment Integrity Review</h1>
            <p className="page-subtitle">
              Observable proctoring signals — recruiter interprets and determines action. GenuAI does not make accusations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreviewed.length > 0 && (
              <span className="badge badge-red font-bold text-xs flex items-center gap-1">
                <AlertTriangle size={12} /> {unreviewed.length} Pending Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Principle disclaimer */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 20 }}>
        <div className="flex items-start gap-3 text-xs text-orange-900">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-orange-600" />
          <div className="leading-relaxed">
            <strong>Signals are not conclusions.</strong> These are observable assessment environment telemetry signals.
            Displaying a signal does NOT mean the candidate cheated. Recruiter judgment determines interpretation.
            Every signal must be reviewed and a status recorded before any hiring action is taken.
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Records</div>
          <div className="text-2xl font-extrabold text-slate-900">{records.length}</div>
          <div className="text-xs text-slate-500 mt-1">Assessments monitored</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Signals Detected</div>
          <div className="text-2xl font-extrabold text-orange-700">
            {records.filter(r => r.signals.some(s => s.count > 0)).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Require review</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unreviewed</div>
          <div className="text-2xl font-extrabold text-red-600">{unreviewed.length}</div>
          <div className="text-xs text-red-600 font-semibold mt-1">Action required</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cleared Records</div>
          <div className="text-2xl font-extrabold text-emerald-700">{cleared.length}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">No signals detected</div>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-4">
        {records.map((rec) => {
          const hasSignals = rec.signals.some(s => s.count > 0);
          const isOpen = expanded.includes(rec.id);
          const maxSeverity = rec.signals.reduce((max, s) => {
            const order = ['none', 'low', 'medium', 'high'];
            return order.indexOf(s.severity) > order.indexOf(max) ? s.severity : max;
          }, 'none' as IntegritySignal['severity']);

          return (
            <div
              key={rec.id}
              className="card"
              style={{
                padding: 0,
                borderLeft: `3px solid ${
                  rec.reviewStatus === 'Reviewed' || rec.reviewStatus === 'Dismissed' ? 'var(--success)'
                  : hasSignals ? (maxSeverity === 'medium' ? '#f97316' : '#fbbf24')
                  : 'var(--border)'
                }`
              }}
            >
              {/* Card Header */}
              <div
                className="cursor-pointer"
                style={{ padding: '16px 22px' }}
                onClick={() => toggleExpanded(rec.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: hasSignals ? '#fff7ed' : 'var(--surface-2)',
                      border: `1px solid ${hasSignals ? '#fed7aa' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: hasSignals ? '#c2410c' : 'var(--text-primary)',
                      flexShrink: 0,
                    }}>
                      {rec.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/candidates/${rec.candidateId}`}
                          className="font-extrabold text-slate-900 text-sm hover:text-amber-900"
                          onClick={e => e.stopPropagation()}
                        >
                          {rec.name}
                        </Link>
                        <span className="badge badge-gray text-[10px]">{rec.incidentId}</span>
                        <span className="badge badge-gray text-[10px]">{rec.assessmentId}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {rec.vacancy} · Assessment: {rec.assessmentDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {rec.reviewStatus === 'Unreviewed' && hasSignals && (
                      <span className="badge badge-red font-bold text-xs flex items-center gap-1">
                        <Clock size={11} /> Unreviewed
                      </span>
                    )}
                    {rec.reviewStatus === 'Reviewed' && (
                      <span className="badge badge-green font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 size={11} /> Reviewed
                      </span>
                    )}
                    {rec.reviewStatus === 'Dismissed' && (
                      <span className="badge badge-gray font-bold text-xs">Dismissed</span>
                    )}
                    {rec.reviewStatus === 'Escalated' && (
                      <span className="badge badge-red font-bold text-xs">Escalated</span>
                    )}
                    {!hasSignals && rec.reviewStatus !== 'Reviewed' && (
                      <span className="badge badge-green font-bold text-xs flex items-center gap-1">
                        <Shield size={11} /> Clear
                      </span>
                    )}
                    {hasSignals && rec.reviewStatus === 'Unreviewed' && (
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={e => { e.stopPropagation(); setReviewModal(rec); setReviewNote(''); }}
                      >
                        <Eye size={13} /> Review
                      </button>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Expanded signals */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 22px 20px' }}>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Proctoring Telemetry ({rec.signals.length} signal types monitored)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {rec.signals.map((s) => (
                      <div
                        key={s.type}
                        className={`p-3 rounded-xl border ${SEVERITY_BG[s.severity]}`}
                      >
                        <div className={`flex items-center gap-2 mb-1 ${SEVERITY_COLOR[s.severity]}`}>
                          {SIGNAL_ICON[s.type]}
                          <span className="text-xs font-bold">{s.type}</span>
                        </div>
                        <div className={`text-xl font-extrabold ${SEVERITY_COLOR[s.severity]}`}>
                          {s.count}
                          <span className="text-xs font-normal text-slate-500 ml-2">occurrences</span>
                        </div>
                        {s.context && (
                          <div className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{s.context}</div>
                        )}
                        {s.timestamps && s.timestamps.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {s.timestamps.map(t => (
                              <span key={t} className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Review result if exists */}
                  {rec.reviewedBy && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold mb-1">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        Review recorded — {rec.reviewStatus}
                      </div>
                      <div className="text-xs text-slate-700 mb-1">
                        By <strong>{rec.reviewedBy}</strong> at {rec.reviewedAt}
                      </div>
                      {rec.reviewNote && (
                        <p className="text-xs text-slate-600 leading-relaxed">{rec.reviewNote}</p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {hasSignals && rec.reviewStatus === 'Unreviewed' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => { setReviewModal(rec); setReviewNote(''); }}
                      >
                        <Eye size={13} /> Record Review Decision
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setReviewModal(null)}
        >
          <div
            style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="card-title flex items-center gap-2">
                  <ShieldAlert size={16} className="text-orange-600" />
                  Integrity Signal Review — {reviewModal.incidentId}
                </h2>
                <p className="card-subtitle">{reviewModal.name} · {reviewModal.assessmentDate}</p>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setReviewModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900 mb-4">
              <strong>Reminder:</strong> Displaying signals does NOT mean the candidate cheated.
              Your review decision and rationale will be logged in the audit trail.
            </div>

            {/* Signal summary */}
            <div className="space-y-1.5 mb-4">
              {reviewModal.signals.filter(s => s.count > 0).map(s => (
                <div key={s.type} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <span className={SEVERITY_COLOR[s.severity]}>{SIGNAL_ICON[s.type]}</span>
                    <span className="font-semibold text-slate-800">{s.type}</span>
                    {s.context && <span className="text-slate-500"> — {s.context}</span>}
                  </div>
                  <span className={`font-extrabold ${SEVERITY_COLOR[s.severity]}`}>{s.count}x</span>
                </div>
              ))}
            </div>

            {/* Review action */}
            <div className="form-group mb-3">
              <label className="form-label">Review Outcome</label>
              <select
                className="form-select"
                value={reviewAction}
                onChange={e => setReviewAction(e.target.value as ReviewStatus)}
              >
                <option value="Reviewed">Reviewed — No Action Required</option>
                <option value="Dismissed">Dismissed — Signal Explained / Not Concerning</option>
                <option value="Escalated">Escalated — Requires Further Investigation</option>
              </select>
            </div>
            <div className="form-group mb-5">
              <label className="form-label">Recruiter Review Notes (Required)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Document your interpretation of the signal and reasoning for this review decision..."
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              <button
                className="btn btn-gold"
                disabled={!reviewNote.trim()}
                onClick={submitReview}
              >
                <FileText size={14} /> Submit Review Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
