'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass, BookOpen, ClipboardCheck, BadgeCheck, FileCheck,
  ShieldCheck, ArrowRight, CheckCircle2, Clock, AlertTriangle,
  Briefcase, Star, Award, Layers, Zap, ExternalLink, Play
} from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getVacancies()
      .then((data) => setVacancies(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeTargetRole = vacancies[0] || {
    id: 'vac-001',
    roleTitle: 'Software Developer',
    department: 'Engineering',
    experienceLevel: 'Mid-Level',
    company: 'Apex Neural Systems Ltd',
    requirementsCount: 5,
  };

  const STAGES = [
    {
      num: '1',
      title: 'TARGET',
      tagline: 'Role & Requirements Alignment',
      desc: 'Explore open vacancies and transparent requirements. Zero ambiguity.',
      status: 'Target Selected',
      statusColor: '#059669',
      statusBg: '#ecfdf5',
      href: '/candidate/target',
      btnText: 'View Requirements',
      icon: Compass,
      completed: true,
    },
    {
      num: '2',
      title: 'LEARN',
      tagline: 'Capability Rubrics & Guides',
      desc: 'Master the specific technical rubrics and benchmarks expected by the hiring company.',
      status: '4/5 Skills Prepared',
      statusColor: '#059669',
      statusBg: '#ecfdf5',
      href: '/candidate/learn',
      btnText: 'Open Study Guides',
      icon: BookOpen,
      completed: true,
    },
    {
      num: '3',
      title: 'PRACTICE',
      tagline: 'Interactive Readiness Sandbox',
      desc: 'Practice with realistic coding, system design, and MCQ scenarios with instant scoring.',
      status: '84% Readiness Score',
      statusColor: '#b8860b',
      statusBg: '#fefce8',
      href: '/candidate/practice',
      btnText: 'Launch Practice Test',
      icon: ClipboardCheck,
      completed: true,
    },
    {
      num: '4',
      title: 'PROVE',
      tagline: 'Verified Assessment Session',
      desc: 'Complete the official proctored assessment to generate immutable evidence.',
      status: 'Ready to Prove',
      statusColor: '#2563eb',
      statusBg: '#eff6ff',
      href: '/candidate/prove',
      btnText: 'Take Official Assessment',
      icon: BadgeCheck,
      completed: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'var(--gold-grad, linear-gradient(135deg, #b8860b 0%, #d4af37 100%))',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Candidate Pipeline
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              One Role Requirement → Two Paths → One Evidence Layer
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#fff' }}>
            Target the Role. Build the Skills. Prove Your Capability.
          </h1>
          <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
            Your evidence directly connects to company requirements without guesswork or automated filtering black boxes.
            Work through the stages below to prepare, verify, and submit your traceable capabilities.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '12px 18px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active Target Role</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fef08a' }}>{activeTargetRole.title}</div>
            <div style={{ fontSize: 12, color: '#e2e8f0' }}>{activeTargetRole.dept} · {activeTargetRole.experience_level}</div>
          </div>
          <Link
            href="/candidate/prove"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: 'var(--gold-grad, linear-gradient(135deg, #b8860b 0%, #d4af37 100%))',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(184, 134, 11, 0.35)',
            }}
          >
            <Play size={14} fill="#fff" />
            <span>Launch Official Assessment</span>
          </Link>
        </div>
      </div>

      {/* 4-Stage Progressive Workflow */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              The 4-Stage Capability Pathway
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>
              Progress systematically from role targeting to verified evidence submission
            </p>
          </div>
          <Link href="/candidate/evidence" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary, #b8860b)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>View Verified Evidence Portfolio</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'var(--gold-grad, linear-gradient(135deg, #b8860b 0%, #d4af37 100%))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: s.statusBg,
                        color: s.statusColor,
                        border: `1px solid ${s.statusColor}33`,
                      }}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stage {s.num}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 4px 0' }}>
                    {s.title}
                  </h3>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary, #b8860b)', marginBottom: 8 }}>
                    {s.tagline}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    href={s.href}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>{s.btnText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Role Breakdown & Evidence Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Active Requirements Checklist */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Target Role Requirements Breakdown</h3>
              <p className="card-subtitle">Requirements mapped for {activeTargetRole.title} at Apex Neural Systems</p>
            </div>
            <Link href="/candidate/target" className="btn btn-secondary btn-sm">
              Explore All Roles
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Distributed Systems & Concurrency', cat: 'Technical', pri: 'High', prof: 'Senior', method: 'Official Assessment', score: '88% (Practiced)' },
              { name: 'Java (Core & OOP Design Patterns)', cat: 'Technical', pri: 'High', prof: 'Senior', method: 'Official Assessment', score: '92% (Practiced)' },
              { name: 'PostgreSQL Relational Optimization', cat: 'Database', pri: 'High', prof: 'Mid-Senior', method: 'Official Assessment', score: '82% (Practiced)' },
              { name: 'AWS Cloud Infrastructure (ECS/Terraform)', cat: 'DevOps', pri: 'Medium', prof: 'Mid-Level', method: 'Interview Rubric', score: 'Study Guide Ready' },
              { name: 'Technical Trade-off Communication', cat: 'Communication', pri: 'Medium', prof: 'All Levels', method: 'Structured Interview', score: 'Rubric Reviewed' },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>
                      {r.cat} · Priority: <strong>{r.pri}</strong> · Expected: <strong>{r.prof}</strong> · Eval: {r.method}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-green font-bold text-xs">{r.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Meter & Evidence Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 4 }}>Capability Readiness</h3>
            <p className="card-subtitle" style={{ marginBottom: 16 }}>Calculated from practice benchmarks</p>

            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#b8860b', letterSpacing: '-0.03em' }}>86%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                Ready for Official Verification
              </div>
            </div>

            <div style={{ height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: '86%', height: '100%', background: 'var(--gold-grad, linear-gradient(135deg, #b8860b 0%, #d4af37 100%))' }} />
            </div>

            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              4 of 5 requirements have met benchmark standards in the interactive sandbox.
            </div>

            <div style={{ marginTop: 16 }}>
              <Link href="/candidate/prove" className="btn btn-gold btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Start Official Proctored Test
              </Link>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: '#fefce8',
              borderRadius: 12,
              border: '1px solid #fde047',
              fontSize: 12,
              color: '#854d0e',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#854d0e" />
              <span>GenuAI Evidence Standard</span>
            </div>
            Official assessment submissions generate cryptographic SHA-256 evidence records tied to your candidate profile.
            Recruiters evaluate verified task work, not automated algorithmic scores.
          </div>
        </div>
      </div>
    </div>
  );
}
