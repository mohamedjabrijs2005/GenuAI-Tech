'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Shield, AlertCircle,
  FileText, Target, ClipboardList, Users as UsersIcon, CheckCircle2, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Requirement {
  id: string;
  name: string;
  category: 'Technical' | 'Problem Solving' | 'Communication' | 'Domain' | 'Infrastructure';
  type: 'Required' | 'Preferred';
  priority: 'High' | 'Medium' | 'Low';
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  method: 'Official Technical Assessment' | 'Structured Interview' | 'Project Evaluation' | 'Credential' | 'Candidate Submission';
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

const STEPS = [
  { id: 1, title: 'Role & Vacancy Info', icon: FileText },
  { id: 2, title: 'Requirements', icon: Target },
  { id: 3, title: 'Assessment', icon: ClipboardList },
  { id: 4, title: 'Candidate Settings', icon: UsersIcon },
  { id: 5, title: 'Review & Submit', icon: Shield },
];

const EXP_OPTIONS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

const EMP_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

export default function VacancyBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Departments loaded from API
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    api.get('/departments').then(res => {
      setDepartments((res.data?.departments || []).filter((d: Department) => d.is_active));
    }).catch(() => {});
  }, []);

  // STEP 1 State
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    departmentId: '',
    departmentName: '',
    location: '',
    workMode: 'Hybrid',
    employmentType: 'full_time',
    openings: 1,
    experienceLevel: 'senior',
    salaryRange: '',
    deadline: '',
    description: '',
  });

  // STEP 2 State: Requirements
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newReq, setNewReq] = useState<{
    name: string;
    category: 'Technical' | 'Problem Solving' | 'Communication' | 'Domain' | 'Infrastructure';
    type: 'Required' | 'Preferred';
    priority: 'High' | 'Medium' | 'Low';
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
    method: 'Official Technical Assessment' | 'Structured Interview' | 'Project Evaluation' | 'Credential' | 'Candidate Submission';
  }>({
    name: '',
    category: 'Technical',
    type: 'Required',
    priority: 'High',
    proficiency: 'Intermediate',
    method: 'Official Technical Assessment',
  });

  // STEP 3 State: Assessment
  const [assessmentConfig, setAssessmentConfig] = useState({
    required: false,
    duration: 60,
    totalMarks: 100,
    scheduleMode: 'on_demand',
  });

  // STEP 4 State: Candidate Settings
  const [candidateSettings, setCandidateSettings] = useState({
    resumeRequired: false,
    approvalRequired: false,
    maxTargetsPerCandidate: 1,
  });

  const addRequirement = () => {
    if (!newReq.name.trim()) {
      toast.error('Requirement name is required.');
      return;
    }
    const newId = `REQ-${(requirements.length + 1).toString().padStart(2, '0')}`;
    setRequirements([...requirements, { id: newId, ...newReq }]);
    setNewReq({
      name: '',
      category: 'Technical',
      type: 'Required',
      priority: 'High',
      proficiency: 'Intermediate',
      method: 'Official Technical Assessment',
    });
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!basicInfo.title.trim()) errors.title = 'Job title is required.';
      if (!basicInfo.location.trim()) errors.location = 'Location is required.';
      if (basicInfo.openings < 1) errors.openings = 'At least 1 opening required.';
    }

    if (step === 2) {
      if (requirements.length === 0) errors.requirements = 'Please add at least one requirement.';
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(Math.min(5, currentStep + 1));
  };

  const handleSubmitVerification = async () => {
    // Validate all steps
    if (!basicInfo.title.trim()) {
      toast.error('Please complete Role & Vacancy Information (Step 1).');
      setCurrentStep(1);
      return;
    }
    if (requirements.length === 0) {
      toast.error('Please add at least one requirement (Step 2).');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create vacancy as DRAFT
      const createRes = await api.post('/vacancies', {
        title: basicInfo.title.trim(),
        departmentId: basicInfo.departmentId || undefined,
        departmentName: basicInfo.departmentName || basicInfo.title.split(' ')[0] || 'General',
        location: basicInfo.location.trim() || 'Remote',
        workMode: basicInfo.workMode || 'Hybrid',
        employmentType: basicInfo.employmentType || 'full_time',
        experienceLevel: basicInfo.experienceLevel || 'senior',
        vacancyCount: Number(basicInfo.openings) || 1,
        salaryRange: basicInfo.salaryRange || null,
        closingDate: basicInfo.deadline || null,
        jobDescription: basicInfo.description || '',
        autoSubmit: false,
        requirements: requirements.map((r) => ({
          name: r.name,
          category: r.category,
          type: r.type,
          priority: r.priority,
          proficiency: r.proficiency,
          method: r.method,
        })),
      });

      const vacancy = createRes.data?.vacancy;
      if (!vacancy?.id) {
        toast.error('Failed to create vacancy. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 2. Submit for admin verification using proper endpoint
      try {
        await api.post(`/vacancies/${vacancy.id}/submit`);
      } catch (submitErr: any) {
        const errMsg = submitErr.response?.data?.error;
        toast.error(errMsg || 'Vacancy created as draft, but submission failed. Please submit from the vacancies list.');
        router.push('/dashboard/vacancies');
        return;
      }

      // 3. Broadcast to admin panel
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('genuai_status_sync');
          bc.postMessage({ type: 'VACANCY_SUBMITTED', vacancyId: vacancy.id });
          bc.close();
        }
      } catch (_) {}

      setSavedSuccess(true);
      toast.success('Vacancy submitted for admin verification!');
      setTimeout(() => {
        router.push(`/dashboard/vacancies/${vacancy.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create/submit vacancy', err);
      const errMsg = err.response?.data?.error;
      if (errMsg) {
        toast.error(errMsg);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!basicInfo.title.trim()) {
      toast.error('Job title is required to save a draft.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const createRes = await api.post('/vacancies', {
        title: basicInfo.title.trim(),
        departmentId: basicInfo.departmentId || undefined,
        departmentName: basicInfo.departmentName || basicInfo.title.split(' ')[0] || 'General',
        location: basicInfo.location.trim() || 'Remote',
        workMode: basicInfo.workMode || 'Hybrid',
        employmentType: basicInfo.employmentType || 'full_time',
        experienceLevel: basicInfo.experienceLevel || 'senior',
        vacancyCount: Number(basicInfo.openings) || 1,
        salaryRange: basicInfo.salaryRange || null,
        closingDate: basicInfo.deadline || null,
        jobDescription: basicInfo.description || '',
        autoSubmit: false,
        requirements: requirements.map((r) => ({
          name: r.name,
          category: r.category,
          type: r.type,
          priority: r.priority,
          proficiency: r.proficiency,
          method: r.method,
        })),
      });

      const vacancy = createRes.data?.vacancy;
      toast.success('Vacancy saved as Draft successfully!');
      router.push(`/dashboard/vacancies/${vacancy?.id || ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 1100 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <Link href="/dashboard/vacancies" className="hover:text-primary">Vacancies</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Create Vacancy</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Create Vacancy
            </h1>
            <p className="page-subtitle">
              Define role details, requirements, and submit for admin verification.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/vacancies" className="btn btn-secondary">
              Cancel &amp; Exit
            </Link>
          </div>
        </div>
      </div>

      {/* 5-Step Stepper */}
      <div className="card mb-8" style={{ padding: '24px 28px', background: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Step {currentStep} of 5 — {STEPS[currentStep - 1].title}
            </div>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">
              Vacancy Creation Wizard
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">
                {Math.round((currentStep / 5) * 100)}% Completed
              </div>
              <div className="text-[11px] text-slate-500 font-medium">5 Steps</div>
            </div>
            <div className="w-28 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

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

      {/* STEP 1: Role & Vacancy Info */}
      {currentStep === 1 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                Step 1: Role &amp; Vacancy Information
              </h2>
              <p className="card-subtitle">Define vacancy details including department, role, and employment parameters.</p>
            </div>
            <span className="badge badge-gold">Step 1 of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Job Title <span className="required">*</span></label>
              <input
                className={`form-input${stepErrors.title ? ' error' : ''}`}
                value={basicInfo.title}
                onChange={e => { setBasicInfo({...basicInfo, title: e.target.value}); setStepErrors(p => ({...p, title: ''})); }}
                placeholder="e.g. Senior Software Developer"
              />
              {stepErrors.title && <div className="form-error"><AlertCircle size={11}/> {stepErrors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              {departments.length > 0 ? (
                <select
                  className="form-select"
                  value={basicInfo.departmentId}
                  onChange={e => setBasicInfo({...basicInfo, departmentId: e.target.value, departmentName: ''})}
                >
                  <option value="">Select or leave blank to auto-create</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              ) : (
                <input
                  className="form-input"
                  value={basicInfo.departmentName}
                  onChange={e => setBasicInfo({...basicInfo, departmentName: e.target.value})}
                  placeholder="e.g. Engineering (will be auto-created)"
                />
              )}
              <div className="form-hint">Select an existing department or type a name to auto-create one.</div>
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
              <label className="form-label">Location <span className="required">*</span></label>
              <input
                className={`form-input${stepErrors.location ? ' error' : ''}`}
                value={basicInfo.location}
                onChange={e => { setBasicInfo({...basicInfo, location: e.target.value}); setStepErrors(p => ({...p, location: ''})); }}
                placeholder="e.g. London, UK or Remote"
              />
              {stepErrors.location && <div className="form-error"><AlertCircle size={11}/> {stepErrors.location}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Number of Openings <span className="required">*</span></label>
              <input
                type="number"
                className={`form-input${stepErrors.openings ? ' error' : ''}`}
                value={basicInfo.openings}
                onChange={e => { setBasicInfo({...basicInfo, openings: parseInt(e.target.value) || 1}); setStepErrors(p => ({...p, openings: ''})); }}
                min={1}
              />
              {stepErrors.openings && <div className="form-error"><AlertCircle size={11}/> {stepErrors.openings}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level <span className="required">*</span></label>
              <select
                className="form-select"
                value={basicInfo.experienceLevel}
                onChange={e => setBasicInfo({...basicInfo, experienceLevel: e.target.value})}
              >
                {EXP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Employment Type <span className="required">*</span></label>
              <select
                className="form-select"
                value={basicInfo.employmentType}
                onChange={e => setBasicInfo({...basicInfo, employmentType: e.target.value})}
              >
                {EMP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Salary Range</label>
              <input
                className="form-input"
                value={basicInfo.salaryRange}
                onChange={e => setBasicInfo({...basicInfo, salaryRange: e.target.value})}
                placeholder="e.g. £60,000 – £80,000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Application Deadline</label>
              <input
                type="date"
                className="form-input"
                value={basicInfo.deadline}
                onChange={e => setBasicInfo({...basicInfo, deadline: e.target.value})}
              />
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Job Description</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={basicInfo.description}
                onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
                placeholder="Describe the role responsibilities, requirements, and expectations..."
              />
              <div className="form-hint">At least 20 characters recommended.</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Requirements */}
      {currentStep === 2 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Target size={18} className="text-amber-600" />
                Step 2: Requirements
              </h2>
              <p className="card-subtitle">
                Define the skills and capabilities required for this role. At least one requirement is needed.
              </p>
            </div>
            <span className="badge badge-gold">Step 2 of 5</span>
          </div>

          {stepErrors.requirements && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={13} /> {stepErrors.requirements}
            </div>
          )}

          {/* Add New Requirement Form */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus size={14} className="text-amber-600" />
              Add Requirement
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="form-label">Requirement Name <span className="required">*</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. Java Spring Boot"
                  value={newReq.name}
                  onChange={e => setNewReq({...newReq, name: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="form-select" value={newReq.category} onChange={e => setNewReq({...newReq, category: e.target.value as any})}>
                  <option>Technical</option>
                  <option>Problem Solving</option>
                  <option>Communication</option>
                  <option>Domain</option>
                  <option>Infrastructure</option>
                </select>
              </div>
              <div>
                <label className="form-label">Importance</label>
                <select className="form-select" value={newReq.type} onChange={e => setNewReq({...newReq, type: e.target.value as any})}>
                  <option value="Required">Required (Mandatory)</option>
                  <option value="Preferred">Preferred (Optional)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="form-select" value={newReq.priority} onChange={e => setNewReq({...newReq, priority: e.target.value as any})}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="form-label">Proficiency</label>
                <select className="form-select" value={newReq.proficiency} onChange={e => setNewReq({...newReq, proficiency: e.target.value as any})}>
                  <option>Basic</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>
              <div>
                <label className="form-label">Evaluation Method</label>
                <select className="form-select" value={newReq.method} onChange={e => setNewReq({...newReq, method: e.target.value as any})}>
                  <option>Official Technical Assessment</option>
                  <option>Structured Interview</option>
                  <option>Project Evaluation</option>
                  <option>Credential</option>
                  <option>Candidate Submission</option>
                </select>
              </div>
            </div>
            <button className="btn btn-gold btn-sm" onClick={addRequirement}>
              <Plus size={14} /> Add Requirement
            </button>
          </div>

          {/* Requirements Table */}
          {requirements.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Requirement</th>
                    <th>Category</th>
                    <th>Importance</th>
                    <th>Priority</th>
                    <th>Proficiency</th>
                    <th>Method</th>
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
                          title="Remove requirement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {requirements.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No requirements added yet. Add at least one requirement to proceed.
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Assessment Configuration */}
      {currentStep === 3 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <ClipboardList size={18} className="text-amber-600" />
                Step 3: Assessment Configuration
              </h2>
              <p className="card-subtitle">Configure how candidates will be assessed for this vacancy.</p>
            </div>
            <span className="badge badge-gold">Step 3 of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Assessment Required?</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="assessReq"
                    checked={assessmentConfig.required}
                    onChange={() => setAssessmentConfig({...assessmentConfig, required: true})}
                    className="w-4 h-4"
                  />
                  Yes — Candidates must complete an assessment
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="assessReq"
                    checked={!assessmentConfig.required}
                    onChange={() => setAssessmentConfig({...assessmentConfig, required: false})}
                    className="w-4 h-4"
                  />
                  No — Assessment is optional or not needed
                </label>
              </div>
            </div>

            {assessmentConfig.required && (
              <>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={assessmentConfig.duration}
                    onChange={e => setAssessmentConfig({...assessmentConfig, duration: parseInt(e.target.value) || 60})}
                    min={10}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    value={assessmentConfig.totalMarks}
                    onChange={e => setAssessmentConfig({...assessmentConfig, totalMarks: parseInt(e.target.value) || 100})}
                    min={1}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Schedule Mode</label>
                  <select
                    className="form-select"
                    value={assessmentConfig.scheduleMode}
                    onChange={e => setAssessmentConfig({...assessmentConfig, scheduleMode: e.target.value})}
                  >
                    <option value="on_demand">On-Demand (candidate chooses time)</option>
                    <option value="scheduled">Scheduled (company sets time)</option>
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500 leading-relaxed">
                <strong>Note:</strong> Detailed assessment questions and evaluation groups can be configured after vacancy approval from the vacancy details page. This step captures the high-level assessment configuration.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Candidate Settings */}
      {currentStep === 4 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <UsersIcon size={18} className="text-amber-600" />
                Step 4: Candidate Settings
              </h2>
              <p className="card-subtitle">Configure who can apply and what is required from candidates.</p>
            </div>
            <span className="badge badge-gold">Step 4 of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Resume Required?</label>
              <select
                className="form-select"
                value={candidateSettings.resumeRequired ? 'yes' : 'no'}
                onChange={e => setCandidateSettings({...candidateSettings, resumeRequired: e.target.value === 'yes'})}
              >
                <option value="no">No — Resume is optional</option>
                <option value="yes">Yes — Resume is required</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Candidate Approval Required?</label>
              <select
                className="form-select"
                value={candidateSettings.approvalRequired ? 'yes' : 'no'}
                onChange={e => setCandidateSettings({...candidateSettings, approvalRequired: e.target.value === 'yes'})}
              >
                <option value="no">No — Auto-approve candidates</option>
                <option value="yes">Yes — Manual approval needed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Targets per Candidate</label>
              <input
                type="number"
                className="form-input"
                value={candidateSettings.maxTargetsPerCandidate}
                onChange={e => setCandidateSettings({...candidateSettings, maxTargetsPerCandidate: parseInt(e.target.value) || 1})}
                min={1}
              />
              <div className="form-hint">How many times a candidate can target this vacancy.</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <Shield size={18} className="text-amber-600" />
                Step 5: Review &amp; Submit for Admin Verification
              </h2>
              <p className="card-subtitle">Review the complete vacancy configuration before submitting for platform admin review.</p>
            </div>
            <span className="badge badge-gold">Final Step</span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mb-6 space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Vacancy Title:</span>
              <span className="font-bold text-slate-900">{basicInfo.title || '—'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-slate-900">
                {basicInfo.departmentId
                  ? departments.find(d => d.id === basicInfo.departmentId)?.name || 'Selected'
                  : basicInfo.departmentName || 'Auto-created'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Location:</span>
              <span className="font-bold text-slate-900">{basicInfo.location || 'Remote'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Work Mode:</span>
              <span className="font-bold text-slate-900">{basicInfo.workMode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Employment Type:</span>
              <span className="font-bold text-slate-900">
                {EMP_OPTIONS.find(o => o.value === basicInfo.employmentType)?.label || basicInfo.employmentType}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Experience Level:</span>
              <span className="font-bold text-slate-900">
                {EXP_OPTIONS.find(o => o.value === basicInfo.experienceLevel)?.label || basicInfo.experienceLevel}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Number of Openings:</span>
              <span className="font-bold text-slate-900">{basicInfo.openings}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Requirements:</span>
              <span className="font-bold text-amber-700">{requirements.length} requirement{requirements.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Assessment:</span>
              <span className="font-bold text-slate-900">{assessmentConfig.required ? `Yes — ${assessmentConfig.duration} mins, ${assessmentConfig.totalMarks} marks` : 'Not required'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resume Required:</span>
              <span className="font-bold text-slate-900">{candidateSettings.resumeRequired ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Validation warnings */}
          {!basicInfo.title.trim() && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3 text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={13} /> Job title is missing. Go back to Step 1.
            </div>
          )}
          {requirements.length === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3 text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={13} /> No requirements added. Go back to Step 2.
            </div>
          )}

          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl mb-6 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Vacancy submitted for admin verification! Redirecting to vacancy details...
            </div>
          )}

          <div className="flex justify-end gap-3 flex-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              disabled={!basicInfo.title.trim() || savedSuccess || isSubmitting}
              onClick={handleSaveDraft}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="btn btn-gold btn-lg"
              disabled={!basicInfo.title.trim() || requirements.length === 0 || savedSuccess || isSubmitting}
              onClick={handleSubmitVerification}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Shield size={16} /> Submit Vacancy for Admin Verification
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft size={16} /> Previous Step
        </button>

        {currentStep < 5 && (
          <button
            className="btn btn-gold"
            onClick={handleNext}
          >
            Next Step <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
