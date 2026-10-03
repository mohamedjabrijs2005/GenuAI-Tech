'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp,
  Lock, Eye, Plus, BarChart2, Users, Calendar, Zap
} from 'lucide-react';

// Assessment Groups linked to role requirements
const ASSESSMENT_GROUPS = [
  {
    id: 'AG-01',
    name: 'Technical Core Assessment',
    vacancy: 'Software Developer',
    status: 'Active',
    version: 'v1.0',
    type: 'Official Technical Assessment',
    duration: '90 min',
    questionCount: 42,
    difficulty: 'Mixed (Medium → Hard)',
    attempts: 1,
    integrity: 'Full Proctoring',
    window: '2026-09-10 → 2026-09-25',
    candidatesInvited: 18,
    candidatesCompleted: 15,
    evaluationGroups: [
      {
        id: 'EG-01-A',
        name: 'Java OOP & Collections',
        requirement: 'Java (Core & OOP)',
        reqId: 'REQ-01',
        criteria: ['Classes & Interfaces', 'Inheritance & Polymorphism', 'Exception Handling', 'Collections Framework'],
        questions: 14,
        avgScore: '82%',
      },
      {
        id: 'EG-01-B',
        name: 'Data Structures & Algorithm Solving',
        requirement: 'DSA',
        reqId: 'REQ-02',
        criteria: ['Array Traversal', 'Tree Algorithms', 'Sorting & Searching', 'Time Complexity Analysis'],
        questions: 16,
        avgScore: '76%',
      },
      {
        id: 'EG-01-C',
        name: 'SQL & Relational Queries',
        requirement: 'SQL & Database Design',
        reqId: 'REQ-03',
        criteria: ['Complex JOINs', 'Aggregations & Grouping', 'Subqueries', 'Schema Interpretation'],
        questions: 12,
        avgScore: '88%',
      },
    ],
  },
  {
    id: 'AG-02',
    name: 'Problem Solving Assessment',
    vacancy: 'Software Developer',
    status: 'Active',
    version: 'v1.0',
    type: 'Case Study & Scenario',
    duration: '45 min',
    questionCount: 8,
    difficulty: 'Medium',
    attempts: 1,
    integrity: 'Standard Monitoring',
    window: '2026-09-10 → 2026-09-25',
    candidatesInvited: 18,
    candidatesCompleted: 15,
    evaluationGroups: [
      {
        id: 'EG-02-A',
        name: 'Analytical & Edge Case Handling',
        requirement: 'Problem Solving & Analytical Thinking',
        reqId: 'REQ-04',
        criteria: ['Ambiguity Resolution', 'Edge Case Identification', 'Structured Thinking', 'Scenario Decomposition'],
        questions: 8,
        avgScore: '84%',
      },
    ],
  },
  {
    id: 'AG-03',
    name: 'Structured Communication Interview',
    vacancy: 'Software Developer',
    status: 'Active',
    version: 'v1.0',
    type: 'Structured Interview',
    duration: '30 min',
    questionCount: 6,
    difficulty: 'Qualitative Evaluation',
    attempts: 1,
    integrity: 'Recruiter Evaluated',
    window: 'Scheduled',
    candidatesInvited: 15,
    candidatesCompleted: 10,
    evaluationGroups: [
      {
        id: 'EG-03-A',
        name: 'Technical Communication Rubric',
        requirement: 'Technical Communication',
        reqId: 'REQ-05',
        criteria: ['Explanation Clarity', 'Logical Structure', 'Technical Vocabulary', 'Response Quality'],
        questions: 6,
        avgScore: '4.5 / 5.0',
      },
    ],
  },
];

const STATUS_BADGE: Record<string, string> = {
  Active: 'badge-green',
  Draft: 'badge-gray',
  Locked: 'badge-yellow',
  Closed: 'badge-red',
};

