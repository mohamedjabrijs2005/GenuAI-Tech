'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User, CheckCircle2, AlertTriangle, Clock, ShieldAlert,
  FileText, Brain, Briefcase, Award, MessageSquare, ArrowLeft,
  Calendar, Lock, ThumbsUp, ThumbsDown, PauseCircle, ChevronRight,
  ExternalLink, Download, AlertCircle, Sparkles, Filter, Check, X
} from 'lucide-react';

interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  vacancy: string;
  vacancyId: string;
  experience: string;
  recruitmentStatus: 'Applied' | 'Verified' | 'Assessment Completed' | 'Under Review' | 'Interview Scheduled' | 'Decision Pending' | 'Selected' | 'Not Selected';
  verificationStatus: 'Verified' | 'Pending' | 'Needs Review';
  appliedDate: string;
  companyDecision: 'Decision Pending' | 'Selected' | 'Not Selected' | 'On Hold' | 'Withdrawn';
  decisionNotes?: string;
  decisionDate?: string;
}

const CANDIDATES_DATA: Record<string, CandidateProfile> = {
  'c1': {
    id: 'c1',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    location: 'Austin, TX',
    vacancy: 'Software Developer',
    vacancyId: 'vac-001',
    experience: '4.5 Years',
    recruitmentStatus: 'Under Review',
    verificationStatus: 'Verified',
    appliedDate: '2026-09-12',
    companyDecision: 'Decision Pending',
  },
  'c2': {
    id: 'c2',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    vacancy: 'Software Developer',
    vacancyId: 'vac-001',
    experience: '3 Years',
    recruitmentStatus: 'Interview Scheduled',
    verificationStatus: 'Verified',
    appliedDate: '2026-09-14',
    companyDecision: 'Decision Pending',
  },
  'c3': {
    id: 'c3',
    name: 'Marcus Chen',
    email: 'marcus.chen@example.com',
    phone: '+1 (555) 876-5432',
    location: 'Seattle, WA',
    vacancy: 'DevOps Engineer',
    vacancyId: 'vac-002',
    experience: '5 Years',
    recruitmentStatus: 'Under Review',
    verificationStatus: 'Verified',
    appliedDate: '2026-09-15',
    companyDecision: 'Decision Pending',
  },
  'c4': {
    id: 'c4',
    name: 'Elena Rostova',
    email: 'elena.r@example.com',
    phone: '+44 20 7946 0912',
    location: 'London, UK',
    vacancy: 'Product Designer',
    vacancyId: 'vac-003',
    experience: '4 Years',
    recruitmentStatus: 'Under Review',
    verificationStatus: 'Verified',
    appliedDate: '2026-09-16',
    companyDecision: 'Decision Pending',
  },
};

const DEFAULT_CANDIDATE: CandidateProfile = {
  id: 'c1',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  phone: '+1 (555) 234-5678',
  location: 'Austin, TX',
  vacancy: 'Software Developer',
  vacancyId: 'vac-001',
  experience: '4.5 Years',
  recruitmentStatus: 'Under Review',
  verificationStatus: 'Verified',
  appliedDate: '2026-09-12',
  companyDecision: 'Decision Pending',
};

const TABS = [
  'Overview',
  'Resume',
  'Requirements',
  'Assessment',
  'Evidence',
  'Coverage & Gaps',
  'Interviews',
  'Integrity',
  'Timeline',
  'Recruiter Notes',
] as const;

