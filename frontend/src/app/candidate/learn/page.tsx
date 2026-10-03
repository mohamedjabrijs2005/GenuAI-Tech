'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CheckCircle2, ChevronRight, ArrowRight, ExternalLink,
  Layers, Lightbulb, Bookmark, Check, Award, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudyGuide {
  id: string;
  requirementName: string;
  category: string;
  expectedProficiency: string;
  overview: string;
  rubrics: { level: string; criteria: string }[];
  keyConcepts: string[];
  reviewed: boolean;
}

const INITIAL_GUIDES: StudyGuide[] = [
  {
    id: 'SG-01',
    requirementName: 'Java (Core & OOP Design Patterns)',
    category: 'Technical',
    expectedProficiency: 'Senior',
    overview: 'In-depth mastery of the JVM execution model, memory layouts (Heap/Metaspace), garbage collection algorithms (G1, ZGC), and enterprise OOP design patterns.',
    rubrics: [
      { level: 'Foundational', criteria: 'Understands basic class structures, inheritance, exceptions, and standard Java Collections API.' },
      { level: 'Competent (Mid)', criteria: 'Applies streams, lambdas, custom equals/hashCode, concurrent collections, and synchronized blocks.' },
      { level: 'Advanced (Senior)', criteria: 'Diagnoses memory leaks via heap dumps, tunes GC parameters, utilizes Lock-free atomic primitives, and defends factory/decorator/strategy implementations.' },
    ],
    keyConcepts: [
      'Java Memory Model (JMM) happens-before guarantee',
      'Virtual threads & Project Loom execution mechanics',
      'CyclicBarrier vs CountDownLatch synchronization primitives',
      'Generics type erasure & wildcards PECS rule',
    ],
    reviewed: true,
  },
  {
    id: 'SG-02',
    requirementName: 'Distributed Systems & Concurrency',
    category: 'Architecture',
    expectedProficiency: 'Senior',
    overview: 'Designing resilient, distributed microservices capable of partition tolerance, zero-loss messaging, and horizontal scale.',
    rubrics: [
      { level: 'Foundational', criteria: 'Explains client-server model, REST APIs, and basic load balancing strategies.' },
      { level: 'Competent (Mid)', criteria: 'Designs async message-driven pipelines with dead-letter retry logic and basic caching layers.' },
      { level: 'Advanced (Senior)', criteria: 'Solves two-generals and split-brain scenarios, implements distributed transactions (Saga / 2PC), and leverages Raft consensus.' },
    ],
    keyConcepts: [
      'CAP theorem trade-offs under network partition',
      'Idempotency key enforcement using distributed locks (Redis/Zookeeper)',
      'Vector clocks vs Lamport timestamps',
      'Backpressure management with reactive streams',
    ],
    reviewed: true,
  },
  {
    id: 'SG-03',
    requirementName: 'PostgreSQL Relational Optimization',
    category: 'Database',
    expectedProficiency: 'Mid-Senior',
    overview: 'Mastery of query execution planning, indexing strategies, concurrency control (MVCC), and schema normalization.',
    rubrics: [
      { level: 'Foundational', criteria: 'Writes standard relational queries with multi-table joins, GROUP BY, and aggregates.' },
      { level: 'Competent (Mid)', criteria: 'Creates B-tree and GIN indexes, inspects basic EXPLAIN plans, and sets transaction isolation levels.' },
      { level: 'Advanced (Senior)', criteria: 'Resolves sequential table scans using partial & covering indexes, eliminates deadlocks, and manages connection pool starvation.' },
    ],
    keyConcepts: [
      'EXPLAIN (ANALYZE, BUFFERS) interpretation',
      'HOT (Heap-Only Tuples) update optimization',
      'Read Committed vs Repeatable Read phantom reads',
      'Table partitioning (declarative range & hash)',
    ],
    reviewed: true,
  },
  {
    id: 'SG-04',
    requirementName: 'AWS Cloud Infrastructure (ECS & Terraform)',
    category: 'DevOps',
    expectedProficiency: 'Mid-Level',
    overview: 'Deploying containerized microservices reliably with infrastructure-as-code automation and observability.',
    rubrics: [
      { level: 'Foundational', criteria: 'Creates Dockerfiles and builds container images.' },
      { level: 'Competent (Mid)', criteria: 'Manages Terraform state, provisions ECS Fargate services, ALB target groups, and CloudWatch metrics.' },
      { level: 'Advanced (Senior)', criteria: 'Implements zero-downtime rolling & blue/green deployments with automated rollbacks and IAM least-privilege policies.' },
    ],
    keyConcepts: [
      'Terraform remote backend locking with DynamoDB',
      'ECS task definition resource limits & graceful shutdown signals',
      'Private subnet NAT gateway routing topology',
    ],
    reviewed: false,
  },
];

