'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Calendar, Clock, User, Mic, CheckCircle, CheckCircle2,
  Video, MapPin, FileText, X, ChevronDown, AlertCircle, Star, Sparkles
} from 'lucide-react';
import { DataService, InterviewRecord, Candidate, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState<InterviewRecord | null>(null);

  // Form state
  const [formCandidate, setFormCandidate] = useState('');
  const [formVacancy, setFormVacancy] = useState('');
  const [formInterviewer, setFormInterviewer] = useState('Alex Mercer (Lead Architect)');
  const [formDate, setFormDate] = useState('2026-10-04');
  const [formTime, setFormTime] = useState('14:00 - 15:00 UTC');
  const [formType, setFormType] = useState<InterviewRecord['type']>('Technical Interview');
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    const [iData, cData, vData] = await Promise.all([
      DataService.getInterviews(),
      DataService.getCandidates(),
      DataService.getVacancies(),
    ]);
    setInterviews(iData);
    setCandidates(cData);
    setVacancies(vData);
    if (cData.length > 0 && !formCandidate) {
      setFormCandidate(cData[0].name);
      setFormVacancy(cData[0].vacancy);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate) {
      toast.error('Candidate is required');
      return;
    }
    await DataService.scheduleInterview({
      candidateName: formCandidate,
      vacancy: formVacancy || 'Senior Backend Engineer',
      interviewer: formInterviewer,
      date: formDate,
      time: formTime,
      type: formType,
      notes: formNotes,
    });
    toast.success('Interview scheduled with automated calendar invite');
    setIsScheduleOpen(false);
    setFormNotes('');
    await loadData();
  };

  const filtered = interviews.filter(i => {
    if (filter === 'scheduled') return i.status === 'Scheduled';
    if (filter === 'completed') return i.status === 'Completed';
    return true;
  });

  return (
    <div className="page-content">
      {/* Header with single primary action */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Interviews</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Structured Interview Sessions
            </h1>
            <p className="page-subtitle">Evidence-based competency interviews, calibrated rubrics, and automated scorecards.</p>
          </div>
          <button onClick={() => setIsScheduleOpen(true)} className="btn btn-gold">
            <Plus size={16} />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Upcoming Scheduled', value: interviews.filter(i => i.status === 'Scheduled').length, color: 'var(--brand-light)', cardClass: 'stat-card-gold' },
          { label: 'Completed Rubrics', value: interviews.filter(i => i.status === 'Completed').length, color: 'var(--success)', cardClass: 'stat-card-success' },
          { label: 'Average Competency Score', value: '91%', color: 'var(--warning)', cardClass: 'stat-card-warning' },
          { label: 'Evidence Gap Fill Rate', value: '94%', color: 'var(--text-muted)', cardClass: 'stat-card-brand' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cardClass}`} style={{ padding: '16px 20px' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="filter-bar">
        <div className="flex gap-2">
          {(['all', 'scheduled', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? `All Sessions (${interviews.length})` : `${f} (${interviews.filter(i => i.status.toLowerCase() === f).length})`}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing <strong>{filtered.length}</strong> interview session(s)
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid-2" style={{ gap: 16 }}>
        {filtered.map(i => (
          <div key={i.id} className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="flex items-center gap-2.5">
                <div className="avatar avatar-sm">
                  {i.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{i.candidateName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{i.vacancy}</div>
                </div>
              </div>
              <span className={`badge ${i.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                {i.status}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div className="flex items-center justify-between">
                <span className="td-muted">Format:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="td-muted">Time &amp; Date:</span>
                <span className="td-mono font-semibold">{i.date} • {i.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="td-muted">Interviewer:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.interviewer}</span>
              </div>
              {i.score && (
                <div className="flex items-center justify-between" style={{ paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
                  <span className="td-muted">Evaluated Score:</span>
                  <span className="td-mono font-bold text-emerald-600">{i.score}%</span>
                </div>
              )}
            </div>

            {i.notes && (
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                <strong>Focus:</strong> {i.notes}
              </p>
            )}

            <div className="flex items-center justify-between" style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              {i.meetingLink ? (
                <a href={i.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }}>
                  <Video size={13} />
                  <span>Join Room</span>
                </a>
              ) : (
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>In-person session</span>
              )}

              <button
                onClick={() => setIsScorecardOpen(i)}
                className="btn btn-gold btn-sm"
                style={{ fontSize: 11.5 }}
              >
                <FileText size={13} />
                <span>{i.status === 'Completed' ? 'View Scorecard' : 'Score Candidate'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Schedule Structured Interview</div>
                <div className="modal-subtitle">Calibrate competency requirements and interviewer assignment</div>
              </div>
              <button onClick={() => setIsScheduleOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Candidate *</label>
                  <select
                    value={formCandidate}
                    onChange={e => {
                      setFormCandidate(e.target.value);
                      const c = candidates.find(item => item.name === e.target.value);
                      if (c) setFormVacancy(c.vacancy);
                    }}
                    className="form-select"
                  >
                    {candidates.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.vacancy})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Interview Type</label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="Technical Interview">Technical Interview</option>
                      <option value="Competency Review">Competency Review</option>
                      <option value="Final Executive">Final Executive</option>
                      <option value="Hiring Manager">Hiring Manager</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Interviewer</label>
                  <input
                    type="text"
                    value={formInterviewer}
                    onChange={e => setFormInterviewer(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Competency Focus &amp; Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="e.g. Distributed consensus, concurrency, and architecture trade-offs"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scorecard Modal */}
      {isScorecardOpen && (
        <div className="modal-overlay" onClick={() => setIsScorecardOpen(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Evidence Scorecard: {isScorecardOpen.candidateName}</div>
                <div className="modal-subtitle">{isScorecardOpen.vacancy} • {isScorecardOpen.type}</div>
              </div>
              <button onClick={() => setIsScorecardOpen(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>Rubric Evaluation Items:</div>
                <ul style={{ margin: '8px 0 0 18px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <li>Core algorithmic reasoning and complexity bounds (5/5)</li>
                  <li>Architecture explanation and microservices trade-offs (4.5/5)</li>
                  <li>Technical communication &amp; active listening (5/5)</li>
                </ul>
              </div>

              <div className="card" style={{ padding: 14 }}>
                <div className="stat-label">Evaluated Aggregate Score</div>
                <div className="stat-value text-emerald-600" style={{ fontSize: 24 }}>
                  {isScorecardOpen.score ? `${isScorecardOpen.score}%` : '92% (Exceeds Bar)'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsScorecardOpen(null)} className="btn btn-gold btn-sm">
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
