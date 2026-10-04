'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Shield, Eye, CheckCircle2, X,
  FileText, Clock, ChevronDown, ShieldAlert, MonitorOff,
  Clipboard, UserX, RefreshCw, Plus
} from 'lucide-react';
import { DataService, IntegrityRecord, Candidate } from '@/lib/dataService';
import toast from 'react-hot-toast';

const SEVERITY_COLOR: Record<string, string> = {
  none: 'text-slate-400',
  low: 'text-amber-600',
  medium: 'text-orange-600',
  high: 'text-red-700',
};

const SEVERITY_BG: Record<string, string> = {
  none: 'bg-slate-50 border-slate-200 text-slate-600',
  low: 'bg-amber-50 border-amber-200 text-amber-800',
  medium: 'bg-orange-50 border-orange-200 text-orange-800',
  high: 'bg-red-50 border-red-200 text-red-800',
};

export default function IntegrityPage() {
  const [records, setRecords] = useState<IntegrityRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'unreviewed' | 'reviewed'>('all');
  const [selectedIncident, setSelectedIncident] = useState<IntegrityRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<IntegrityRecord['reviewStatus']>('Reviewed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Signal Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [newCandidateId, setNewCandidateId] = useState('');
  const [newSignalType, setNewSignalType] = useState('Tab Switch / Focus Lost');
  const [newSeverity, setNewSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newDetails, setNewDetails] = useState('');
  const [isLoggingSignal, setIsLoggingSignal] = useState(false);

  const loadData = async () => {
    const [data, candData] = await Promise.all([
      DataService.getIntegrityRecords(),
      DataService.getCandidates().catch(() => []),
    ]);
    setRecords(data);
    setCandidatesList(candData || []);
    if (candData?.length && !newCandidateId) {
      setNewCandidateId(candData[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalIncidents = records.length;
  const unreviewedCount = records.filter(r => r.reviewStatus === 'Unreviewed').length;
  const reviewedCount = records.filter(r => r.reviewStatus === 'Reviewed').length;

  const filtered = records.filter(r => {
    if (filter === 'unreviewed') return r.reviewStatus === 'Unreviewed';
    if (filter === 'reviewed') return r.reviewStatus === 'Reviewed';
    return true;
  });

  const handleReviewSubmit = async () => {
    if (!selectedIncident) return;
    setIsSubmitting(true);
    try {
      await DataService.updateIntegrityStatus(selectedIncident.id, reviewAction, reviewNote);
      toast.success(`Incident status updated to ${reviewAction}`);
      setSelectedIncident(null);
      setReviewNote('');
      await loadData();
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateId) {
      toast.error('Please select an application / candidate');
      return;
    }
    setIsLoggingSignal(true);
    try {
      await DataService.createIntegritySignal({
        applicationId: newCandidateId,
        signalType: newSignalType,
        severity: newSeverity,
        details: { context: newDetails || 'Automated assessment telemetry trigger' },
      });
      toast.success('Integrity telemetry event logged successfully');
      setShowLogModal(false);
      setNewDetails('');
      await loadData();
    } catch {
      toast.error('Failed to log integrity event');
    } finally {
      setIsLoggingSignal(false);
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Integrity</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Proctoring Telemetry</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Assessment Integrity Signals
            </h1>
            <p className="page-subtitle">Multi-modal proctoring logs, environment telemetry, and human review sign-offs.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLogModal(true)} className="btn btn-gold btn-sm">
              <Plus size={14} />
              <span>Log Telemetry Signal</span>
            </button>
            <button onClick={loadData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Assessments Monitored', value: '104', color: 'var(--text-primary)', cardClass: 'stat-card-gold' },
          { label: 'Integrity Signals Detected', value: totalIncidents, color: 'var(--warning)', cardClass: 'stat-card-warning' },
          { label: 'Pending Human Review', value: unreviewedCount, color: 'var(--danger)', cardClass: 'stat-card-brand' },
          { label: 'Audited & Cleared', value: reviewedCount, color: 'var(--success)', cardClass: 'stat-card-success' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cardClass}`} style={{ padding: '16px 20px' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <div className="flex gap-2">
          {(['all', 'unreviewed', 'reviewed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'All Incidents' : `${f} (${records.filter(r => r.reviewStatus.toLowerCase() === f).length})`}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing <strong>{filtered.length}</strong> incident log(s)
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Candidate</th>
              <th>Vacancy</th>
              <th>Assessment Date</th>
              <th>Signal Summary</th>
              <th>Review Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const activeSignals = r.signals.filter(s => s.count > 0);
              return (
                <tr key={r.id}>
                  <td className="td-mono font-semibold" style={{ color: 'var(--brand-light)' }}>
                    {r.incidentId}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                  </td>
                  <td className="td-muted">{r.vacancy}</td>
                  <td className="td-muted td-mono">{r.assessmentDate}</td>
                  <td>
                    <div className="flex gap-1.5" style={{ flexWrap: 'wrap' }}>
                      {activeSignals.length === 0 ? (
                        <span className="badge badge-green">Zero Signals (Clean)</span>
                      ) : (
                        activeSignals.map((s, idx) => (
                          <span
                            key={idx}
                            className={`badge ${
                              s.severity === 'medium' ? 'badge-yellow' : s.severity === 'high' ? 'badge-red' : 'badge-gray'
                            }`}
                          >
                            {s.type} ({s.count})
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${r.reviewStatus === 'Reviewed' ? 'badge-green' : 'badge-yellow'}`}>
                      {r.reviewStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedIncident(r);
                        setReviewAction(r.reviewStatus === 'Unreviewed' ? 'Reviewed' : r.reviewStatus);
                        setReviewNote(r.reviewNote || '');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={13} />
                      <span>Audit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Incident Review Modal */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Integrity Audit: {selectedIncident.incidentId}</div>
                <div className="modal-subtitle">{selectedIncident.name} • {selectedIncident.vacancy}</div>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Telemetry Events:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedIncident.signals.map((s, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.type}</div>
                      {s.context && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{s.context}</div>}
                    </div>
                    <span className={`badge ${s.count === 0 ? 'badge-green' : s.severity === 'medium' ? 'badge-yellow' : 'badge-red'}`}>
                      {s.count} occurrence(s)
                    </span>
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Review Decision *</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value as any)}
                  className="form-select"
                >
                  <option value="Reviewed">Reviewed & Cleared (No Malicious Intent)</option>
                  <option value="Dismissed">Dismissed (False Positive)</option>
                  <option value="Escalated">Escalate to Senior Panel</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Review Audit Notes</label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Record justification and notes for GDPR / SOC2 audit compliance..."
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedIncident(null)} className="btn btn-secondary btn-sm" disabled={isSubmitting}>
                Cancel
              </button>
              <button onClick={handleReviewSubmit} className="btn btn-gold btn-sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Audit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Telemetry Signal Modal */}
      {showLogModal && (
        <div className="modal-backdrop" onClick={() => setShowLogModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Log Assessment Telemetry Signal</div>
                <div className="modal-subtitle">Inject real-time integrity event into candidate assessment stream</div>
              </div>
              <button onClick={() => setShowLogModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSignal}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Target Candidate / Application *</label>
                  <select
                    className="form-select"
                    value={newCandidateId}
                    onChange={e => setNewCandidateId(e.target.value)}
                    required
                  >
                    {candidatesList.length === 0 ? (
                      <option value="">No applications found</option>
                    ) : (
                      candidatesList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.vacancy} ({c.stage})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Signal Telemetry Type *</label>
                  <select
                    className="form-select"
                    value={newSignalType}
                    onChange={e => setNewSignalType(e.target.value)}
                  >
                    <option value="Tab Switch / Focus Lost">Tab Switch / Focus Lost</option>
                    <option value="Copy / Paste Outside Buffer">Copy / Paste Outside Buffer</option>
                    <option value="Multiple Persons Detected">Multiple Persons Detected</option>
                    <option value="Camera Feed Obscured">Camera Feed Obscured</option>
                    <option value="Secondary Audio Source Detected">Secondary Audio Source Detected</option>
                    <option value="Velocity Anomaly (Unusual Completion Speed)">Velocity Anomaly (Unusual Completion Speed)</option>
                    <option value="Code Plagiarism Heuristic Match">Code Plagiarism Heuristic Match</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Severity Level *</label>
                  <select
                    className="form-select"
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as any)}
                  >
                    <option value="Low">Low — Informational anomaly</option>
                    <option value="Medium">Medium — Suspicious activity flag</option>
                    <option value="High">High — Substantial breach indicator</option>
                    <option value="Critical">Critical — Immediate review required</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Context / Technical Telemetry Details</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={newDetails}
                    onChange={e => setNewDetails(e.target.value)}
                    placeholder="e.g. Switched away to external browser for 42s during SQL query section..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={isLoggingSignal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold btn-sm"
                  disabled={isLoggingSignal}
                >
                  {isLoggingSignal ? 'Logging Signal...' : 'Emit Telemetry Signal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
