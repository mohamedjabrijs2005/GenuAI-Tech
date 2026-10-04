'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Calendar, Clock, User, Mic, CheckCircle, CheckCircle2,
  Video, MapPin, FileText, X, ChevronDown, AlertCircle, Star
} from 'lucide-react';

const INTERVIEWS = [
  {
    id: 'INT-001',
    candidate: 'James Okonkwo',
    candidateId: 'c3',
    vacancy: 'Software Developer',
    interviewer: 'Sarah Connor',
    interviewerRole: 'Lead Recruiter',
    date: '2026-09-26',
    time: '14:30',
    type: 'Technical',
    mode: 'Video Call',
    focus: 'Communication, Problem Solving',
    requirements: ['Technical Communication (REQ-05)', 'Problem Solving (REQ-04)'],
    status: 'scheduled',
    evaluation: null,
  },
  {
    id: 'INT-002',
    candidate: 'Mohamed Jabri',
    candidateId: 'c1',
    vacancy: 'Software Developer',
    interviewer: 'David Park',
    interviewerRole: 'Engineering Lead',
    date: '2026-09-26',
    time: '16:00',
    type: 'Competency',
    mode: 'In-Person',
    focus: 'AWS Evidence Gap — Cloud Infrastructure',
    requirements: ['AWS Cloud Infrastructure (REQ-06)'],
    status: 'scheduled',
    evaluation: null,
  },
  {
    id: 'INT-003',
    candidate: 'Alex Rivera',
    candidateId: 'c1',
    vacancy: 'Software Developer',
    interviewer: 'David Kim',
    interviewerRole: 'Engineering Lead',
    date: '2026-09-22',
    time: '10:00',
    type: 'Technical',
    mode: 'Video Call',
    focus: 'Architecture Explanation & Technical Communication',
    requirements: ['Technical Communication (REQ-05)'],
    status: 'completed',
    evaluation: {
      criteria: [
        { label: 'Explanation Clarity', score: 5, note: 'Clear articulation of microservices trade-offs' },
        { label: 'Logical Structure', score: 4, note: 'Strong reasoning; minor gaps in real-world scaling context' },
        { label: 'Technical Vocabulary', score: 5, note: 'Accurate use of CAP theorem and consistency patterns' },
        { label: 'Response Quality', score: 4, note: 'Comprehensive answers with well-structured examples' },
      ],
      notes: 'Candidate demonstrated strong architectural thinking. Recommended for final hiring committee review.',
      submittedBy: 'David Kim',
      submittedAt: '2026-09-22 11:45',
    },
  },
  {
    id: 'INT-004',
    candidate: 'Carlos Mendez',
    candidateId: 'c3',
    vacancy: 'DevOps Engineer',
    interviewer: 'Sarah Connor',
    interviewerRole: 'Lead Recruiter',
    date: '2026-09-25',
    time: '11:00',
    type: 'Technical',
    mode: 'Video Call',
    focus: 'Kubernetes, Docker, CI/CD Pipeline',
    requirements: ['Kubernetes Infrastructure (REQ-01)', 'Container Management (REQ-02)'],
    status: 'completed',
    evaluation: {
      criteria: [
        { label: 'Technical Depth', score: 5, note: 'Deep K8s knowledge with Helm chart experience' },
        { label: 'Problem Solving', score: 4, note: 'Handled failure scenario questions well' },
        { label: 'Communication', score: 4, note: 'Clear explanation of deployment pipelines' },
        { label: 'Domain Fit', score: 5, note: 'Strong background in FinOps and cost optimization' },
      ],
      notes: 'Excellent technical candidate. All requirements mapped with strong evidence.',
      submittedBy: 'Sarah Connor',
      submittedAt: '2026-09-25 12:00',
    },
  },
  {
    id: 'INT-005',
    candidate: 'Sara Kim',
    candidateId: 'c4',
    vacancy: 'Product Designer',
    interviewer: 'Lisa Chen',
    interviewerRole: 'Design Director',
    date: '2026-09-27',
    time: '10:00',
    type: 'Portfolio',
    mode: 'Video Call',
    focus: 'UX Research, Figma Prototyping, Design Thinking',
    requirements: ['UX Research (REQ-01)', 'Prototyping (REQ-03)'],
    status: 'scheduled',
    evaluation: null,
  },
];

