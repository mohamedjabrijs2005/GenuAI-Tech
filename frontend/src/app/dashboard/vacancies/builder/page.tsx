'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Sparkles, Shield, AlertCircle,
  FileText, Target, Layers, ClipboardList, CheckCircle2, Handshake, Lock, Info,
  HelpCircle, ChevronDown, ChevronRight, Edit3
} from 'lucide-react';

interface Requirement {
  id: string;
  name: string;
  category: 'Technical' | 'Problem Solving' | 'Communication' | 'Domain' | 'Infrastructure';
  type: 'Required' | 'Preferred';
  priority: 'High' | 'Medium' | 'Low';
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  method: 'Official Technical Assessment' | 'Structured Interview' | 'Project Evaluation' | 'Credential' | 'Candidate Submission';
  group: string;
}

interface AssessmentGroup {
  id: string;
  name: string;
  type: string;
  duration: number; // minutes
  questionCount: number;
  requirementsCovered: string[];
}

interface EvaluationGroup {
  id: string;
  assessmentGroupId: string;
  name: string;
  description: string;
  mappedRequirementId: string;
}

const STEPS = [
  { id: 1, title: 'Role Info', icon: FileText },
  { id: 2, title: 'Requirements', icon: Target },
  { id: 3, title: 'Req Grouping', icon: Layers },
  { id: 4, title: 'Assessment Plan', icon: ClipboardList },
  { id: 5, title: 'Assessment Groups', icon: Layers },
  { id: 6, title: 'Evaluation Groups', icon: CheckCircle2 },
  { id: 7, title: 'Question Mapping', icon: HelpCircle },
  { id: 8, title: 'Agreement Center', icon: Handshake },
  { id: 9, title: 'Submit Verification', icon: Shield },
];

