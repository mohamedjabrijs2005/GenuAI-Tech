'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, Lock, Plus, Trash2, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ChecklistItem {
  id?: string;
  name: string;
  importance: string;
  category?: string;
  description?: string;
}

interface ChecklistRecord {
  status: 'draft' | 'ai_generated' | 'approved' | 'locked' | string;
  version?: number;
  source?: string;
  approved_at?: string;
}

const CHECKLIST_STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  draft: { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', label: 'Draft' },
  ai_generated: { bg: '#fffbeb', color: '#854d0e', border: '#fde68a', label: 'Rules-Generated (Needs HR Approval)' },
  approved: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', label: 'HR Approved' },
  locked: { bg: '#f0fdfa', color: '#115e59', border: '#99f6e4', label: 'Locked for Candidates' },
};

export function VacancyChecklistPanel({ vacancyId }: { vacancyId: string }) {
  const [checklist, setChecklist] = useState<ChecklistRecord>({ status: 'draft' });
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newImportance, setNewImportance] = useState<'REQUIRED' | 'PREFERRED'>('REQUIRED');
  const [error, setError] = useState('');

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/vacancies/${vacancyId}/checklist`);
      setChecklist(res.data?.checklist || { status: 'draft' });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load skill checklist.');
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    if (vacancyId) loadChecklist();
  }, [vacancyId, loadChecklist]);

  const isLocked = checklist.status === 'locked';

  const handleGenerate = async () => {
    setBusy('generate');
    try {
      const res = await api.post(`/vacancies/${vacancyId}/checklist/generate`, { includeCommon: true });
      setChecklist(res.data.checklist);
      setItems(res.data.items || []);
      toast.success('Skill checklist generated from role rules');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate checklist');
    } finally {
      setBusy(null);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const nextItems = [
      ...items.map((i) => ({ name: i.name, importance: i.importance || 'REQUIRED', category: i.category || 'Technical' })),
      { name: trimmed, importance: newImportance, category: 'Technical' },
    ];
    setBusy('save');
    try {
      const res = await api.put(`/vacancies/${vacancyId}/checklist/items`, { items: nextItems });
      setChecklist(res.data.checklist);
      setItems(res.data.items || []);
      setNewSkill('');
      toast.success(`Added "${trimmed}" to checklist`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save skill');
    } finally {
      setBusy(null);
    }
  };

  const handleRemoveSkill = async (idx: number) => {
    const remaining = items
      .filter((_, i) => i !== idx)
      .map((i) => ({ name: i.name, importance: i.importance || 'REQUIRED', category: i.category || 'Technical' }));
    if (remaining.length === 0) {
      toast.error('Checklist must keep at least 1 skill.');
      return;
    }
    setBusy('save');
    try {
      const res = await api.put(`/vacancies/${vacancyId}/checklist/items`, { items: remaining });
      setChecklist(res.data.checklist);
      setItems(res.data.items || []);
      toast.success('Skill removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update checklist');
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = async () => {
    setBusy('approve');
    try {
      const res = await api.post(`/vacancies/${vacancyId}/checklist/approve`, {
        notes: 'Approved via Vacancy Skill Checklist workspace',
      });
      setChecklist(res.data.checklist);
      toast.success('Skill checklist approved by HR');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve checklist');
    } finally {
      setBusy(null);
    }
  };

  const handleLock = async () => {
    setBusy('lock');
    try {
      const res = await api.post(`/vacancies/${vacancyId}/checklist/lock`, {
        notes: 'Locked for candidate applications and proof scoring',
      });
      setChecklist(res.data.checklist);
      toast.success('Skill checklist locked for candidates');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to lock checklist');
    } finally {
      setBusy(null);
    }
  };

  const badge = CHECKLIST_STATUS_STYLE[checklist.status] || CHECKLIST_STATUS_STYLE.draft;

  if (loading) {
    return (
      <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={18} style={{ display: 'inline-block', marginRight: 8 }} />
        Loading Vacancy Skill Checklist...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Lifecycle Header & Actions */}
      <div className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Vacancy Skill Checklist ({items.length})
            </h3>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
              {badge.label}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Workflow: Generate rules checklist → Review &amp; edit skills → HR Approve → Lock before candidates apply.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isLocked && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy !== null}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} />
              <span>{busy === 'generate' ? 'Generating...' : items.length > 0 ? 'Regenerate Rules Checklist' : 'Generate Rules Checklist'}</span>
            </button>
          )}
          {!isLocked && checklist.status !== 'approved' && items.length > 0 && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={busy !== null}
              className="btn btn-gold btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={14} />
              <span>{busy === 'approve' ? 'Approving...' : 'Approve Checklist'}</span>
            </button>
          )}
          {checklist.status === 'approved' && (
            <button
              type="button"
              onClick={handleLock}
              disabled={busy !== null}
              className="btn btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f766e', color: '#ffffff', border: 'none', fontWeight: 700 }}
            >
              <Lock size={14} />
              <span>{busy === 'lock' ? 'Locking...' : 'Lock Checklist'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Add Skill Row (when not locked) */}
      {!isLocked && (
        <form onSubmit={handleAddSkill} className="card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add required or preferred skill (e.g. PostgreSQL Indexing, Docker)..."
            className="form-input"
            style={{ flex: 1, minWidth: 240, height: 38 }}
          />
          <select
            value={newImportance}
            onChange={(e) => setNewImportance(e.target.value as 'REQUIRED' | 'PREFERRED')}
            className="form-select"
            style={{ width: 150, height: 38 }}
          >
            <option value="REQUIRED">Must-have</option>
            <option value="PREFERRED">Good-to-have</option>
          </select>
          <button type="submit" disabled={busy !== null || !newSkill.trim()} className="btn btn-gold btn-sm" style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Plus size={14} /> Add Skill
          </button>
        </form>
      )}

      {/* Checklist Items */}
      {items.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={28} style={{ margin: '0 auto 10px', color: '#b8860b' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No skill checklist defined yet</div>
          <div style={{ fontSize: 13 }}>Click <strong>Generate Rules Checklist</strong> above or add skills manually.</div>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 12 }}>
          {items.map((item, idx) => {
            const isMust = String(item.importance).toUpperCase() === 'REQUIRED';
            return (
              <div
                key={item.id || `${item.name}-${idx}`}
                className="card"
                style={{
                  padding: 16,
                  borderLeft: `4px solid ${isLocked ? '#0f766e' : isMust ? '#b8860b' : '#94a3b8'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{item.name}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isMust ? '#fef3c7' : '#f1f5f9',
                        color: isMust ? '#854d0e' : '#475569',
                      }}
                    >
                      {isMust ? 'Must-have' : 'Good-to-have'}
                    </span>
                    {item.category && <span className="badge badge-gray">{item.category}</span>}
                  </div>
                  {item.description && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {item.description}
                    </p>
                  )}
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    title="Remove skill"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