const TYPE_COLOR: Record<string, string> = {
  Technical: 'badge-blue',
  Competency: 'badge-purple',
  Portfolio: 'badge-indigo',
  Structured: 'badge-yellow',
};

const MODE_ICON: Record<string, React.ReactNode> = {
  'Video Call': <Video size={12} />,
  'In-Person': <MapPin size={12} />,
};

export default function InterviewsPage() {
  const today = INTERVIEWS.filter(i => i.date === '2026-09-26');
  const upcoming = INTERVIEWS.filter(i => i.date > '2026-09-26');
  const past = INTERVIEWS.filter(i => i.date < '2026-09-26');

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<typeof INTERVIEWS[0] | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);

  const scheduled = INTERVIEWS.filter(i => i.status === 'scheduled').length;
  const completed = INTERVIEWS.filter(i => i.status === 'completed').length;

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Candidates</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Interviews</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Structured Interviews</h1>
            <p className="page-subtitle">
              Schedule and evaluate structured candidate interviews — each mapped to specific role requirements.
            </p>
          </div>
          <button className="btn btn-gold" onClick={() => setShowScheduleModal(true)}>
            <Plus size={15} /> Schedule Interview
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Interviews</div>
          <div className="text-2xl font-extrabold text-slate-900">{INTERVIEWS.length}</div>
          <div className="text-xs text-slate-500 mt-1">This hiring cycle</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheduled</div>
          <div className="text-2xl font-extrabold text-amber-900">{scheduled}</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting completion</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Completed</div>
          <div className="text-2xl font-extrabold text-emerald-700">{completed}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Evaluations recorded</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Evaluation Pending</div>
          <div className="text-2xl font-extrabold text-slate-900">0</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting submission</div>
        </div>
      </div>

      {/* Today */}
      {today.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}>
            Today — {today[0].date}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {today.map(i => (
              <InterviewCard
                key={i.id}
                interview={i}
                highlight
                onEvaluate={() => { setSelectedInterview(i); setShowEvalModal(true); }}
              />
            ))}
          </div>
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="section-title">Upcoming</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {upcoming.map(i => (
              <InterviewCard
                key={i.id}
                interview={i}
                onEvaluate={() => { setSelectedInterview(i); setShowEvalModal(true); }}
              />
            ))}
          </div>
        </>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <div className="section-title">Completed Interviews</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {past.map(i => (
              <InterviewCard
                key={i.id}
                interview={i}
                onEvaluate={() => { setSelectedInterview(i); setShowEvalModal(true); }}
              />
            ))}
          </div>
        </>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', padding: 28, width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="card-title">Schedule New Interview</h2>
                <p className="card-subtitle mt-1">Each interview must be mapped to specific role requirements</p>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowScheduleModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Candidate</label>
                <select className="form-select">
                  <option>Alex Rivera — Software Developer</option>
                  <option>James Okonkwo — Software Developer</option>
                  <option>Aisha Rahman — Software Developer</option>
                  <option>Sara Kim — Product Designer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Interview Type</label>
                <select className="form-select">
                  <option>Technical</option>
                  <option>Competency</option>
                  <option>Portfolio</option>
                  <option>Structured Interview</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" defaultValue="2026-09-28" />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" type="time" defaultValue="10:00" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Interviewer</label>
                <select className="form-select">
                  <option>Sarah Connor (Lead Recruiter)</option>
                  <option>David Kim (Engineering Lead)</option>
                  <option>Lisa Chen (Design Director)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Interview Mode</label>
                <select className="form-select">
                  <option>Video Call</option>
                  <option>In-Person</option>
                  <option>Phone</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Requirements to Evaluate</label>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  {['Java (Core & OOP) — REQ-01', 'DSA — REQ-02', 'Problem Solving — REQ-04', 'Communication — REQ-05', 'AWS Cloud (Evidence Gap) — REQ-06'].map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" defaultChecked={r.includes('Communication') || r.includes('AWS')} />
                      <span className="font-medium text-slate-700">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Interview Focus / Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Focus on AWS evidence gap — ask structured cloud scenario questions"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={() => setShowScheduleModal(false)}>
                <Calendar size={15} /> Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation View Modal */}
      {showEvalModal && selectedInterview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowEvalModal(false)}
        >
          <div
            style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', padding: 28, width: '100%', maxWidth: 580, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="card-title">{selectedInterview.id} — Interview Evaluation</h2>
                <p className="card-subtitle">{selectedInterview.candidate} · {selectedInterview.type} · {selectedInterview.date}</p>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowEvalModal(false)}>
                <X size={16} />
              </button>
            </div>

            {selectedInterview.evaluation ? (
              /* Completed evaluation view */
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Evaluation submitted by <strong>{selectedInterview.evaluation.submittedBy}</strong> on {selectedInterview.evaluation.submittedAt}
                </div>

                <div className="space-y-2.5">
                  {selectedInterview.evaluation.criteria.map((c) => (
                    <div key={c.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{c.label}</span>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={14} fill={n <= c.score ? '#d4af37' : 'none'} stroke={n <= c.score ? '#d4af37' : '#cbd5e1'} />
                          ))}
                          <span className="text-xs font-bold text-amber-900 ml-1">{c.score}/5</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{c.note}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs font-bold text-slate-700 mb-1.5">Interviewer Summary Notes</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedInterview.evaluation.notes}</p>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  This evaluation serves as supporting evidence for <strong>{selectedInterview.requirements.join(', ')}</strong>.
                  The final hiring decision remains with the company recruiter.
                </div>
              </div>
            ) : (
              /* Record new evaluation */
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Requirements Under Evaluation</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedInterview.requirements.map(r => (
                    <span key={r} className="badge badge-yellow text-[11px]">{r}</span>
                  ))}
                </div>
                {['Explanation Clarity', 'Logical Structure', 'Technical Vocabulary', 'Response Quality'].map(crit => (
                  <div key={crit} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{crit}</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} className="p-0.5 rounded hover:bg-amber-100 transition">
                            <Star size={16} stroke="#d4af37" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      className="form-input text-xs"
                      placeholder={`Notes on ${crit.toLowerCase()}...`}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Overall Interviewer Notes</label>
                  <textarea className="form-input" rows={3} placeholder="Summarize the candidate's performance against the requirement rubric..." />
                </div>
                <div className="flex gap-3 justify-end">
                  <button className="btn btn-secondary" onClick={() => setShowEvalModal(false)}>Cancel</button>
                  <button className="btn btn-gold" onClick={() => setShowEvalModal(false)}>
                    <FileText size={14} /> Submit Evaluation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewCard({
  interview: i,
  highlight,
  onEvaluate,
}: {
  interview: typeof INTERVIEWS[0];
  highlight?: boolean;
  onEvaluate: () => void;
}) {
  return (
    <div className="card" style={{
      padding: '16px 22px',
      borderLeft: `3px solid ${i.status === 'completed' ? 'var(--success)' : highlight ? '#d4af37' : 'var(--border)'}`,
    }}>
      <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
        {/* Time block */}
        <div style={{ minWidth: 70, flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: highlight ? '#a16207' : 'var(--text-primary)', lineHeight: 1.2 }}>{i.time}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{i.date}</div>
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Link href={`/dashboard/candidates/${i.candidateId}`} className="font-extrabold text-slate-900 text-sm hover:text-amber-900 transition">
              {i.candidate}
            </Link>
            <span className="badge badge-gray text-[11px]">{i.vacancy}</span>
            <span className={`badge ${TYPE_COLOR[i.type] || 'badge-gray'} text-[11px]`}>{i.type}</span>
            <span className="badge badge-gray text-[11px] flex items-center gap-1">
              {MODE_ICON[i.mode]} {i.mode}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Mic size={11} />
            <span>Focus: <strong className="text-slate-700">{i.focus}</strong></span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Interviewer: <span className="font-semibold text-slate-600">{i.interviewer}</span>
            <span className="opacity-40 mx-1.5">·</span>
            {i.interviewerRole}
            <span className="opacity-40 mx-1.5">·</span>
            {i.id}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {i.status === 'completed' ? (
            <>
              <span className="badge badge-green font-bold text-xs flex items-center gap-1">
                <CheckCircle size={12} /> Completed
              </span>
              <button className="btn btn-gold btn-sm" onClick={onEvaluate}>
                View Evaluation
              </button>
            </>
          ) : (
            <>
              <span className="badge badge-yellow font-bold text-xs flex items-center gap-1">
                <Clock size={12} /> Scheduled
              </span>
              <button className="btn btn-secondary btn-sm" onClick={onEvaluate}>
                Record Evaluation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Requirements row */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Requirements:</span>
        {i.requirements.map(r => (
          <span key={r} className="text-[11px] px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-full font-medium">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
