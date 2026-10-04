'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertTriangle, Circle, ChevronRight, ShieldCheck,
  FileText, ExternalLink, Hash, Calendar, ArrowRight, Sparkles,
  Layers, UserCheck, HelpCircle, Info
} from 'lucide-react';

interface EvidenceRecord {
  id: string;
  reqId: string;
  skill: string;
  category: string;
  score: number | null;
  method: string;
  status: 'covered' | 'gap';
  evidenceType: string;
  evidence: string;
  hash: string;
  timestamp: string;
  mitigation?: string;
}

interface CandidateCoverage {
  id: string;
  candidate: string;
  candidateId: string;
  score: number;
  vacancy: string;
  version: string;
  requirements: EvidenceRecord[];
}

const COVERAGE_DATA: CandidateCoverage[] = [
  {
    id: 'c1',
    candidate: 'Alex Rivera',
    candidateId: 'c1',
    score: 82,
    vacancy: 'Software Developer',
    version: 'vac-001 (v1.0)',
    requirements: [
      {
        id: 'EV-01',
        reqId: 'REQ-01',
        skill: 'Java Core & OOP',
        category: 'Technical',
        score: 82,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 82% across 14 OOP & Collections questions. All unit tests passed.',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: '2026-09-15 14:32 UTC',
      },
      {
        id: 'EV-02',
        reqId: 'REQ-02',
        skill: 'Data Structures & Algorithms',
        category: 'Technical',
        score: 76,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 76% across 16 algorithmic challenges. Tree traversal and binary search verified.',
        hash: '7d793037a0760186574b0282f2f435e70d6324d07bf71f959f61882c57f50426',
        timestamp: '2026-09-15 15:10 UTC',
      },
      {
        id: 'EV-03',
        reqId: 'REQ-03',
        skill: 'PostgreSQL & SQL Design',
        category: 'Technical',
        score: 88,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 88% across 12 relational query questions. Complex JOINs and aggregations verified.',
        hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        timestamp: '2026-09-15 15:45 UTC',
      },
      {
        id: 'EV-04',
        reqId: 'REQ-04',
        skill: 'Problem Solving & Analytical Thinking',
        category: 'Problem Solving',
        score: 84,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Case Study Simulation',
        evidence: 'Scored 84% on edge case identification and trade-off analysis scenario.',
        hash: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
        timestamp: '2026-09-15 16:15 UTC',
      },
      {
        id: 'EV-05',
        reqId: 'REQ-05',
        skill: 'Technical Communication',
        category: 'Communication',
        score: null,
        method: 'Structured Interview',
        status: 'covered',
        evidenceType: 'Rubric-Scored Live Interview',
        evidence: 'Interviewer rubric score: 4.5 / 5.0. Demonstrated clear explanation of distributed system trade-offs.',
        hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
        timestamp: '2026-09-22 11:45 UTC',
      },
      {
        id: 'EV-06',
        reqId: 'REQ-06',
        skill: 'AWS Cloud Architecture',
        category: 'Infrastructure',
        score: null,
        method: 'Credential / Portfolio Review',
        status: 'gap',
        evidenceType: 'Self-Reported Resume Claim',
        evidence: 'Candidate listed "AWS (EC2, S3, RDS)" on resume. No verified certification or proctored task on record.',
        hash: 'UNVERIFIED_PENDING_EVALUATION',
        timestamp: '2026-09-12 09:00 UTC',
        mitigation: 'Recommend asking 2 targeted cloud architecture scenario questions in final round interview.',
      },
    ],
  },
  {
    id: 'c2',
    candidate: 'Aisha Rahman',
    candidateId: 'c2',
    score: 74,
    vacancy: 'Software Developer',
    version: 'vac-001 (v1.0)',
    requirements: [
      {
        id: 'EV-11',
        reqId: 'REQ-01',
        skill: 'Java Core & OOP',
        category: 'Technical',
        score: 71,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 71% in Java assessment. Core concepts sound, minor errors in generics.',
        hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        timestamp: '2026-09-21 09:45 UTC',
      },
      {
        id: 'EV-12',
        reqId: 'REQ-02',
        skill: 'Data Structures & Algorithms',
        category: 'Technical',
        score: 68,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 68% in algorithmic solving. Arrays and HashMaps verified; recursion incomplete.',
        hash: '3f4e5d6c7b8a90123456789abcdef0123456789abcdef0123456789abcdef012',
        timestamp: '2026-09-21 10:30 UTC',
      },
      {
        id: 'EV-13',
        reqId: 'REQ-03',
        skill: 'PostgreSQL & SQL Design',
        category: 'Technical',
        score: 75,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 75% in SQL queries. Basic and intermediate joins verified.',
        hash: '5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
        timestamp: '2026-09-21 11:15 UTC',
      },
      {
        id: 'EV-14',
        reqId: 'REQ-04',
        skill: 'Problem Solving & Analytical Thinking',
        category: 'Problem Solving',
        score: 72,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Case Study Simulation',
        evidence: 'Scored 72% in scenario analysis. Addressed basic edge cases.',
        hash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
        timestamp: '2026-09-21 11:45 UTC',
      },
      {
        id: 'EV-15',
        reqId: 'REQ-05',
        skill: 'Technical Communication',
        category: 'Communication',
        score: null,
        method: 'Structured Interview',
        status: 'gap',
        evidenceType: 'Pending Interview',
        evidence: 'Technical interview not yet completed. Scheduled for upcoming session.',
        hash: 'PENDING_INTERVIEW_EVALUATION',
        timestamp: '2026-09-21 12:00 UTC',
        mitigation: 'Conduct scheduled Round 1 interview with communication rubric.',
      },
      {
        id: 'EV-16',
        reqId: 'REQ-06',
        skill: 'AWS Cloud Architecture',
        category: 'Infrastructure',
        score: null,
        method: 'Credential / Portfolio Review',
        status: 'gap',
        evidenceType: 'Self-Reported Resume Claim',
        evidence: 'No cloud assessment or external certificate provided.',
        hash: 'UNVERIFIED_PENDING_EVALUATION',
        timestamp: '2026-09-14 10:00 UTC',
        mitigation: 'Request AWS Cloud Practitioner or equivalent credential proof.',
      },
    ],
  },
  {
    id: 'c3',
    candidate: 'James Okonkwo',
    candidateId: 'c3',
    score: 91,
    vacancy: 'Software Developer',
    version: 'vac-001 (v1.0)',
    requirements: [
      {
        id: 'EV-21',
        reqId: 'REQ-01',
        skill: 'Java Core & OOP',
        category: 'Technical',
        score: 91,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 91% in Java assessment. Perfect score on concurrency and exception handling.',
        hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        timestamp: '2026-09-20 10:15 UTC',
      },
      {
        id: 'EV-22',
        reqId: 'REQ-02',
        skill: 'Data Structures & Algorithms',
        category: 'Technical',
        score: 88,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 88% across 16 algorithmic questions. Dynamic programming verified.',
        hash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
        timestamp: '2026-09-20 11:00 UTC',
      },
      {
        id: 'EV-23',
        reqId: 'REQ-03',
        skill: 'PostgreSQL & SQL Design',
        category: 'Technical',
        score: 94,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 94% in database queries and schema normalization indexing.',
        hash: 'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
        timestamp: '2026-09-20 11:30 UTC',
      },
      {
        id: 'EV-24',
        reqId: 'REQ-04',
        skill: 'Problem Solving & Analytical Thinking',
        category: 'Problem Solving',
        score: 90,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Case Study Simulation',
        evidence: 'Scored 90% in analytical case study. Excellent edge-case handling.',
        hash: 'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
        timestamp: '2026-09-20 12:00 UTC',
      },
      {
        id: 'EV-25',
        reqId: 'REQ-05',
        skill: 'Technical Communication',
        category: 'Communication',
        score: null,
        method: 'Structured Interview',
        status: 'covered',
        evidenceType: 'Rubric-Scored Live Interview',
        evidence: 'Interviewer rubric score: 4.8 / 5.0. Flawless explanation of design patterns.',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: '2026-09-26 15:15 UTC',
      },
      {
        id: 'EV-26',
        reqId: 'REQ-06',
        skill: 'AWS Cloud Architecture',
        category: 'Infrastructure',
        score: null,
        method: 'Credential / Portfolio Review',
        status: 'covered',
        evidenceType: 'Verified Credential (AWS Certified Solutions Architect)',
        evidence: 'AWS Solutions Architect Associate credential verified via Credly badge URL.',
        hash: '4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
        timestamp: '2026-09-18 16:00 UTC',
      },
    ],
  },
  {
    id: 'c4',
    candidate: 'Mohamed Jabri',
    candidateId: 'c1',
    score: 84,
    vacancy: 'Software Developer',
    version: 'vac-001 (v1.0)',
    requirements: [
      {
        id: 'EV-31',
        reqId: 'REQ-01',
        skill: 'Java Core & OOP',
        category: 'Technical',
        score: 86,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 86% in Java assessment. Solid architecture and clean OOP principles.',
        hash: '7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        timestamp: '2026-09-22 10:30 UTC',
      },
      {
        id: 'EV-32',
        reqId: 'REQ-02',
        skill: 'Data Structures & Algorithms',
        category: 'Technical',
        score: 82,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 82% in algorithmic solving. Strong graph traversal and search techniques.',
        hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: '2026-09-22 11:15 UTC',
      },
      {
        id: 'EV-33',
        reqId: 'REQ-03',
        skill: 'PostgreSQL & SQL Design',
        category: 'Technical',
        score: 79,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Proctored Code & MCQ Assessment',
        evidence: 'Scored 79% in database design and indexing optimization queries.',
        hash: 'ef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
        timestamp: '2026-09-22 11:45 UTC',
      },
      {
        id: 'EV-34',
        reqId: 'REQ-04',
        skill: 'Problem Solving & Analytical Thinking',
        category: 'Problem Solving',
        score: 88,
        method: 'Official Technical Assessment',
        status: 'covered',
        evidenceType: 'Case Study Simulation',
        evidence: 'Scored 88% on real-world system debugging and edge case mitigation.',
        hash: '34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        timestamp: '2026-09-22 12:15 UTC',
      },
      {
        id: 'EV-35',
        reqId: 'REQ-05',
        skill: 'Technical Communication',
        category: 'Communication',
        score: null,
        method: 'Structured Interview',
        status: 'covered',
        evidenceType: 'Rubric-Scored Live Interview',
        evidence: 'Interviewer rubric score: 4.2 / 5.0. Articulate in articulating code trade-offs.',
        hash: '567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
        timestamp: '2026-09-25 14:00 UTC',
      },
      {
        id: 'EV-36',
        reqId: 'REQ-06',
        skill: 'AWS Cloud Architecture',
        category: 'Infrastructure',
        score: null,
        method: 'Credential / Portfolio Review',
        status: 'gap',
        evidenceType: 'Self-Reported Resume Claim',
        evidence: 'Experience listed on resume. Targeted scenario interview scheduled.',
        hash: 'UNVERIFIED_PENDING_EVALUATION',
        timestamp: '2026-09-15 08:30 UTC',
        mitigation: 'Competency interview scheduled for 2026-09-26 (INT-002) with David Park.',
      },
    ],
  },
];