export default function AssessmentsPage() {
  const [expanded, setExpanded] = useState<string[]>(['AG-01']);

  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const totalInvited = ASSESSMENT_GROUPS.reduce((a, g) => a + g.candidatesInvited, 0);
  const totalCompleted = ASSESSMENT_GROUPS.reduce((a, g) => a + g.candidatesCompleted, 0);
  const completionRate = Math.round((totalCompleted / totalInvited) * 100);

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Assessment Setup & Results</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Assessment Groups & Evaluation Results</h1>
            <p className="page-subtitle">
              Requirement-mapped official assessment configuration and live results by evaluation group.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/vacancies/builder" className="btn btn-secondary btn-sm">
              <Plus size={14} /> Configure Assessment
            </Link>
          </div>
        </div>
      </div>

      {/* Principle Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--r-lg)', padding: '12px 18px', marginBottom: 20 }}>
        <div className="flex items-center gap-2 text-xs text-blue-900">
          <Info size={15} className="flex-shrink-0 text-blue-700" />
          <span>
            <strong>Assessment is requirement-mapped.</strong> Every evaluation group maps directly to one or more role requirements.
            A single assessment can cover multiple requirements — assessment count ≠ requirement count.
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assessment Groups</div>
          <div className="text-2xl font-extrabold text-slate-900">{ASSESSMENT_GROUPS.length}</div>
          <div className="text-xs text-slate-500 mt-1">For Software Developer</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Candidates Invited</div>
          <div className="text-2xl font-extrabold text-slate-900">{totalInvited}</div>
          <div className="text-xs text-slate-500 mt-1">Official Assessment</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Completed</div>
          <div className="text-2xl font-extrabold text-amber-900">{totalCompleted}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">{completionRate}% Completion Rate</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assessment Lock</div>
          <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-1">
            <Lock size={14} className="text-amber-700" /> Locked (Active)
          </div>
          <div className="text-xs text-slate-500 mt-1">No edits after candidate start</div>
        </div>
      </div>

      {/* Assessment Groups */}
      <div className="space-y-4">
        {ASSESSMENT_GROUPS.map((ag) => {
          const isOpen = expanded.includes(ag.id);
          return (
            <div key={ag.id} className="card" style={{ padding: 0 }}>
              {/* Group Header */}
              <div
                className="cursor-pointer select-none"
                style={{ padding: '18px 24px' }}
                onClick={() => toggle(ag.id)}
                role="button"
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: '#fefce8', border: '1px solid rgba(212,175,55,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#a16207', flexShrink: 0
                    }}>
                      <BarChart2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{ag.name}</span>
                        <span className="badge badge-gray text-[10px] font-bold">{ag.id}</span>
                        <span className={`badge ${STATUS_BADGE[ag.status]} text-[10px] font-bold`}>{ag.status}</span>
                        <span className="badge badge-gray text-[10px]">{ag.version}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>{ag.type}</span>
                        <span className="opacity-40">·</span>
                        <span>{ag.duration}</span>
                        <span className="opacity-40">·</span>
                        <span>{ag.questionCount} Questions</span>
                        <span className="opacity-40">·</span>
                        <span>{ag.evaluationGroups.length} Evaluation Groups</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-slate-500">Completion</div>
                      <div className="text-sm font-extrabold text-amber-900">
                        {ag.candidatesCompleted}/{ag.candidatesInvited}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '0 24px 24px' }}>

                  {/* Config meta row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
                    {[
                      { label: 'Duration', value: ag.duration },
                      { label: 'Attempts', value: `${ag.attempts} (locked after start)` },
                      { label: 'Integrity', value: ag.integrity },
                      { label: 'Window', value: ag.window },
                    ].map(m => (
                      <div key={m.label} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Evaluation Groups */}
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 mt-4">
                    Evaluation Groups ({ag.evaluationGroups.length})
                  </div>
                  <div className="space-y-3">
                    {ag.evaluationGroups.map((eg) => (
                      <div key={eg.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{eg.name}</span>
                              <span className="badge badge-gray text-[10px]">{eg.id}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Maps to: <span className="font-bold text-amber-900">{eg.requirement}</span>
                              <span className="opacity-40 mx-1.5">·</span>
                              <span className="font-mono text-slate-500">{eg.reqId}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-slate-500">{eg.questions} Questions</div>
                            <div className="text-sm font-extrabold text-amber-900 mt-0.5">Avg: {eg.avgScore}</div>
                          </div>
                        </div>

                        {/* Evaluation Criteria */}
                        <div className="flex flex-wrap gap-1.5">
                          {eg.criteria.map(c => (
                            <span key={c} className="text-[11px] px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-700 font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Lock size={12} />
                      Assessment locked — no edits after candidate assessment started
                    </div>
                    <div className="flex gap-2">
                      <Link href="/dashboard/candidates" className="btn btn-secondary btn-sm">
                        <Users size={14} /> View Candidates
                      </Link>
                      <button className="btn btn-gold btn-sm">
                        <Eye size={14} /> View Results
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Candidate-Level Result Summary Table */}
      <div className="card mt-6">
        <div className="card-header">
          <div>
            <h2 className="card-title flex items-center gap-2">
              <BarChart2 size={16} className="text-amber-600" />
              Candidate Assessment Results by Requirement
            </h2>
            <p className="card-subtitle">Per-requirement scores — not an overall hire score. Human review required.</p>
          </div>
          <span className="badge badge-yellow font-bold text-xs">Human Decision Required</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Java (OOP)</th>
                <th>DSA</th>
                <th>SQL</th>
                <th>Problem Solving</th>
                <th>Communication</th>
                <th>Evidence Coverage</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alex Rivera',    java: '82%', dsa: '76%', sql: '88%', ps: '84%', comm: '4.5/5', cov: '5/6' },
                { name: 'James Okonkwo', java: '91%', dsa: '88%', sql: '94%', ps: '90%', comm: '4.8/5', cov: '6/6' },
                { name: 'Aisha Rahman',  java: '71%', dsa: '68%', sql: '75%', ps: '72%', comm: '3.9/5', cov: '5/6' },
                { name: 'Mohamed Jabri', java: '86%', dsa: '82%', sql: '79%', ps: '88%', comm: '4.2/5', cov: '5/6' },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="font-bold text-slate-900">{row.name}</td>
                  <td className="td-mono font-bold text-amber-900">{row.java}</td>
                  <td className="td-mono font-bold text-amber-900">{row.dsa}</td>
                  <td className="td-mono font-bold text-amber-900">{row.sql}</td>
                  <td className="td-mono font-bold text-amber-900">{row.ps}</td>
                  <td className="td-mono font-bold text-amber-900">{row.comm}</td>
                  <td>
                    <span className={`badge font-bold ${row.cov === '6/6' ? 'badge-green' : 'badge-yellow'}`}>
                      {row.cov === '6/6' ? <><CheckCircle2 size={12} /> Full</> : <><AlertTriangle size={12} /> {row.cov}</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <strong>Important:</strong> These are requirement-level performance records, not global ranking scores. GenuAI does not produce "best candidate" rankings or AI hire/reject decisions. All values represent official assessment performance evidence for human recruiter review.
        </div>
      </div>
    </div>
  );
}
