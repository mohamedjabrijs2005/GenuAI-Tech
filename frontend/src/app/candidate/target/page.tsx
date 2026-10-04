'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, Briefcase, Target, ShieldCheck, CheckCircle2,
  ChevronRight, ArrowRight, Layers, Star, Building2, Search, Filter
} from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

export default function CandidateTargetPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('vac-001');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getVacancies()
      .then((data) => {
        setVacancies(data);
        if (data.length > 0) setSelectedVacancyId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedRole = vacancies.find(v => v.id === selectedVacancyId) || vacancies[0] || {
    id: 'vac-001',
    roleTitle: 'Software Developer',
    department: 'Engineering',
    experienceLevel: 'Mid-Level',
    employmentType: 'Full-Time',
    status: 'Active',
    company: 'Apex Neural Systems Ltd',
  };

  const REQUIREMENTS = [
    {
      id: 'REQ-01',
      name: 'Java (Core & OOP Design Patterns)',
      category: 'Technical',
      type: 'Required',
      priority: 'High',
      proficiency: 'Senior',
      weight: 30,
      evalMethod: 'Official Technical Assessment',
      description: 'Concurrency models, memory management, garbage collection mechanics, polymorphic class design, SOLID principles',
    },
    {
      id: 'REQ-02',
      name: 'Distributed Systems & Concurrency',
      category: 'Architecture',
      type: 'Required',
      priority: 'High',
      proficiency: 'Senior',
      weight: 25,
      evalMethod: 'Official Technical Assessment',
      description: 'Distributed locking, idempotent messaging, race condition mitigation, event sourcing',
    },
    {
      id: 'REQ-03',
      name: 'PostgreSQL Relational Optimization',
      category: 'Database',
      type: 'Required',
      priority: 'High',
      proficiency: 'Mid-Senior',
      weight: 20,
      evalMethod: 'Official Technical Assessment',
      description: 'Partial indexes, query planning (EXPLAIN ANALYZE), schema denormalization trade-offs',
    },
    {
      id: 'REQ-04',
      name: 'AWS Cloud Infrastructure (ECS & Terraform)',
      category: 'DevOps',
      type: 'Preferred',
      priority: 'Medium',
      proficiency: 'Mid-Level',
      weight: 15,
      evalMethod: 'Structured Interview Rubric',
      description: 'Container orchestration, infrastructure-as-code state management, VPC network topology',
    },
    {
      id: 'REQ-05',
      name: 'Technical Trade-off Communication',
      category: 'Communication',
      type: 'Required',
      priority: 'Medium',
      proficiency: 'All Levels',
      weight: 10,
      evalMethod: 'Technical Interview',
      description: 'Defending architectural decisions, articulating constraints, documentation rigor',
    },
  ];

  const handleSetTarget = () => {
    toast.success(`Active target set to: ${selectedRole.title}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stage Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="breadcrumbs">
          <span>Candidate Workspace</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Stage 1: Target</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Target Role & Requirements Alignment</h1>
            <p className="page-subtitle">
              Transparent, verified requirements directly from hiring organizations. Zero hidden criteria.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSetTarget} className="btn btn-gold btn-sm">
              <Target size={14} />
              <span>Confirm Active Target</span>
            </button>
            <Link href="/candidate/learn" className="btn btn-secondary btn-sm">
              <span>Next: Study Rubrics</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Vacancy Picker (Left) + Requirements Matrix (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Roles List */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Briefcase size={16} />
            <span>Open Verified Vacancies</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vacancies.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading vacancies…</div>
            ) : (
              vacancies.map((v) => {
                const isSelected = v.id === selectedVacancyId;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVacancyId(v.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'var(--primary, #b8860b)' : '#e2e8f0'}`,
                      background: isSelected ? '#fefce8' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{v.title}</span>
                      {isSelected && <span className="badge badge-gold font-bold text-[10px]">Target</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                      {v.dept} · {v.experience_level}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={11} /> Apex Neural Systems
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Role Detailed Requirements Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className="badge badge-gold font-bold text-xs" style={{ marginBottom: 6 }}>
                  Targeted Role
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                  {selectedRole.title}
                </h2>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>
                  Department: <strong>{selectedRole.dept}</strong> · Level: <strong>{selectedRole.experience_level}</strong> · Status: <strong>{selectedRole.status}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Requirements</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary, #b8860b)' }}>{REQUIREMENTS.length}</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
              The company has established explicit requirements for this position. Candidates will be assessed
              directly against these areas using standardized benchmarks, without arbitrary resume keyword matching.
            </p>
          </div>

          {/* Requirements Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                Requirement & Capability Matrix ({REQUIREMENTS.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {REQUIREMENTS.map((req, idx) => (
                <div
                  key={req.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx < REQUIREMENTS.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {req.id}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${req.type === 'Required' ? 'badge-red' : 'badge-blue'} font-bold text-xs`}>
                        {req.type}
                      </span>
                      <span className="badge badge-yellow font-bold text-xs">
                        Weight: {req.weight}%
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                    {req.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5, color: '#94a3b8' }}>
                    <span>Category: <strong style={{ color: '#475569' }}>{req.category}</strong></span>
                    <span>Priority: <strong style={{ color: '#475569' }}>{req.priority}</strong></span>
                    <span>Expected Proficiency: <strong style={{ color: '#475569' }}>{req.proficiency}</strong></span>
                    <span>Evaluation Mode: <strong style={{ color: '#b8860b' }}>{req.evalMethod}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