export default function EvidencePage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = COVERAGE_DATA[selectedIndex];

  const coveredCount = selected.requirements.filter(r => r.status === 'covered').length;
  const totalCount = selected.requirements.length;
  const coveragePct = Math.round((coveredCount / totalCount) * 100);
  const gapsCount = totalCount - coveredCount;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Candidates</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Evidence & Coverage</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Requirement Evidence & Coverage Ledger</h1>
            <p className="page-subtitle">
              Verified evaluation records mapped directly to vacancy requirements — distinguishing verified evidence from self-reported claims.
            </p>
          </div>
          <Link href={`/dashboard/candidates/${selected.candidateId}`} className="btn btn-gold btn-sm">
            <UserCheck size={14} /> Open Candidate Workspace
          </Link>
        </div>
      </div>

      {/* Principle Callout */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 20 }}>
        <div className="flex items-start gap-3 text-xs text-blue-900">
          <Info size={16} className="flex-shrink-0 mt-0.5 text-blue-700" />
          <div className="leading-relaxed">
            <strong>Evidence Principle:</strong> Evidence coverage measures how many defined vacancy requirements have documented, verified evaluation proof.
            An <strong>Evidence Gap</strong> does not mean the candidate lacks the skill — it indicates that verified evaluation evidence has not yet been collected.
            Recruiters use targeted interviews or credentials to close gaps.
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Candidate List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Candidates in Pipeline ({COVERAGE_DATA.length})
          </div>

          {COVERAGE_DATA.map((c, i) => {
            const isSel = i === selectedIndex;
            const cCovered = c.requirements.filter(r => r.status === 'covered').length;
            const cTotal = c.requirements.length;
            const cPct = Math.round((cCovered / cTotal) * 100);

            return (
              <div
                key={c.id}
                className="card cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedIndex(i)}
                style={{
                  padding: '16px 18px',
                  borderLeft: `3px solid ${isSel ? '#d4af37' : 'var(--border)'}`,
                  background: isSel ? '#fefce8' : 'var(--white)',
                  borderColor: isSel ? 'rgba(212,175,55,0.4)' : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-slate-900 text-sm">{c.candidate}</span>
                  <span className="badge badge-gray text-xs font-bold">{c.score}% Avg</span>
                </div>
                <div className="text-xs text-slate-500 mb-2.5">{c.vacancy} · {c.version}</div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="coverage-track flex-1" style={{ height: 6 }}>
                    <div
                      className={`coverage-fill ${cPct === 100 ? 'coverage-fill-success' : 'coverage-fill-warning'}`}
                      style={{ width: `${cPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 min-w-[50px] text-right">
                    {cCovered}/{cTotal} Cov.
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Evidence Detail Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {/* Candidate Summary Card */}
          <div className="card">
            <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">{selected.candidate}</h2>
                  <span className="badge badge-green text-xs font-bold">Verified Identity</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Target Vacancy: <strong className="text-slate-700">{selected.vacancy}</strong> ({selected.version})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Evidence Coverage</div>
                  <div className="text-lg font-extrabold text-amber-900">{coveredCount} of {totalCount} Requirements</div>
                </div>
                <div className={`badge ${gapsCount === 0 ? 'badge-green' : 'badge-yellow'} font-bold text-xs`}>
                  {gapsCount === 0 ? 'Full Coverage' : `${gapsCount} Evidence Gap`}
                </div>
              </div>
            </div>

            {/* Coverage Breakdown Bars */}
            <div className="pt-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Requirement-by-Requirement Evidence Ledger
              </div>
              <div className="space-y-3">
                {selected.requirements.map((r) => {
                  const isCovered = r.status === 'covered';
                  return (
                    <div
                      key={r.reqId}
                      className="p-3.5 rounded-xl border transition-all"
                      style={{
                        background: isCovered ? 'var(--white)' : '#fffbeb',
                        borderColor: isCovered ? 'var(--border)' : '#fde68a',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2.5">
                          {isCovered ? (
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm">{r.skill}</span>
                              <span className="badge badge-gray text-[10px]">{r.reqId}</span>
                              <span className="badge badge-gray text-[10px]">{r.category}</span>
                              <span className={`badge ${isCovered ? 'badge-green' : 'badge-yellow'} text-[10px] font-bold`}>
                                {isCovered ? 'Verified Evidence' : 'Evidence Gap'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Evaluation Method: <strong className="text-slate-700">{r.method}</strong>
                              <span className="opacity-40 mx-1.5">·</span>
                              Type: {r.evidenceType}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {r.score !== null ? (
                            <span className="text-sm font-extrabold text-amber-900">{r.score}%</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </div>

                      {/* Evidence Details */}
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                        {r.evidence}
                      </div>

                      {/* Mitigation recommendation if gap */}
                      {r.mitigation && (
                        <div className="mt-2 text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
                          <Sparkles size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Recruiter Action:</strong> {r.mitigation}
                          </div>
                        </div>
                      )}

                      {/* Hash and timestamp */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 font-mono">
                        <span className="flex items-center gap-1">
                          <Hash size={10} /> {r.hash.slice(0, 24)}...
                        </span>
                        <span className="flex items-center gap-1 font-sans">
                          <Calendar size={10} /> {r.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
