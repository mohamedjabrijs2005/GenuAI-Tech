'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass, Briefcase, Target, ShieldCheck, CheckCircle2,
  ChevronRight, ArrowRight, Layers, Building2, Search, Filter,
  Clock, MapPin, DollarSign, Award, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PublishedVacancy {
  id: string;
  title: string;
  experience_level: string;
  employment_type: string;
  location: string;
  work_mode: string;
  salary_range: string;
  vacancy_count: number;
  published_at: string;
  department_name: string;
  company_id: string;
  company_name: string;
  company_status: string;
  vacancy_version_id: string;
  version_number: number;
  requirements_count: number;
}

interface VacancyRequirement {
  id: string;
  name: string;
  description: string;
  requirement_type: string;
  importance: string;
  eval_method: string;
  evaluation_methods: string;
  weight: number;
}

export default function CandidateTargetPage() {
  const router = useRouter();
  const [vacancies, setVacancies] = useState<PublishedVacancy[]>([]);
  const [selectedVacancy, setSelectedVacancy] = useState<PublishedVacancy | null>(null);
  const [requirements, setRequirements] = useState<VacancyRequirement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTargeting, setIsTargeting] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [existingTargets, setExistingTargets] = useState<Record<string, string>>({});

  // Fetch published vacancies and existing candidate targets
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get('/candidate-portal/vacancies'),
      api.get('/candidate-portal/targets').catch(() => ({ data: { targets: [] } })),
    ])
      .then(([vacRes, targetRes]) => {
        if (!isMounted) return;
        const vacs: PublishedVacancy[] = vacRes.data?.vacancies || [];
        setVacancies(vacs);

        // Map existing targets
        const targetMap: Record<string, string> = {};
        const targets = targetRes.data?.targets || [];
        targets.forEach((t: any) => {
          targetMap[t.vacancy_id] = t.target_id;
        });
        setExistingTargets(targetMap);

        if (vacs.length > 0) {
          loadVacancyDetail(vacs[0].id, vacs[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load published vacancies:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const loadVacancyDetail = (vacancyId: string, summaryObj?: PublishedVacancy) => {
    api.get(`/candidate-portal/vacancies/${vacancyId}`)
      .then((res) => {
        const vac = res.data?.vacancy || summaryObj;
        setSelectedVacancy(vac);
        setRequirements(res.data?.requirements || []);
      })
      .catch((err) => {
        console.error('Failed to load vacancy detail:', err);
      });
  };

  const handleCreateTarget = async () => {
    if (!selectedVacancy) return;
    setIsTargeting(true);

    try {
      const res = await api.post('/candidate-portal/targets', {
        vacancyId: selectedVacancy.id,
      });

      const targetId = res.data?.target?.id;
      toast.success(`Target created for ${selectedVacancy.title}`);
      setExistingTargets((prev) => ({ ...prev, [selectedVacancy.id]: targetId }));
      setActiveTargetId(targetId);
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('You already have an active target for this vacancy.');
        if (err.response.data?.targetId) {
          setExistingTargets((prev) => ({ ...prev, [selectedVacancy.id]: err.response.data.targetId }));
        }
      } else if (err.response?.status === 401) {
        toast.error('Please sign in with a candidate account to create targets.');
        router.push('/login');
      } else {
        const msg = err.response?.data?.error || 'Failed to create target';
        toast.error(msg);
      }
    } finally {
      setIsTargeting(false);
    }
  };

  const filteredVacancies = vacancies.filter((v) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return v.title.toLowerCase().includes(term) || (v.company_name && v.company_name.toLowerCase().includes(term));
  });

  const isCurrentTargeted = selectedVacancy && !!existingTargets[selectedVacancy.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
            Published Vacancies &amp; Target Setup
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
            Explore verified vacancies and create targeted workspaces with transparent requirement rubrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search roles or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 30, height: 34, fontSize: 12.5, width: 220 }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left Vacancies List, Right Requirement Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, alignItems: 'start' }}>
        {/* Left Column: Vacancy List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 4px' }}>
            Verified Vacancies ({filteredVacancies.length})
          </div>

          {loading ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 12.5 }}>
              Loading published vacancies...
            </div>
          ) : filteredVacancies.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 12.5 }}>
              No published vacancies found matching your criteria.
            </div>
          ) : (
            filteredVacancies.map((v) => {
              const isSelected = selectedVacancy?.id === v.id;
              const isTargeted = !!existingTargets[v.id];

              return (
                <div
                  key={v.id}
                  onClick={() => loadVacancyDetail(v.id, v)}
                  className="card"
                  style={{
                    padding: 14,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #b8860b' : '1px solid var(--border)',
                    background: isSelected ? '#fffdf7' : '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e' }}>
                      {v.company_name || 'Verified Company'}
                    </span>
                    {isTargeted && (
                      <span className="badge badge-green" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                        Targeted
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {v.title}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: '#64748b' }}>
                    <span>{v.department_name || 'General'}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{v.experience_level}</span>
                    <span>•</span>
                    <span>{v.work_mode || 'Remote'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Vacancy Requirements & Target Action */}
        <div>
          {selectedVacancy ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Vacancy Card */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge badge-yellow" style={{ fontSize: 11 }}>
                        <Building2 size={11} />
                        {selectedVacancy.company_name}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: 11 }}>
                        <ShieldCheck size={11} />
                        Verified Entity
                      </span>
                      {selectedVacancy.version_number && (
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          Version {selectedVacancy.version_number}
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedVacancy.title}
                    </h2>
                  </div>

                  <div>
                    {isCurrentTargeted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-green" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <CheckCircle2 size={14} /> Active Target
                        </span>
                        <Link
                          href={`/candidate`}
                          className="btn btn-secondary"
                          style={{ fontSize: 12 }}
                        >
                          Open Workspace
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateTarget}
                        disabled={isTargeting}
                        className="btn btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 13,
                          padding: '8px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Target size={14} />
                        <span>{isTargeting ? 'Creating Target...' : 'Create Target for this Role'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#475569', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} style={{ color: '#64748b' }} />
                    <span>{selectedVacancy.location || 'Global'} ({selectedVacancy.work_mode || 'Remote'})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Briefcase size={13} style={{ color: '#64748b' }} />
                    <span style={{ textTransform: 'capitalize' }}>{selectedVacancy.employment_type?.replace('_', ' ') || 'Full Time'}</span>
                  </div>
                  {selectedVacancy.salary_range && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={13} style={{ color: '#64748b' }} />
                      <span>{selectedVacancy.salary_range}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements List */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: '#fafaf9' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Transparent Role Requirements ({requirements.length})
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0 0' }}>
                    Criteria and evaluation rubrics defined by the hiring organization.
                  </p>
                </div>

                {requirements.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 12.5 }}>
                    No requirement rubrics published for this vacancy.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {requirements.map((req, idx) => (
                      <div
                        key={req.id || idx}
                        style={{
                          padding: '14px 18px',
                          borderBottom: idx < requirements.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 14,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                              {req.name}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: req.importance === 'REQUIRED' ? '#fef2f2' : '#f0fdf4',
                                color: req.importance === 'REQUIRED' ? '#991b1b' : '#166534',
                              }}
                            >
                              {req.importance || req.requirement_type || 'Required'}
                            </span>
                          </div>
                          {req.description && (
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                              {req.description}
                            </p>
                          )}
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: '#854d0e', fontWeight: 700 }}>
                            {req.eval_method || 'Assessment'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modules Roadmap Notice */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                <AlertCircle size={15} style={{ color: '#b8860b', flexShrink: 0 }} />
                <span>
                  <strong>Phase Delivery Note:</strong> Target creation and vacancy discovery are active now. Learning rubrics, interactive sandboxes, assessment sessions, and evidence reviews are in development for upcoming releases.
                </span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              Select a vacancy to inspect requirements and create a target.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
