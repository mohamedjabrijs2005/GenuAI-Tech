'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2, AlertCircle, Clock, XCircle, MinusCircle,
  RefreshCw, ChevronDown, ChevronUp, Info, Shield
} from 'lucide-react';
import { EvidenceService, CoverageMatrix, CoverageSnapshot } from '@/lib/dataService';
import { DataService, Candidate } from '@/lib/dataService';
import toast from 'react-hot-toast';

const COVERAGE_STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'Supporting': {
    label: 'Supporting Evidence', icon: CheckCircle2,
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
  },
  'Pending': {
    label: 'Pending Evidence', icon: Clock,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
  },
  'Limited': {
    label: 'Limited Evidence', icon: AlertCircle,
    color: '#b45309', bg: '#fef3c7', border: '#fde68a',
  },
  'Gap': {
    label: 'Evidence Gap', icon: XCircle,
    color: '#ba1a1a', bg: '#ffdad6', border: '#fecaca',
  },
  'Evidence Gap': {
    label: 'Evidence Gap', icon: XCircle,
    color: '#ba1a1a', bg: '#ffdad6', border: '#fecaca',
  },
  'Not Applicable': {
    label: 'Not Applicable', icon: MinusCircle,
    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0',
  },
};

function CoverageBar({ snapshot }: { snapshot: CoverageSnapshot }) {
  const total = snapshot.total_requirements || 1;
  const sections = [
    { count: snapshot.supporting_count, color: '#059669', label: 'Supporting' },
    { count: snapshot.limited_count, color: '#b45309', label: 'Limited' },
    { count: snapshot.pending_count, color: '#d97706', label: 'Pending' },
    { count: snapshot.gap_count, color: '#ba1a1a', label: 'Gap' },
    { count: snapshot.na_count, color: '#94a3b8', label: 'N/A' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: '#e5e7eb', marginBottom: 8 }}>
        {sections.map((s, i) =>
          s.count > 0 ? (
            <div key={i} style={{ width: `${(s.count / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.count}`} />
          ) : null
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {sections.filter(s => s.count > 0).map((s, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}: {s.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function MatrixRow({ row, onUpdateNote }: { row: CoverageMatrix; onUpdateNote: (evidenceId: string, notes: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editNote, setEditNote] = useState(row.evidence?.notes || '');
  const cfg = COVERAGE_STATUS_CONFIG[row.coverage_status] || COVERAGE_STATUS_CONFIG['Pending'];
  const Icon = cfg.icon;

  return (
    <div style={{ border: `1px solid ${cfg.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: cfg.bg, cursor: 'pointer', gap: 12 }}
        onClick={() => setExpanded(e => !e)}
      >
        <Icon size={16} color={cfg.color} style={{ flexShrink: 0 }} />

        {/* Requirement info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1e293b' }}>{row.requirement.name}</span>
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 600,
              background: row.requirement.req_type === 'Required' ? '#fee2e2' : '#f0fdf4',
              color: row.requirement.req_type === 'Required' ? '#991b1b' : '#166534',
            }}>{row.requirement.req_type}</span>
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: '#f1f5f9', color: '#475569',
            }}>{row.requirement.category}</span>
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: row.requirement.priority === 'High' ? '#fef3c7' : row.requirement.priority === 'Low' ? '#f8fafc' : '#f0f9ff',
              color: row.requirement.priority === 'High' ? '#92400e' : row.requirement.priority === 'Low' ? '#64748b' : '#0369a1',
            }}>
              {row.requirement.priority} Priority
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {row.requirement.eval_method} · {row.requirement.proficiency}
          </div>
        </div>

        {/* Evidence status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          }}>{cfg.label}</span>
          {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: 16, background: '#fff', borderTop: `1px solid ${cfg.border}` }}>
          {row.evidence ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Source</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{row.evidence.source_type}</div>
              </div>
              {row.evidence.score !== null && row.evidence.score !== undefined && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Assessment Score</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{row.evidence.score}%
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                      (score on assessment — not a hiring suitability score)
                    </span>
                  </div>
                </div>
              )}
              {row.evidence.eval_group_name && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Evaluation Group</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{row.evidence.eval_group_name}</div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Recruiter Note</div>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  onBlur={() => { if (row.evidence?.id) onUpdateNote(row.evidence.id, editNote); }}
                  placeholder="Add a note about this evidence..."
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
                    fontSize: 13, color: '#334155', resize: 'vertical', fontFamily: 'inherit',
                    background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
              <Info size={14} color="#ba1a1a" />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>
                Evidence Gap — sufficient supporting evidence is currently unavailable for this requirement.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoverageGapsContent() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('appId');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(appId || '');
  const [matrix, setMatrix] = useState<CoverageMatrix[]>([]);
  const [snapshot, setSnapshot] = useState<CoverageSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    DataService.getCandidates().then(setCandidates);
  }, []);

  const loadMatrix = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    const { matrix: m, coverage } = await EvidenceService.getCoverageMatrix(id);
    setMatrix(m);
    setSnapshot(coverage);
    setLoading(false);
  }, []);

  useEffect(() => { if (selectedAppId) loadMatrix(selectedAppId); }, [selectedAppId, loadMatrix]);

  const handleGenerate = async () => {
    if (!selectedAppId) return;
    setGenerating(true);
    try {
      const r = await EvidenceService.generateEvidence(selectedAppId);
      toast.success(`${r.generated} evidence records generated`);
      await loadMatrix(selectedAppId);
    } catch {
      toast.error('Failed to generate evidence');
    } finally { setGenerating(false); }
  };

  const handleRecompute = async () => {
    if (!selectedAppId) return;
    const cov = await EvidenceService.recomputeCoverage(selectedAppId);
    if (cov) { setSnapshot(cov); toast.success('Coverage recomputed'); }
  };

  const handleUpdateNote = async (evidenceId: string, notes: string) => {
    await EvidenceService.updateEvidence(evidenceId, { notes });
  };

  const filtered = filterStatus === 'all' ? matrix
    : matrix.filter(r => (r.coverage_status || '').toLowerCase().includes(filterStatus.toLowerCase()));

  const requiredGaps = matrix.filter(r => r.requirement.req_type === 'Required' && (r.coverage_status === 'Gap' || r.coverage_status === 'Evidence Gap')).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1623', margin: 0 }}>Evidence Coverage &amp; Gaps</h1>
        <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
          Requirement-linked evidence mapping per candidate application.
        </p>
      </div>

      {/* Candidate selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
            Candidate Application
          </label>
          <select
            value={selectedAppId}
            onChange={e => setSelectedAppId(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13.5, color: '#1e293b', background: '#fff', outline: 'none' }}
          >
            <option value="">Select a candidate…</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.vacancy}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleGenerate} disabled={!selectedAppId || generating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !selectedAppId || generating ? 0.5 : 1 }}>
            {generating ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            Generate Evidence
          </button>
          <button onClick={handleRecompute} disabled={!selectedAppId}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer', opacity: !selectedAppId ? 0.5 : 1 }}>
            <RefreshCw size={13} /> Recompute
          </button>
        </div>
      </div>

      {/* Coverage snapshot */}
      {snapshot && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Evidence Coverage</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: snapshot.coverage_pct >= 70 ? '#059669' : snapshot.coverage_pct >= 40 ? '#d97706' : '#ba1a1a' }}>
                {snapshot.coverage_pct.toFixed(0)}%
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>
                {snapshot.supporting_count} of {snapshot.total_requirements} requirements have supporting evidence
              </div>
            </div>
            {requiredGaps > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                <Shield size={14} color="#ba1a1a" />
                <span style={{ fontSize: 12.5, color: '#7f1d1d', fontWeight: 600 }}>
                  {requiredGaps} required requirement{requiredGaps !== 1 ? 's' : ''} with evidence gap
                </span>
              </div>
            )}
          </div>
          <CoverageBar snapshot={snapshot} />
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 20 }}>
        <Info size={14} color="#0369a1" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12.5, color: '#0c4a6e', margin: 0 }}>
          Assessment Score ≠ Evidence ≠ Hiring Decision. Evidence indicates whether a candidate has demonstrated capability
          relative to a specific requirement. The final hiring decision must remain human-led.
        </p>
      </div>

      {/* Filter tabs */}
      {matrix.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'Supporting', 'Pending', 'Limited', 'Gap', 'Not Applicable'].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                background: filterStatus === f ? 'var(--brand)' : '#fff',
                color: filterStatus === f ? '#fff' : '#64748b',
              }}>
              {f === 'all' ? `All (${matrix.length})` : `${f} (${matrix.filter(r => r.coverage_status?.includes(f) || r.evidence?.status === f).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Matrix */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <div style={{ fontSize: 13 }}>Loading evidence matrix…</div>
        </div>
      ) : !selectedAppId ? (
        <div style={{ textAlign: 'center', padding: 64, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
          <Shield size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Select a candidate to view their evidence coverage matrix</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            {matrix.length === 0 ? 'No requirements or evidence found. Click "Generate Evidence" to initialise.' : 'No records match the selected filter.'}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((row, i) => (
            <MatrixRow key={row.requirement.id || i} row={row} onUpdateNote={handleUpdateNote} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoverageGapsPage() {
  return (
    <Suspense fallback={<div className="page-content" style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading coverage matrix...</div>}>
      <CoverageGapsContent />
    </Suspense>
  );
}
