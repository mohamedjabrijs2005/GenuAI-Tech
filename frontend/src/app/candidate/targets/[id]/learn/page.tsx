'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  ArrowLeft,
  Info,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

export default function TargetLearnPage() {
  const params = useParams();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get(`/candidate-portal/targets/${targetId}`)
      .then((res) => {
        if (!isMounted) return;
        setTarget(res.data?.target);
        setRequirements(res.data?.requirements || []);
      })
      .catch((err) => {
        console.error('Failed to load learn module:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const toggleComplete = (id: string) => {
    const updated = new Set(completedLessons);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCompletedLessons(updated);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Learning Curriculum...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back Link */}
      <div>
        <Link
          href={`/candidate/targets/${targetId}`}
          style={{
            fontSize: 12.5,
            color: '#64748b',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Target Overview</span>
        </Link>
      </div>

      {/* Header */}
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
              background: 'rgba(212, 175, 55, 0.2)',
              fontSize: 11,
              fontWeight: 700,
              color: '#fef08a',
              textTransform: 'uppercase',
            }}
          >
            {target?.company_name} · Role Preparation
          </span>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(255, 255, 255, 0.1)',
              fontSize: 11,
              fontWeight: 700,
              color: '#e2e8f0',
            }}
          >
            Preview / Syllabus Roadmap
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px' }}>
          Target-Based Learning Curriculum
        </h1>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, maxWidth: 650 }}>
          Study resources curated strictly for <strong>{target?.vacancy_title}</strong> requirements. Prepare before submitting project evidence or taking assessments.
        </p>
      </div>

      {/* Preparation vs Evidence Rule */}
      <div
        style={{
          padding: '16px 20px',
          background: '#eff6ff',
          borderRadius: 10,
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12.5,
          color: '#1e40af',
        }}
      >
        <Info size={20} style={{ flexShrink: 0, color: '#2563eb' }} />
        <div>
          <strong>Important Principle:</strong> Learning completion is preparation activity. It helps you build mastery, but it is not automatically accepted as proof of competence. Submit work samples or projects in your Evidence Locker to prove capability.
        </div>
      </div>

      {/* Requirement Modules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {requirements.map((req, reqIdx) => {
          const lesson1Id = `req-${req.id}-1`;
          const lesson2Id = `req-${req.id}-2`;

          return (
            <div key={req.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    Requirement #{reqIdx + 1}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                    {req.name}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    color: '#475569',
                  }}
                >
                  {req.importance || 'REQUIRED'}
                </span>
              </div>

              {/* Curated Units */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Unit 1 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: completedLessons.has(lesson1Id) ? '#f0fdf4' : '#fafaf9',
                    border: completedLessons.has(lesson1Id) ? '1px solid #bbf7d0' : '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                      {req.name} Core Principles & Best Practices
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                      <span>Article & Documentation</span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} /> 25 mins
                      </span>
                      <span>·</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>Why: Directly aligned to role rubric</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => toggleComplete(lesson1Id)}
                      className={`btn ${completedLessons.has(lesson1Id) ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: 12, padding: '5px 12px' }}
                    >
                      {completedLessons.has(lesson1Id) ? '✓ Completed' : 'Mark Completed'}
                    </button>
                  </div>
                </div>

                {/* Unit 2 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: completedLessons.has(lesson2Id) ? '#f0fdf4' : '#fafaf9',
                    border: completedLessons.has(lesson2Id) ? '1px solid #bbf7d0' : '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                      Production Architecture & Common Pitfalls for {req.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                      <span>Interactive Walkthrough</span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} /> 40 mins
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => toggleComplete(lesson2Id)}
                      className={`btn ${completedLessons.has(lesson2Id) ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: 12, padding: '5px 12px' }}
                    >
                      {completedLessons.has(lesson2Id) ? '✓ Completed' : 'Mark Completed'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
