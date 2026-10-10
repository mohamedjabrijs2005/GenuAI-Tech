'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CheckCircle2, ChevronRight, ArrowRight, ExternalLink,
  Layers, Lightbulb, Bookmark, Check, Award, FileText, AlertCircle
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
}

const INITIAL_GUIDES: StudyGuide[] = [
  {
    id: 'SG-01',
    requirementName: 'Java (Core & OOP Design Patterns)',
    category: 'Technical',
    expectedProficiency: 'Senior',
    overview: 'In-depth review of JVM execution model, memory layouts, garbage collection tuning, and OOP design patterns.',
    rubrics: [
      { level: 'Foundational', criteria: 'Understands basic class structures, inheritance, exceptions, and standard Java Collections API.' },
      { level: 'Competent (Mid)', criteria: 'Applies streams, lambdas, custom equals/hashCode, concurrent collections, and synchronized blocks.' },
      { level: 'Advanced (Senior)', criteria: 'Diagnoses memory leaks via heap dumps, tunes GC parameters, utilizes atomic primitives, and defends polymorphic class designs.' },
    ],
    keyConcepts: [
      'Java Memory Model (JMM) happens-before guarantee',
      'Virtual threads & Project Loom execution mechanics',
      'CyclicBarrier vs CountDownLatch synchronization primitives',
      'Generics type erasure & wildcards PECS rule',
    ],
  },
  {
    id: 'SG-02',
    requirementName: 'Distributed Systems & Concurrency',
    category: 'Architecture',
    expectedProficiency: 'Senior',
    overview: 'Designing resilient distributed microservices capable of partition tolerance, zero-loss messaging, and horizontal scale.',
    rubrics: [
      { level: 'Foundational', criteria: 'Explains client-server model, REST APIs, and basic load balancing strategies.' },
      { level: 'Competent (Mid)', criteria: 'Designs async message-driven pipelines with dead-letter retry logic and basic caching layers.' },
      { level: 'Advanced (Senior)', criteria: 'Solves two-generals scenarios, implements distributed transactions (Saga pattern), and manages distributed lock safety.' },
    ],
    keyConcepts: [
      'CAP theorem trade-offs under network partition',
      'Idempotency key enforcement using distributed locks',
      'Vector clocks vs Lamport timestamps',
      'Backpressure management with reactive streams',
    ],
  },
];

export default function CandidateLearnPage() {
  const [guides] = useState<StudyGuide[]>(INITIAL_GUIDES);
  const [selectedId, setSelectedId] = useState<string>('SG-01');

  const selectedGuide = guides.find(g => g.id === selectedId) || guides[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Preview Milestone Banner */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 4,
            background: '#f1f5f9',
            color: '#64748b',
            textTransform: 'uppercase',
            border: '1px solid #cbd5e1',
          }}
        >
          Preview Module
        </span>
        <span>
          <strong>In Development (Phase 2):</strong> This learning rubrics workspace is an interactive prototype. Active workflows currently support Target creation and published vacancy discovery.
        </span>
      </div>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
            Study Guides &amp; Requirement Rubrics
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
            Preview capability benchmarks and evaluation criteria expected for target requirements.
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'start' }}>
        {/* Left List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guides.map((g) => {
            const isSelected = g.id === selectedId;
            return (
              <div
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className="card"
                style={{
                  padding: 14,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #b8860b' : '1px solid var(--border)',
                  background: isSelected ? '#fffdf7' : '#ffffff',
                }}
              >
                <div style={{ fontSize: 11, color: '#854d0e', fontWeight: 700, marginBottom: 2 }}>
                  {g.category} • {g.expectedProficiency}
                </div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {g.requirementName}
                </h3>
              </div>
            );
          })}
        </div>

        {/* Right Detail */}
        {selectedGuide && (
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-yellow" style={{ fontSize: 11 }}>
                  {selectedGuide.category}
                </span>
                <span className="badge badge-gray" style={{ fontSize: 11 }}>
                  Level: {selectedGuide.expectedProficiency}
                </span>
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {selectedGuide.requirementName}
              </h2>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {selectedGuide.overview}
              </p>
            </div>

            {/* Rubrics */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Evaluation Rubrics
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedGuide.rubrics.map((r) => (
                  <div key={r.level} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#854d0e', marginBottom: 2 }}>
                      {r.level}
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                      {r.criteria}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Concepts */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Key Technical Concepts
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                {selectedGuide.keyConcepts.map((kc, i) => (
                  <li key={i}>{kc}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
