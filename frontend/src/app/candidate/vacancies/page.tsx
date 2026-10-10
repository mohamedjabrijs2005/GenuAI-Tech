'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Search,
  Filter,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';

export default function CandidateVacanciesPage() {
  const router = useRouter();
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetedVacancyIds, setTargetedVacancyIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [workMode, setWorkMode] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get('/candidate-portal/vacancies', {
        params: {
          search: search || undefined,
          department: department !== 'ALL' ? department : undefined,
          level: level !== 'ALL' ? level : undefined,
          workMode: workMode !== 'ALL' ? workMode : undefined,
        },
      }),
      api.get('/candidate-portal/targets').catch(() => ({ data: { targets: [] } })),
    ])
      .then(([vacRes, targetRes]) => {
        if (!isMounted) return;
        setVacancies(vacRes.data?.vacancies || []);
        const targetIds = new Set<string>((targetRes.data?.targets || []).map((t: any) => t.vacancy_id));
        setTargetedVacancyIds(targetIds);
      })
      .catch((err) => {
        console.error('Failed to load published vacancies:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, department, level, workMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(5, 150, 105, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#86efac',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShieldCheck size={12} />
            Verified Opportunities Only
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Explore Published Vacancies
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
          Browse genuine vacancies from verified companies. Understand the exact role requirements before you commit to creating a Target Workspace.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by role title or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="input-field"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            style={{ width: 140, cursor: 'pointer' }}
          >
            <option value="ALL">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>

          <select
            className="input-field"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{ width: 140, cursor: 'pointer' }}
          >
            <option value="ALL">All Levels</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
        </div>
      </div>

      {/* Vacancy Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13, color: '#64748b' }}>Discovering verified vacancies...</div>
        </div>
      ) : vacancies.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {vacancies.map((v) => {
            const isTargeted = targetedVacancyIds.has(v.id);

            return (
              <div
                key={v.id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isTargeted ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid var(--border)',
                  background: isTargeted ? '#fffdf7' : '#ffffff',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {v.department_name || 'Engineering'}
                    </span>
                    {isTargeted && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: 'rgba(212, 175, 55, 0.2)',
                          color: '#854d0e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Target size={11} />
                        Targeted
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    {v.title}
                  </h3>

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>
                    {v.company_name}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} />
                      {v.location || 'Remote'} ({v.work_mode || 'Flexible'})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Briefcase size={13} />
                      {v.experience_level || 'Mid'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={13} />
                      {v.requirements_count || 0} Requirements
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {v.published_at ? `Published ${new Date(v.published_at).toLocaleDateString()}` : 'Active'}
                  </span>
                  <Link
                    href={`/candidate/vacancies/${v.id}`}
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>View & Target</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fafaf9', borderRadius: 12 }}>
          <Compass size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
            No Matching Vacancies Found
          </div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 420, margin: '0 auto 16px' }}>
            Try adjusting your search terms or filters. Only verified, published vacancies from approved employers are listed here.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setDepartment('ALL');
              setLevel('ALL');
              setWorkMode('ALL');
            }}
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