export default function CandidateLearnPage() {
  const [guides, setGuides] = useState<StudyGuide[]>(INITIAL_GUIDES);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('SG-01');

  const selectedGuide = guides.find(g => g.id === selectedGuideId) || guides[0];

  const handleToggleReviewed = (id: string) => {
    setGuides(prev =>
      prev.map(g => (g.id === id ? { ...g, reviewed: !g.reviewed } : g))
    );
    toast.success('Study progress updated');
  };

  const reviewedCount = guides.filter(g => g.reviewed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stage Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="breadcrumbs">
          <span>Candidate Workspace</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Stage 2: Learn</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Capability Rubrics & Requirement Guides</h1>
            <p className="page-subtitle">
              Study the explicit benchmarks and technical expectations defined for each role requirement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-gold font-bold text-xs">
              {reviewedCount} of {guides.length} Guides Prepared
            </span>
            <Link href="/candidate/practice" className="btn btn-gold btn-sm">
              <span>Next: Launch Practice</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Study Guides List (Left) + Detail View (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Guides Navigation */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} />
            <span>Requirement Guides</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {guides.map((g) => {
              const isSelected = g.id === selectedGuideId;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGuideId(g.id)}
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {g.requirementName}
                    </span>
                    {g.reviewed && (
                      <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {g.category} · Target: <strong>{g.expectedProficiency}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Guide Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span className="badge badge-yellow font-bold text-xs" style={{ marginBottom: 6 }}>
                  {selectedGuide.category} Requirement
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                  {selectedGuide.requirementName}
                </h2>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Expected Proficiency Benchmark: <strong>{selectedGuide.expectedProficiency}</strong>
                </div>
              </div>

              <button
                onClick={() => handleToggleReviewed(selectedGuide.id)}
                className={`btn btn-sm ${selectedGuide.reviewed ? 'btn-secondary' : 'btn-gold'}`}
              >
                {selectedGuide.reviewed ? <Check size={14} /> : <Bookmark size={14} />}
                <span>{selectedGuide.reviewed ? 'Reviewed & Prepared' : 'Mark as Reviewed'}</span>
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>
              {selectedGuide.overview}
            </p>
          </div>

          {/* Proficiency Evaluation Rubric */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 4 }}>Company Evaluation Rubric</h3>
            <p className="card-subtitle" style={{ marginBottom: 16 }}>
              How human evaluators and standardized tasks score capability in this area
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedGuide.rubrics.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 4 }}>
                    {r.level} Standard
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    {r.criteria}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Conceptual Checkpoints */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 4 }}>Core Conceptual Checkpoints</h3>
            <p className="card-subtitle" style={{ marginBottom: 16 }}>
              Expect questions and coding tasks testing these exact concepts
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {selectedGuide.keyConcepts.map((concept, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#fefce8',
                    border: '1px solid #fde047',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#854d0e',
                  }}
                >
                  <Lightbulb size={14} style={{ flexShrink: 0 }} />
                  <span>{concept}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
