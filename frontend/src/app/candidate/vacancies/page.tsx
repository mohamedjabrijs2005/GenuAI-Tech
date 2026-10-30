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
  const [interestedVacancyIds, setInterestedVacancyIds] = useState<Set<string>>(new Set());

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
      api.get('/candidate/interests').catch(() => ({ data: { interests: [] } })),
    ])
      .then(([vacRes, targetRes, interestRes]) => {
        if (!isMounted) return;
        setVacancies(vacRes.data?.vacancies || []);
        const targetIds = new Set<string>((targetRes.data?.targets || []).map((t: any) => t.vacancy_id));
        setTargetedVacancyIds(targetIds);
        const interestIds = new Set<string>(
          (interestRes.data?.interests || [])
            .filter((i: any) => i.interest_status === 'EXPRESSED')
            .map((i: any) => i.vacancy_id)
        );
        setInterestedVacancyIds(interestIds);
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
          background: '#ffffff',
          borderRadius: 12,
          padding: '24px 28px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              fontSize: 11,
              fontWeight: 700,
              color: '#059669',
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
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Explore Published Vacancies
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, maxWidth: 650 }}>
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
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 320px', minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input input-field"
              placeholder="Search by role title or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 40, height: 42, fontSize: 13.5 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-select input-field"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            style={{ width: 150, height: 42, cursor: 'pointer', fontSize: 13 }}
          >
            <option value="ALL">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>

          <select
            className="form-select input-field"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{ width: 140, height: 42, cursor: 'pointer', fontSize: 13 }}
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
            const isInterested = interestedVacancyIds.has(v.id);

            return (
              <div
                key={v.id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isTargeted ? '1px solid rgba(212, 175, 55, 0.4)' : isInterested ? '1px solid #fde68a' : '1px solid var(--border)',
                  background: isTargeted ? '#fffdf7' : isInterested ? '#fefce8' : '#ffffff',
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
                    {isTargeted ? (
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
                    ) : isInterested ? (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Sparkles size={11} />
                        Interested
                      </span>
                    ) : null}
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
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            No published vacancies are currently available.
          </div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 440, margin: '0 auto 16px' }}>
            Only verified, published vacancies from approved employers are listed here. Check back soon or reset your filters.
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