type TabType = typeof TABS[number];

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || 'c1';
  const candidate = CANDIDATES_DATA[id] || { ...DEFAULT_CANDIDATE, id, name: `Candidate ${id}` };

  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [decision, setDecision] = useState<CandidateProfile['companyDecision']>(candidate.companyDecision);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionSaved, setDecisionSaved] = useState(false);

  // Recruiter notes state
  const [notes, setNotes] = useState([
    {
      id: 'n1',
      author: 'Sarah Connor (Lead Recruiter)',
      date: '2026-09-20 14:32',
      content: 'Strong Java and SQL background verified via official assessment. Candidate demonstrated clean OOP architecture and solved hard SQL join query within 12 minutes.',
      type: 'Technical Review'
    },
    {
      id: 'n2',
      author: 'David Kim (Engineering Lead)',
      date: '2026-09-22 10:15',
      content: 'AWS requirement is marked as gap in official test. Candidate claims 2 years of ECS & Terraform experience on resume. Recommendation: Cover AWS in round 2 structured interview.',
      type: 'Evidence Gap Strategy'
    }
  ]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('Technical Review');

  const handleSaveDecision = () => {
    setDecisionSaved(true);
    setTimeout(() => setDecisionSaved(false), 3000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([
      {
        id: `n-${Date.now()}`,
        author: 'Current Recruiter (You)',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        content: newNote.trim(),
        type: noteType
      },
      ...notes
    ]);
    setNewNote('');
  };

  // Requirement evidence data
  const REQUIREMENTS_EVIDENCE = [
    {
      id: 'REQ-01',
      name: 'Java (Core & OOP)',
      category: 'Technical',
      type: 'Required',
      priority: 'High',
      score: '82%',
      source: 'Official Technical Assessment',
      evaluationGroup: 'Java OOP & Collections',
      status: 'Supported Evidence',
      hasGap: false
    },
    {
      id: 'REQ-02',
      name: 'Data Structures & Algorithms',
      category: 'Technical',
      type: 'Required',
      priority: 'High',
      score: '76%',
      source: 'Official Technical Assessment',
      evaluationGroup: 'Array & Tree Algorithms',
      status: 'Supported Evidence',
      hasGap: false
    },
    {
      id: 'REQ-03',
      name: 'SQL & Database Design',
      category: 'Technical',
      type: 'Required',
      priority: 'Medium',
      score: '88%',
      source: 'Official Technical Assessment',
      evaluationGroup: 'Complex Queries & Joins',
      status: 'Supported Evidence',
      hasGap: false
    },
    {
      id: 'REQ-04',
      name: 'Problem Solving & Analytical Thinking',
      category: 'Problem Solving',
      type: 'Required',
      priority: 'High',
      score: '84%',
      source: 'Official Technical Assessment',
      evaluationGroup: 'Edge Case & Scenario Analysis',
      status: 'Supported Evidence',
      hasGap: false
    },
    {
      id: 'REQ-05',
      name: 'Technical Communication',
      category: 'Communication',
      type: 'Required',
      priority: 'Medium',
      score: '4.5 / 5.0',
      source: 'Structured Interview Round 1',
      evaluationGroup: 'Architecture Explanation',
      status: 'Supported Evidence',
      hasGap: false
    },
    {
      id: 'REQ-06',
      name: 'AWS Cloud Infrastructure',
      category: 'Domain & Cloud',
      type: 'Preferred',
      priority: 'Low',
      score: 'Resume Claim Only',
      source: 'Resume / Self-Reported',
      evaluationGroup: 'Unverified External Claim',
      status: 'Evidence Gap',
      hasGap: true
    }
  ];

  const coveredCount = REQUIREMENTS_EVIDENCE.filter(r => !r.hasGap).length;
  const totalCount = REQUIREMENTS_EVIDENCE.length;

  return (
    <div className="page-content">
      {/* Back Button & Breadcrumbs */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div className="breadcrumbs">
          <Link href="/dashboard/candidates" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft size={13} />
            Candidates Pipeline
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{candidate.name} ({candidate.id.toUpperCase()})</span>
        </div>

        {/* Candidate Detail Header */}
        <div className="page-header-row">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{candidate.name}</h1>
              <span className="badge badge-green font-bold text-xs flex items-center gap-1">
                <CheckCircle2 size={13} />
                {candidate.verificationStatus} Identity
              </span>
              <span className="badge badge-yellow font-bold text-xs">
                {candidate.recruitmentStatus}
              </span>
            </div>
            <p className="page-subtitle">
              Target Vacancy: <strong>{candidate.vacancy}</strong> ({candidate.vacancyId}) · Applied on {candidate.appliedDate} · Experience: {candidate.experience}
            </p>
          </div>

          {/* Recruiter Quick Actions / Company Decision Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm">
              <span className="text-xs font-bold text-slate-600 pl-2">Company Decision:</span>
              <select
                className="form-select text-xs font-bold py-1 px-2.5 rounded border border-slate-300 bg-slate-50"
                value={decision}
                onChange={e => setDecision(e.target.value as any)}
              >
                <option value="Decision Pending">Decision Pending</option>
                <option value="Selected">Selected</option>
                <option value="Not Selected">Not Selected</option>
                <option value="On Hold">On Hold</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
              <button
                className="btn btn-gold btn-sm"
                onClick={handleSaveDecision}
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>

        {decisionSaved && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Decision recorded successfully for audit compliance. GenuAI does not alter candidate state autonomously.
          </div>
        )}
      </div>

      {/* Principle Banner */}
      <div style={{ background: '#fefce8', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 'var(--r-lg)', padding: '12px 18px', marginBottom: 20 }}>
        <div className="flex items-center justify-between text-xs">
          <div className="text-amber-900 leading-relaxed">
            <strong>Recruiter Intelligence Notice:</strong> GenuAI does NOT compute automated candidate rankings or AI hire/reject recommendations. Evidence is mapped strictly against the {totalCount} defined role requirements for human evaluation.
          </div>
          <span className="badge badge-gold font-bold text-[11px] whitespace-nowrap ml-4">
            Human Decision Authority
          </span>
        </div>
      </div>

      {/* 10-Tab Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 mb-6 scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap border-b-2 ${
              activeTab === tab
                ? 'border-amber-600 text-amber-900 bg-amber-50/70 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
            {tab === 'Coverage & Gaps' && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-amber-200 text-amber-900 rounded-full font-bold">
                1 Gap
              </span>
            )}
            {tab === 'Integrity' && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
                Clear
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Vacancy</div>
              <div className="text-base font-extrabold text-slate-900">{candidate.vacancy}</div>
              <div className="text-xs text-slate-500 mt-1">ID: {candidate.vacancyId} (v1)</div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Evidence Coverage</div>
              <div className="text-base font-extrabold text-amber-900">{coveredCount} of {totalCount} Requirements</div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">83% Documented Evidence</div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Official Assessment</div>
              <div className="text-base font-extrabold text-slate-900">Completed (82% Avg)</div>
              <div className="text-xs text-slate-500 mt-1">4 Technical Groups Verified</div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Integrity Signals</div>
              <div className="text-base font-extrabold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> 0 Active Incidents
              </div>
              <div className="text-xs text-slate-500 mt-1">Proctoring Audit Clear</div>
            </div>
          </div>

          {/* Requirement Coverage Summary */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Requirement Evidence Matrix</h2>
                <p className="card-subtitle">Requirement-by-requirement verification status against defined vacancy criteria</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('Coverage & Gaps')}>
                View Gap Analysis
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Category</th>
                    <th>Classification</th>
                    <th>Priority</th>
                    <th>Official Evidence</th>
                    <th>Source Group</th>
                    <th>Evidence Status</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIREMENTS_EVIDENCE.map(r => (
                    <tr key={r.id}>
                      <td className="font-bold text-slate-900">{r.name}</td>
                      <td><span className="badge badge-gray">{r.category}</span></td>
                      <td>
                        <span className={`badge ${r.type === 'Required' ? 'badge-yellow' : 'badge-gray'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="td-mono font-bold text-xs">{r.priority}</td>
                      <td className="font-bold text-amber-900 td-mono">{r.score}</td>
                      <td className="td-muted text-xs">{r.source}</td>
                      <td>
                        {r.hasGap ? (
                          <span className="badge badge-yellow flex items-center gap-1 text-[11px] font-bold">
                            <AlertTriangle size={12} /> Evidence Gap
                          </span>
                        ) : (
                          <span className="badge badge-green flex items-center gap-1 text-[11px] font-bold">
                            <Check size={12} /> Supported
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resume */}
      {activeTab === 'Resume' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Submitted Candidate Resume</h2>
              <p className="card-subtitle">Parsed resume data and verified credentials submitted during application</p>
            </div>
            <button className="btn btn-secondary btn-sm">
              <Download size={14} /> Download PDF
            </button>
          </div>
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Professional Summary</h3>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                Software Engineer with 4.5 years of hands-on experience designing and implementing backend services using Java, Spring Boot, and PostgreSQL. Proven track record optimizing high-throughput database queries and leading microservices migration. Familiar with AWS container orchestration (ECS, Docker).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Experience Highlights</div>
                <div className="space-y-2 text-xs">
                  <div><strong>Senior Backend Engineer</strong> — FinTech Solutions (2023 – Present)</div>
                  <div><strong>Software Developer</strong> — CloudByte Systems (2021 – 2023)</div>
                  <div><strong>Junior Java Developer</strong> — InfoCorp (2020 – 2021)</div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Self-Reported Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {['Java 17', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'AWS ECS', 'Git', 'REST APIs', 'Unit Testing'].map(s => (
                    <span key={s} className="badge badge-gray">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Requirements */}
      {activeTab === 'Requirements' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Role Requirements Mapping</h2>
              <p className="card-subtitle">Detailed evaluation rubric configured for {candidate.vacancy}</p>
            </div>
          </div>
          <div className="space-y-3">
            {REQUIREMENTS_EVIDENCE.map(r => (
              <div key={r.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                    <span className="badge badge-gray text-[10px]">{r.category}</span>
                    <span className={`badge ${r.type === 'Required' ? 'badge-yellow' : 'badge-gray'} text-[10px]`}>{r.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Evaluation method: <strong>{r.source}</strong> · Target proficiency: Intermediate/Advanced
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-600">Priority: {r.priority}</div>
                  <span className={`badge ${r.hasGap ? 'badge-yellow' : 'badge-green'} text-[11px] font-bold mt-1`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Assessment */}
      {activeTab === 'Assessment' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Official Recruitment Assessment Results</h2>
              <p className="card-subtitle">Verified test performance by evaluation group. Scores represent objective performance, not a final hiring decision.</p>
            </div>
            <span className="badge badge-green font-bold">
              <CheckCircle2 size={13} /> Assessment Verified
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">Java Core & OOP</div>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">82%</div>
              <div className="text-[11px] text-slate-500 mt-1">18 of 22 questions correct</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">DSA & Algorithms</div>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">76%</div>
              <div className="text-[11px] text-slate-500 mt-1">2 coding challenges passed</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">SQL & Relational DB</div>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">88%</div>
              <div className="text-[11px] text-slate-500 mt-1">All query benchmarks met</div>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
            <strong>Audit Record:</strong> Completed on 2026-09-18 · Duration: 58 mins (Window: 75 mins) · Attempt #1 · Version: Vacancy Assessment v1.0 · Proctoring status: Verified Clean
          </div>
        </div>
      )}

      {/* Tab 5: Evidence */}
      {activeTab === 'Evidence' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Evidence Records Ledger</h2>
              <p className="card-subtitle">Cryptographically verified proof records mapped to individual role requirements</p>
            </div>
          </div>
          <div className="space-y-3">
            {REQUIREMENTS_EVIDENCE.map(r => (
              <div key={r.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Source: <span className="font-semibold text-slate-700">{r.source}</span> · Group: {r.evaluationGroup}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-amber-900">{r.score}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">SHA256: 8f4a...29c1</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Coverage & Gaps */}
      {activeTab === 'Coverage & Gaps' && (
        <div className="space-y-6">
          <div className="card border-amber-300 bg-amber-50/30">
            <div className="card-header">
              <div>
                <h2 className="card-title text-amber-950 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-700" />
                  Identified Evidence Gap: AWS Cloud Infrastructure
                </h2>
                <p className="card-subtitle text-amber-800">
                  Definition: &quot;Evidence Gap&quot; means insufficient structured evaluation evidence exists. It does NOT mean the candidate lacks the skill.
                </p>
              </div>
              <span className="badge badge-yellow font-bold">1 Evidence Gap</span>
            </div>
            <div className="p-4 bg-white border border-amber-200 rounded-lg text-xs space-y-2">
              <div><strong>Status:</strong> Unverified self-claim on resume (no test questions or structured interview evaluation recorded).</div>
              <div><strong>Requirement Priority:</strong> Low (Preferred Qualification)</div>
              <div><strong>Recommended Recruiter Actions:</strong></div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                <li>Formulate structured AWS scenario question for Round 2 Interview</li>
                <li>Request proof of AWS Certified Solutions Architect credential</li>
                <li>Request demonstration of existing GitHub project repository</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Interviews */}
      {activeTab === 'Interviews' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Structured Interview Evaluations</h2>
              <p className="card-subtitle">Objective human interview logs tied to specific requirement rubrics</p>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => router.push('/dashboard/interviews')}>
              Schedule Round 2
            </button>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">Round 1: Technical Explanation & Architecture</span>
              <span className="badge badge-green font-bold text-xs">Completed</span>
            </div>
            <div className="text-xs text-slate-600 mb-3">
              Interviewer: <strong>David Kim (Engineering Lead)</strong> · Date: 2026-09-22 10:00 AM · Mode: Video Call
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1.5">
              <div><strong>Technical Explanation Score:</strong> 4.5 / 5.0 (High clarity on microservices communication)</div>
              <div><strong>Problem Solving Rubric:</strong> 4.0 / 5.0 (Demonstrated strong edge-case handling)</div>
              <div><strong>Evaluator Notes:</strong> Candidate articulates complex trade-offs between consistency and availability clearly. Recommended for final company interview.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Integrity */}
      {activeTab === 'Integrity' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Proctoring Telemetry & Integrity Signals</h2>
              <p className="card-subtitle">Observable assessment environment telemetry. GenuAI logs signals; recruiters make judgments.</p>
            </div>
            <span className="badge badge-green font-bold">Audit Status: Clean</span>
          </div>
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Tab Focus & Browser Lock: <strong>No tab switches recorded (100% focused)</strong></span>
              </div>
              <span className="badge badge-green font-bold">Passed</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Clipboard Protection: <strong>0 copy-paste attempts outside authorized code buffer</strong></span>
              </div>
              <span className="badge badge-green font-bold">Passed</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Audio/Video Feed Telemetry: <strong>Single face verified continuously</strong></span>
              </div>
              <span className="badge badge-green font-bold">Passed</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Timeline */}
      {activeTab === 'Timeline' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recruitment Activity Timeline</h2>
              <p className="card-subtitle">Chronological record of all candidate events and verified milestones</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            {[
              { date: '2026-09-22 10:45', action: 'Round 1 Interview Evaluation Recorded', actor: 'David Kim' },
              { date: '2026-09-20 15:00', action: 'Technical Assessment Evidence Verified', actor: 'GenuAI Engine' },
              { date: '2026-09-18 11:30', action: 'Official Assessment Completed', actor: 'Alex Rivera' },
              { date: '2026-09-15 09:00', action: 'Candidate Verification Approved', actor: 'Sarah Connor' },
              { date: '2026-09-12 14:20', action: 'Application Submitted for Software Developer', actor: 'Alex Rivera' },
            ].map((t, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{t.action}</div>
                  <div className="text-slate-500 mt-0.5">By {t.actor} · {t.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 10: Recruiter Notes */}
      {activeTab === 'Recruiter Notes' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recruiter Review Notes (Private & Internal)</h2>
              <p className="card-subtitle">Internal notes visible only to authorized company recruiters and interviewers</p>
            </div>
          </div>

          {/* New note form */}
          <form onSubmit={handleAddNote} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Category:</label>
              <select
                className="form-select text-xs font-bold py-1 px-2.5 rounded border border-slate-300"
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
              >
                <option>Technical Review</option>
                <option>Evidence Gap Strategy</option>
                <option>Interview Observation</option>
                <option>Hiring Committee Note</option>
              </select>
            </div>
            <textarea
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              rows={3}
              placeholder="Record objective observations regarding requirements or evidence..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <button type="submit" className="btn btn-gold btn-sm">
              Add Note
            </button>
          </form>

          {/* Notes list */}
          <div className="space-y-3">
            {notes.map(n => (
              <div key={n.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{n.author}</span>
                    <span className="badge badge-gray text-[10px]">{n.type}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{n.date}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