export default function VacancyBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // STEP 1 State
  const [basicInfo, setBasicInfo] = useState({
    title: 'Senior Software Developer',
    dept: 'Engineering',
    location: 'Chennai, India / Remote',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    openings: 2,
    experienceLevel: '3 - 5 Years',
    salaryRange: '₹14,000,000 - ₹20,000,000 P.A.',
    deadline: '2026-10-30',
    description: 'We are seeking an experienced Software Developer to architect scalable backend services and contribute to core engineering workflows.',
  });

  // STEP 2 & 3 State: Role Requirements
  const [requirements, setRequirements] = useState<Requirement[]>([
    { id: 'REQ-01', name: 'Java Core & OOP', category: 'Technical', type: 'Required', priority: 'High', proficiency: 'Advanced', method: 'Official Technical Assessment', group: 'TECHNICAL' },
    { id: 'REQ-02', name: 'Data Structures & Algorithms', category: 'Technical', type: 'Required', priority: 'High', proficiency: 'Advanced', method: 'Official Technical Assessment', group: 'TECHNICAL' },
    { id: 'REQ-03', name: 'PostgreSQL & SQL Design', category: 'Technical', type: 'Required', priority: 'Medium', proficiency: 'Intermediate', method: 'Official Technical Assessment', group: 'TECHNICAL' },
    { id: 'REQ-04', name: 'Analytical Thinking & Debugging', category: 'Problem Solving', type: 'Required', priority: 'High', proficiency: 'Advanced', method: 'Official Technical Assessment', group: 'PROBLEM SOLVING' },
    { id: 'REQ-05', name: 'Verbal & Technical Communication', category: 'Communication', type: 'Required', priority: 'Medium', proficiency: 'Intermediate', method: 'Structured Interview', group: 'COMMUNICATION' },
    { id: 'REQ-06', name: 'AWS Cloud Architecture', category: 'Infrastructure', type: 'Preferred', priority: 'Low', proficiency: 'Intermediate', method: 'Credential', group: 'DOMAIN' },
  ]);

  const [newReq, setNewReq] = useState<{
    name: string;
    category: 'Technical' | 'Problem Solving' | 'Communication' | 'Domain' | 'Infrastructure';
    type: 'Required' | 'Preferred';
    priority: 'High' | 'Medium' | 'Low';
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
    method: 'Official Technical Assessment' | 'Structured Interview' | 'Project Evaluation' | 'Credential' | 'Candidate Submission';
    group: string;
  }>({
    name: '',
    category: 'Technical',
    type: 'Required',
    priority: 'High',
    proficiency: 'Intermediate',
    method: 'Official Technical Assessment',
    group: 'TECHNICAL',
  });

  // STEP 5 State: Assessment Groups (One assessment covers multiple requirements)
  const [assessmentGroups, setAssessmentGroups] = useState<AssessmentGroup[]>([
    {
      id: 'AG-01',
      name: 'Core Engineering Technical Assessment',
      type: 'Technical MCQ + Coding',
      duration: 60,
      questionCount: 25,
      requirementsCovered: ['REQ-01', 'REQ-02', 'REQ-03'],
    },
    {
      id: 'AG-02',
      name: 'Systemic Problem Solving Evaluation',
      type: 'Scenario Based',
      duration: 30,
      questionCount: 10,
      requirementsCovered: ['REQ-04'],
    },
    {
      id: 'AG-03',
      name: 'Structured Technical Interview',
      type: 'Live Interview Evaluation',
      duration: 45,
      questionCount: 5,
      requirementsCovered: ['REQ-05'],
    }
  ]);

  // STEP 6 State: Evaluation Groups inside Assessments
  const [evalGroups, setEvalGroups] = useState<EvaluationGroup[]>([
    { id: 'EG-01', assessmentGroupId: 'AG-01', name: 'OOP Principles & Polymorphism', description: 'Classes, Inheritance, Interface abstraction', mappedRequirementId: 'REQ-01' },
    { id: 'EG-02', assessmentGroupId: 'AG-01', name: 'Collections & Memory Management', description: 'Lists, Sets, HashMaps, Garbage Collection', mappedRequirementId: 'REQ-01' },
    { id: 'EG-03', assessmentGroupId: 'AG-01', name: 'Tree & Graph Traversal (DSA)', description: 'Binary Search Trees, Graph DFS/BFS', mappedRequirementId: 'REQ-02' },
    { id: 'EG-04', assessmentGroupId: 'AG-01', name: 'Relational Indexing & Joins', description: 'Inner/Outer joins, Indexes, Query Plans', mappedRequirementId: 'REQ-03' },
  ]);

  // STEP 8 State: Agreement Center
  const [agreements, setAgreements] = useState({
    permissionA: false, // Recruitment Assessment & Result Sharing
    permissionB: false, // Aggregated Role Intelligence Contribution
    agreeTerms: false,
  });

  const addRequirement = () => {
    if (!newReq.name.trim()) return;
    const newId = `REQ-${(requirements.length + 1).toString().padStart(2, '0')}`;
    setRequirements([...requirements, { id: newId, ...newReq }]);
    setNewReq({
      name: '',
      category: 'Technical',
      type: 'Required',
      priority: 'High',
      proficiency: 'Intermediate',
      method: 'Official Technical Assessment',
      group: 'TECHNICAL',
    });
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  const handleSubmitVerification = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/vacancies');
    }, 2000);
  };

  return (
    <div className="page-content" style={{ maxWidth: 1200 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <Link href="/dashboard/vacancies" className="hover:text-primary">Vacancies</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Guided Vacancy Builder</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Guided Vacancy &amp; Requirement Builder
            </h1>
            <p className="page-subtitle">
              Define role requirements, configure structured assessments, and set explicit recruitment permissions.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/vacancies" className="btn btn-secondary">
              Cancel & Exit
            </Link>
          </div>
        </div>
      </div>

      {/* Multi-step Spacious Stepper Card */}
      <div className="card mb-8" style={{ padding: '24px 28px', background: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
        {/* Stepper Header with Progress Bar */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Phase {currentStep} of 9 — {STEPS[currentStep - 1].title}
            </div>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">
              Step-by-step Role Requirement & Assessment Configuration
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">
                {Math.round((currentStep / 9) * 100)}% Completed
              </div>
              <div className="text-[11px] text-slate-500 font-medium">9 Step Pipeline</div>
            </div>
            <div className="w-28 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-300"
                style={{ width: `${(currentStep / 9) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Flexible 9-Step Pills Grid with Generous Spacing */}
        <div className="flex flex-wrap items-center gap-2.5">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => isDone && setCurrentStep(step.id)}
                disabled={!isDone && !isCurrent}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-100/80 text-amber-950 border-2 border-amber-400 shadow-sm'
                    : isDone
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                  isCurrent
                    ? 'bg-amber-700 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  {isDone ? <Check size={12} /> : step.id}
                </div>
                <span className="whitespace-nowrap">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Basic Role Information */}
      {currentStep === 1 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                Step 1: Basic Role Information
              </h2>
              <p className="card-subtitle">Define primary vacancy details and employment parameters.</p>
            </div>
            <span className="badge badge-gold">Step 1 of 9</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Job Title <span className="required">*</span></label>
              <input
                className="form-input"
                value={basicInfo.title}
                onChange={e => setBasicInfo({...basicInfo, title: e.target.value})}
                placeholder="e.g. Senior Software Developer"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department <span className="required">*</span></label>
              <select
                className="form-select"
                value={basicInfo.dept}
                onChange={e => setBasicInfo({...basicInfo, dept: e.target.value})}
              >
                <option>Engineering</option>
                <option>Product & Design</option>
                <option>Data & Analytics</option>
                <option>Sales & Marketing</option>
                <option>Operations</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Work Mode <span className="required">*</span></label>
              <select
                className="form-select"
                value={basicInfo.workMode}
                onChange={e => setBasicInfo({...basicInfo, workMode: e.target.value})}
              >
                <option>Hybrid</option>
                <option>On-site</option>
                <option>Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                value={basicInfo.location}
                onChange={e => setBasicInfo({...basicInfo, location: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Number of Openings</label>
              <input
                type="number"
                className="form-input"
                value={basicInfo.openings}
                onChange={e => setBasicInfo({...basicInfo, openings: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Role Overview & Description</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={basicInfo.description}
                onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Role Requirements */}
      {currentStep === 2 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Target size={18} className="text-amber-600" />
                Step 2: Role Requirements (Core Engine)
              </h2>
              <p className="card-subtitle">
                Define the specific skills, capabilities, and expectations required for this role.
              </p>
            </div>
            <span className="badge badge-gold">Step 2 of 9</span>
          </div>

          {/* Add New Requirement Form */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus size={14} className="text-amber-600" />
              Add Specific Role Requirement
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="form-label">Requirement Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Java Spring Boot"
                  value={newReq.name}
                  onChange={e => setNewReq({...newReq, name: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newReq.category}
                  onChange={e => setNewReq({...newReq, category: e.target.value as any})}
                >
                  <option>Technical</option>
                  <option>Problem Solving</option>
                  <option>Communication</option>
                  <option>Domain</option>
                  <option>Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="form-label">Classification</label>
                <select
                  className="form-select"
                  value={newReq.type}
                  onChange={e => setNewReq({...newReq, type: e.target.value as any})}
                >
                  <option value="Required">Required (Mandatory)</option>
                  <option value="Preferred">Preferred (Optional)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={newReq.priority}
                  onChange={e => setNewReq({...newReq, priority: e.target.value as any})}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="form-label">Proficiency Level</label>
                <select
                  className="form-select"
                  value={newReq.proficiency}
                  onChange={e => setNewReq({...newReq, proficiency: e.target.value as any})}
                >
                  <option>Basic</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label className="form-label">Evaluation Method</label>
                <select
                  className="form-select"
                  value={newReq.method}
                  onChange={e => setNewReq({...newReq, method: e.target.value as any})}
                >
                  <option>Official Technical Assessment</option>
                  <option>Structured Interview</option>
                  <option>Project Evaluation</option>
                  <option>Credential</option>
                  <option>Candidate Submission</option>
                </select>
              </div>
            </div>
            <button className="btn btn-gold btn-sm" onClick={addRequirement}>
              <Plus size={14} /> Add Requirement to Vacancy
            </button>
          </div>

          {/* Current Requirements List */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Requirement Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Proficiency</th>
                  <th>Evaluation Method</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map(req => (
                  <tr key={req.id}>
                    <td className="td-mono font-bold text-amber-800">{req.id}</td>
                    <td className="font-bold text-slate-900">{req.name}</td>
                    <td><span className="badge badge-gray">{req.category}</span></td>
                    <td>
                      <span className={`badge ${req.type === 'Required' ? 'badge-red' : 'badge-blue'}`}>
                        {req.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${req.priority === 'High' ? 'badge-yellow' : 'badge-gray'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="td-muted font-medium">{req.proficiency}</td>
                    <td className="td-muted text-xs font-semibold">{req.method}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon text-red-600 hover:bg-red-50"
                        onClick={() => removeRequirement(req.id)}
                        title="Delete requirement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 3: Requirement Grouping */}
      {currentStep === 3 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Layers size={18} className="text-amber-600" />
                Step 3: Requirement Grouping
              </h2>
              <p className="card-subtitle">Organize role requirements into logical evaluation groups.</p>
            </div>
            <span className="badge badge-gold">Step 3 of 9</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['TECHNICAL', 'PROBLEM SOLVING', 'COMMUNICATION', 'DOMAIN'].map(groupName => {
              const groupReqs = requirements.filter(r => r.group === groupName || (groupName === 'TECHNICAL' && r.category === 'Technical'));
              return (
                <div key={groupName} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Layers size={14} className="text-amber-600" />
                      {groupName} GROUP
                    </span>
                    <span className="badge badge-gray">{groupReqs.length} Requirements</span>
                  </div>
                  <div className="space-y-2">
                    {groupReqs.map(req => (
                      <div key={req.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{req.name}</div>
                          <div className="text-slate-500 text-[11px]">{req.proficiency} • {req.method}</div>
                        </div>
                        <span className={`badge ${req.type === 'Required' ? 'badge-red' : 'badge-blue'}`}>
                          {req.type}
                        </span>
                      </div>
                    ))}
                    {groupReqs.length === 0 && (
                      <div className="text-xs text-slate-400 italic py-2">No requirements in this group yet.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Assessment Plan */}
      {currentStep === 4 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <ClipboardList size={18} className="text-amber-600" />
                Step 4: Assessment Plan & Evaluation Strategy
              </h2>
              <p className="card-subtitle">
                Ensure every requirement is mapped to a valid evaluation method before creating test units.
              </p>
            </div>
            <span className="badge badge-gold">Step 4 of 9</span>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 flex items-start gap-3">
            <Info size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Assessment Count Rule:</strong> One assessment can cover multiple requirements (e.g. 1 Technical Assessment covering Java, SQL & DSA). Requirement count is separate from Assessment count.
            </div>
          </div>

          <div className="space-y-3">
            {requirements.map(req => (
              <div key={req.id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700">{req.id}</span>
                    <span className="font-bold text-slate-900">{req.name}</span>
                    <span className={`badge ${req.type === 'Required' ? 'badge-red' : 'badge-blue'}`}>{req.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Priority: <strong>{req.priority}</strong> • Category: {req.category}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700">{req.method}</div>
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 size={12} /> Target Mapped
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: Assessment Grouping */}
      {currentStep === 5 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Layers size={18} className="text-amber-600" />
                Step 5: Assessment Group Setup
              </h2>
              <p className="card-subtitle">Group multi-requirement evaluation units into specific assessments.</p>
            </div>
            <span className="badge badge-gold">Step 5 of 9</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {assessmentGroups.map(ag => (
              <div key={ag.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700">{ag.id}</span>
                  <span className="badge badge-gold">{ag.duration} mins</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{ag.name}</h3>
                <div className="text-xs text-slate-500 mb-3">{ag.type} • {ag.questionCount} Questions</div>

                <div className="text-xs font-semibold text-slate-700 mb-1.5">Mapped Requirements:</div>
                <div className="flex flex-wrap gap-1">
                  {ag.requirementsCovered.map(reqId => (
                    <span key={reqId} className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded">
                      {reqId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: Evaluation Grouping */}
      {currentStep === 6 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <CheckCircle2 size={18} className="text-amber-600" />
                Step 6: Evaluation Grouping (Inside Assessment)
              </h2>
              <p className="card-subtitle">Define granular evaluation breakdown groups within each assessment unit.</p>
            </div>
            <span className="badge badge-gold">Step 6 of 9</span>
          </div>

          <div className="space-y-3">
            {evalGroups.map(eg => (
              <div key={eg.id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700">{eg.id}</span>
                    <span className="font-bold text-slate-900">{eg.name}</span>
                    <span className="badge badge-gray">Parent: {eg.assessmentGroupId}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{eg.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    Maps to {eg.mappedRequirementId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: Question Mapping */}
      {currentStep === 7 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <HelpCircle size={18} className="text-amber-600" />
                Step 7: Question / Task Traceability Mapping
              </h2>
              <p className="card-subtitle">
                Ensure end-to-end data model mapping: Question → Evaluation Group → Requirement → Assessment Group → Vacancy.
              </p>
            </div>
            <span className="badge badge-gold">Step 7 of 9</span>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono mb-4 leading-relaxed">
            <div>[Traceability Check]</div>
            <div>Question #104 → Evaluation Group (OOP Principles) → Requirement REQ-01 (Java Core) → Assessment AG-01 → Vacancy v1</div>
            <div className="text-emerald-400 mt-1">✔ Full traceability chain validated. No unmapped questions.</div>
          </div>
        </div>
      )}

      {/* STEP 8: Agreement Center */}
      {currentStep === 8 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Handshake size={18} className="text-amber-600" />
                Step 8: GenuAI — Company Agreement
              </h2>
              <p className="card-subtitle">
                Please authorize the recruitment assessment and role intelligence permissions for this vacancy.
              </p>
            </div>
            <span className="badge badge-gold">Step 8 of 9</span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 border-2 border-amber-200 bg-amber-50/50 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="clause1"
                className="mt-1 w-4 h-4 text-amber-600 rounded cursor-pointer"
                checked={agreements.permissionA}
                onChange={e => setAgreements({...agreements, permissionA: e.target.checked})}
              />
              <div>
                <label htmlFor="clause1" className="font-bold text-slate-900 text-sm cursor-pointer">
                  Official Assessment & Result Sharing
                </label>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  GenuAI may conduct the official assessment and share results with authorized company recruiters.
                </p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 bg-white rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="clause2"
                className="mt-1 w-4 h-4 text-amber-600 rounded cursor-pointer"
                defaultChecked
              />
              <div>
                <label htmlFor="clause2" className="font-bold text-slate-900 text-sm cursor-pointer">
                  Evidence Mapping
                </label>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Assessment results may be mapped to the vacancy’s requirements as supporting evidence.
                </p>
              </div>
            </div>

            <div className="p-4 border-2 border-blue-200 bg-blue-50/50 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="clause3"
                className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                checked={agreements.permissionB}
                onChange={e => setAgreements({...agreements, permissionB: e.target.checked})}
              />
              <div>
                <label htmlFor="clause3" className="font-bold text-slate-900 text-sm cursor-pointer">
                  Cross-Company Role Intelligence
                </label>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  GenuAI may use approved, non-confidential skill and assessment-priority data to identify common assessment areas for the same role across participating companies and create a role-level profile.
                </p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 bg-white rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="clause4"
                className="mt-1 w-4 h-4 text-amber-600 rounded cursor-pointer"
                defaultChecked
              />
              <div>
                <label htmlFor="clause4" className="font-bold text-slate-900 text-sm cursor-pointer">
                  Confidentiality
                </label>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Company-specific candidate data, test questions, and confidential content remain private.
                </p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 bg-white rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="clause5"
                className="mt-1 w-4 h-4 text-amber-600 rounded cursor-pointer"
                defaultChecked
              />
              <div>
                <label htmlFor="clause5" className="font-bold text-slate-900 text-sm cursor-pointer">
                  Human Decision
                </label>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  GenuAI provides evidence and intelligence; the company makes the final hiring decision.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 9: Submit for Admin Verification */}
      {currentStep === 9 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Shield size={18} className="text-amber-600" />
                Step 9: Final Review & Submit for Admin Verification
              </h2>
              <p className="card-subtitle">Review complete vacancy configuration before submitting to platform admin.</p>
            </div>
            <span className="badge badge-gold">Final Step</span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mb-6 space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Vacancy Title:</span>
              <span className="font-bold text-slate-900">{basicInfo.title}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-slate-900">{basicInfo.dept}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Configured Requirements:</span>
              <span className="font-bold text-amber-700">{requirements.length} Requirements</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Assessment Units:</span>
              <span className="font-bold text-emerald-700">{assessmentGroups.length} Assessment Groups</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Agreement Status:</span>
              <span className={`font-bold ${agreements.permissionA ? 'text-emerald-600' : 'text-red-600'}`}>
                {agreements.permissionA ? 'Permission A Authorized' : 'Permission A Pending'}
              </span>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl mb-6 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Vacancy successfully submitted for Admin Verification! Redirecting...
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              className="btn btn-gold btn-lg"
              disabled={!agreements.permissionA || savedSuccess}
              onClick={handleSubmitVerification}
            >
              <Shield size={16} /> Submit Vacancy for Verification
            </button>
          </div>
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft size={16} /> Previous Step
        </button>

        {currentStep < 9 && (
          <button
            className="btn btn-gold"
            onClick={() => setCurrentStep(Math.min(9, currentStep + 1))}
          >
            Next Step <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
