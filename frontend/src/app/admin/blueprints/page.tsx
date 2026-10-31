'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface BlueprintSuggestion {
  id: string;
  company_id: string;
  company_name: string;
  role_title: string;
  role_description?: string;
  suggested_skills: any[];
  suggested_learning_paths: any[];
  ai_model: string;
  prompt_version: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  review_notes?: string;
  created_at: string;
  reviewer_first?: string;
  reviewer_last?: string;
}

export default function AdminBlueprintsPage() {
  const [suggestions, setSuggestions] = useState<BlueprintSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/ai-suggestions');
      setSuggestions(res.data?.suggestions || []);
    } catch (err: any) {
      toast.error('Failed to load blueprint suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleReview = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post(`/admin/ai-suggestions/${id}/review`, {
        status: newStatus,
        reviewNotes: `Reviewed and ${newStatus.toLowerCase()} by Platform Admin Console`,
      });
      toast.success(`Blueprint ${newStatus.toLowerCase()} successfully`);
      fetchSuggestions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update blueprint');
    }
  };

  const filtered = suggestions.filter((s) => {
    const matchesStatus = filterStatus === 'all' || s.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      s.role_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScrollText size={22} style={{ color: '#b8860b' }} />
          AI Role Blueprint Governance Console
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Platform-level audit and compliance review of AI-generated role blueprints across all tenant companies.
        </p>
      </div>

      {/* Safety Notice */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <AlertCircle size={18} style={{ color: '#b8860b', flexShrink: 0 }} />
        <div>
          <strong>Platform Safety Rule:</strong> AI suggestions are created as DRAFT. Only approved blueprints generate active requirements for candidate assessment and learning pathways.
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Filter by role title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                paddingLeft: 32,
                fontSize: 13,
                background: '#fff',
              }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              height: 38,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              padding: '0 12px',
              fontSize: 13,
              background: '#fff',
              fontWeight: 600,
            }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">DRAFT</option>
            <option value="approved">APPROVED</option>
            <option value="rejected">REJECTED</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchSuggestions}
          style={{
            height: 38,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table / List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Loading AI blueprint records...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No blueprint suggestions found matching current filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid #f1f5f9' }}>
            {filtered.map((s) => {
              const isExpanded = expandedId === s.id;
              const skillsCount = Array.isArray(s.suggested_skills) ? s.suggested_skills.length : 0;
              return (
                <div key={s.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{s.role_title}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            textTransform: 'uppercase',
                            background: s.status === 'APPROVED' ? '#ecfdf5' : s.status === 'REJECTED' ? '#fef2f2' : '#fef9c3',
                            color: s.status === 'APPROVED' ? '#059669' : s.status === 'REJECTED' ? '#dc2626' : '#a16207',
                          }}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={13} /> {s.company_name}
                        </span>
                        <span>{skillsCount} Skills</span>
                        <span>Model: {s.ai_model} ({s.prompt_version})</span>
                        <span>Created: {new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        style={{
                          height: 32,
                          padding: '0 10px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details
                      </button>

                      {s.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReview(s.id, 'APPROVED')}
                            style={{
                              height: 32,
                              padding: '0 12px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#059669',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(s.id, 'REJECTED')}
                            style={{
                              height: 32,
                              padding: '0 12px',
                              borderRadius: 6,
                              border: '1px solid #fecaca',
                              background: '#fff',
                              color: '#dc2626',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #e2e8f0', background: '#fafaf9', padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Suggested Skills Roster:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(Array.isArray(s.suggested_skills) ? s.suggested_skills : []).map((sk: any, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11.5,
                              padding: '4px 9px',
                              borderRadius: 6,
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              color: '#0f172a',
                            }}
                          >
                            <strong>{sk.name}</strong> ({sk.importance || 'Must-have'})
                          </span>
                        ))}
                      </div>
                      {s.review_notes && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
                          <strong>Review Notes:</strong> {s.review_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
