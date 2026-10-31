'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Shield, AlertCircle,
  FileText, Target, ClipboardList, Users as UsersIcon, CheckCircle2, Loader2, Sparkles,
  Layers, BookOpen, Award, FileCheck, ArrowUp, ArrowDown, RefreshCw, Info, Edit3, X
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

interface RoleMasterItem {
  id: string;
  title: string;
  job_description?: string;
  department_id?: string;
  department_name?: string;
  approved_role_blueprint_id?: string;
}

interface SkillItem {
  name: string;
  category: 'Technical' | 'Problem Solving' | 'Communication' | 'Domain' | 'Infrastructure';
  importance: 'Must-have' | 'Good-to-have';
  description: string;
}

interface LearningItem {
  skill: string;
  title: string;
  url: string;
  duration: string;
  type: string;
}

interface FlashcardItem {
  front: string;
  back: string;
}

interface PracticeTaskItem {
  title: string;
  prompt: string;
  difficulty: string;
  expectedDeliverable: string;
}

interface AssessmentIdeaItem {
  question: string;
  type: string;
}

interface EvidenceTypeItem {
  name: string;
  description: string;
}

const STEPS = [
  { id: 1, title: 'Role & Vacancy Info', icon: FileText },
  { id: 2, title: 'Requirements Matrix & AI Blueprint', icon: Target },
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
  // Role Masters loaded from API
  const [roleMasters, setRoleMasters] = useState<RoleMasterItem[]>([]);
  const [selectedRoleMasterId, setSelectedRoleMasterId] = useState<string>('');
  const [existingApprovedBlueprint, setExistingApprovedBlueprint] = useState<any | null>(null);

  // Approved blueprints loaded from API (for legacy or direct import)
  const [approvedBlueprints, setApprovedBlueprints] = useState<any[]>([]);

  // AI Role Blueprint Studio state
  const [blueprintSuggestionId, setBlueprintSuggestionId] = useState<string | null>(null);
  const [blueprintStatus, setBlueprintStatus] = useState<'NONE' | 'DRAFT' | 'APPROVED'>('NONE');
  const [approvedBlueprintId, setApprovedBlueprintId] = useState<string | null>(null);
  const [includeCommonSkills, setIncludeCommonSkills] = useState<boolean>(true);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiSavingDraft, setAiSavingDraft] = useState<boolean>(false);
  const [aiApproving, setAiApproving] = useState<boolean>(false);
  const [activeBlueprintTab, setActiveBlueprintTab] = useState<'skills' | 'learning' | 'flashcards' | 'practice' | 'assessment' | 'evidence'>('skills');

  // Blueprint draft content
  const [draftSkills, setDraftSkills] = useState<SkillItem[]>([]);
  const [draftLearningPaths, setDraftLearningPaths] = useState<LearningItem[]>([]);
  const [draftFlashcards, setDraftFlashcards] = useState<FlashcardItem[]>([]);
  const [draftPracticeTasks, setDraftPracticeTasks] = useState<PracticeTaskItem[]>([]);
  const [draftAssessmentIdeas, setDraftAssessmentIdeas] = useState<AssessmentIdeaItem[]>([]);
  const [draftEvidenceTypes, setDraftEvidenceTypes] = useState<EvidenceTypeItem[]>([]);

  // New item inputs in Blueprint Studio
  const [newSkill, setNewSkill] = useState<SkillItem>({
    name: '',
    category: 'Technical',
    importance: 'Must-have',
    description: '',
  });
  const [newLearning, setNewLearning] = useState<LearningItem>({
    skill: '',
    title: '',
    url: '',
    duration: '45 mins',
    type: 'GUIDE',
  });
  const [newFlashcard, setNewFlashcard] = useState<FlashcardItem>({ front: '', back: '' });
  const [newPractice, setNewPractice] = useState<PracticeTaskItem>({
    title: '',
    prompt: '',
    difficulty: 'Intermediate',
    expectedDeliverable: '',
  });
  const [newAssessment, setNewAssessment] = useState<AssessmentIdeaItem>({ question: '', type: 'Multiple Choice' });
  const [newEvidence, setNewEvidence] = useState<EvidenceTypeItem>({ name: '', description: '' });

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

  useEffect(() => {
    api.get('/departments').then(res => {
      setDepartments((res.data?.departments || []).filter((d: Department) => d.is_active));
    }).catch(() => {});

    api.get('/roles').then(res => {
      setRoleMasters(res.data?.roles || []);
    }).catch(() => {});

    api.get('/company/role-blueprints/approved').then(res => {
      setApprovedBlueprints(res.data?.blueprints || []);
    }).catch(() => {});
  }, []);

  // When a Role Master is selected in Step 1
  const handleSelectRoleMaster = async (rmId: string) => {
    setSelectedRoleMasterId(rmId);
    setExistingApprovedBlueprint(null);

    if (!rmId) return;

    const rm = roleMasters.find(r => r.id === rmId);
    if (rm) {
      setBasicInfo(prev => ({
        ...prev,
        title: prev.title.trim() ? prev.title : rm.title,
        description: prev.description.trim() ? prev.description : (rm.job_description || ''),
        departmentId: rm.department_id || prev.departmentId,
        departmentName: rm.department_name || prev.departmentName,
      }));

      // Check if an approved blueprint already exists for this Role Master
      try {
        const res = await api.get(`/company/role-masters/${rmId}/blueprint`);
        if (res.data?.blueprint) {
          setExistingApprovedBlueprint(res.data.blueprint);
          toast.success(`Found approved blueprint for "${rm.title}"! Options loaded in Step 2.`);
        }
      } catch (_) {}
    }
  };

  // Generate AI suggestions inline in Step 2
  const handleGenerateAiBlueprint = async () => {
    if (!basicInfo.title.trim()) {
      toast.error('Please enter a role title in Step 1 before generating AI suggestions.');
      setCurrentStep(1);
      return;
    }

    setAiGenerating(true);
    try {
      const res = await api.post('/company/vacancies/ai-suggest-blueprint', {
        roleMasterId: selectedRoleMasterId || undefined,
        roleTitle: basicInfo.title.trim(),
        roleDescription: basicInfo.description.trim() || undefined,
        departmentId: basicInfo.departmentId || undefined,
        includeCommon: includeCommonSkills,
      });

      const suggestion = res.data?.suggestion;
      if (suggestion) {
        setBlueprintSuggestionId(suggestion.id);
        setBlueprintStatus('DRAFT');

        const skills = Array.isArray(suggestion.suggested_skills) ? suggestion.suggested_skills : [];
        setDraftSkills(skills);
        setDraftLearningPaths(Array.isArray(suggestion.suggested_learning_paths) ? suggestion.suggested_learning_paths : []);
        setDraftFlashcards(Array.isArray(suggestion.suggested_flashcards) ? suggestion.suggested_flashcards : []);
        setDraftPracticeTasks(Array.isArray(suggestion.suggested_practice_tasks) ? suggestion.suggested_practice_tasks : []);
        setDraftAssessmentIdeas(Array.isArray(suggestion.suggested_assessment_ideas) ? suggestion.suggested_assessment_ideas : []);
        setDraftEvidenceTypes(Array.isArray(suggestion.suggested_evidence_types) ? suggestion.suggested_evidence_types : []);

        toast.success(`Generated ${skills.length} draft competencies! Review, edit, and approve them.`);
      }
    } catch (err: any) {
      console.error('AI suggest blueprint error:', err);
      const msg = err.response?.data?.error || 'Failed to generate AI blueprint suggestions.';
      toast.error(msg);
    } finally {
      setAiGenerating(false);
    }
  };

  // Use an existing approved blueprint
  const handleUseApprovedBlueprint = (bp: any) => {
    if (!bp) return;
    setBlueprintSuggestionId(bp.id);
    setApprovedBlueprintId(bp.id);
    setBlueprintStatus('APPROVED');

    const skills = Array.isArray(bp.suggested_skills) ? bp.suggested_skills : [];
    setDraftSkills(skills);
    setDraftLearningPaths(Array.isArray(bp.suggested_learning_paths) ? bp.suggested_learning_paths : []);
    setDraftFlashcards(Array.isArray(bp.suggested_flashcards) ? bp.suggested_flashcards : []);
    setDraftPracticeTasks(Array.isArray(bp.suggested_practice_tasks) ? bp.suggested_practice_tasks : []);
    setDraftAssessmentIdeas(Array.isArray(bp.suggested_assessment_ideas) ? bp.suggested_assessment_ideas : []);
    setDraftEvidenceTypes(Array.isArray(bp.suggested_evidence_types) ? bp.suggested_evidence_types : []);

    // Sync to vacancy requirements
    const newReqs: Requirement[] = skills.map((s: any, idx: number) => ({
      id: `req-bp-${Date.now()}-${idx}`,
      name: s.name || s.title || 'Required Skill',
      category: (s.category || 'Technical') as any,
      type: (s.importance === 'Must-have' ? 'Required' : 'Preferred') as any,
      priority: (s.importance === 'Must-have' ? 'High' : 'Medium') as any,
      proficiency: 'Advanced' as any,
      method: 'Official Technical Assessment' as any,
    }));
    setRequirements(newReqs);

    toast.success(`Loaded approved blueprint "${bp.role_title}" with ${skills.length} verified competencies!`);
  };

  // Edit an existing approved blueprint (load into draft editor)
  const handleEditApprovedBlueprint = (bp: any) => {
    if (!bp) return;
    setBlueprintSuggestionId(bp.id);
    setBlueprintStatus('DRAFT');

    const skills = Array.isArray(bp.suggested_skills) ? bp.suggested_skills : [];
    setDraftSkills(skills);
    setDraftLearningPaths(Array.isArray(bp.suggested_learning_paths) ? bp.suggested_learning_paths : []);
    setDraftFlashcards(Array.isArray(bp.suggested_flashcards) ? bp.suggested_flashcards : []);
    setDraftPracticeTasks(Array.isArray(bp.suggested_practice_tasks) ? bp.suggested_practice_tasks : []);
    setDraftAssessmentIdeas(Array.isArray(bp.suggested_assessment_ideas) ? bp.suggested_assessment_ideas : []);
    setDraftEvidenceTypes(Array.isArray(bp.suggested_evidence_types) ? bp.suggested_evidence_types : []);

    toast.success(`Blueprint loaded into editor. You can now modify skills and learning modules.`);
  };

  // Save Blueprint Draft
  const handleSaveBlueprintDraft = async () => {
    if (!blueprintSuggestionId) {
      toast.error('No blueprint draft active to save.');
      return;
    }

    setAiSavingDraft(true);
    try {
      await api.put(`/company/ai-suggestions/${blueprintSuggestionId}`, {
        suggestedSkills: draftSkills,
        suggestedLearningPaths: draftLearningPaths,
        suggestedFlashcards: draftFlashcards,
        suggestedPracticeTasks: draftPracticeTasks,
        suggestedAssessmentIdeas: draftAssessmentIdeas,
        suggestedEvidenceTypes: draftEvidenceTypes,
        roleTitle: basicInfo.title,
        roleDescription: basicInfo.description,
        roleMasterId: selectedRoleMasterId || undefined,
      });

      toast.success('Draft blueprint saved successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to save blueprint draft.';
      toast.error(msg);
    } finally {
      setAiSavingDraft(false);
    }
  };

  // Approve Blueprint
  const handleApproveBlueprint = async () => {
    if (!blueprintSuggestionId) {
      toast.error('No blueprint draft to approve.');
      return;
    }

    if (draftSkills.length === 0) {
      toast.error('At least one skill is required in the blueprint before approving.');
      return;
    }

    setAiApproving(true);
    try {
      // 1. First save any current changes to draft
      await api.put(`/company/ai-suggestions/${blueprintSuggestionId}`, {
        suggestedSkills: draftSkills,
        suggestedLearningPaths: draftLearningPaths,
        suggestedFlashcards: draftFlashcards,
        suggestedPracticeTasks: draftPracticeTasks,
        suggestedAssessmentIdeas: draftAssessmentIdeas,
        suggestedEvidenceTypes: draftEvidenceTypes,
        roleTitle: basicInfo.title,
        roleDescription: basicInfo.description,
        roleMasterId: selectedRoleMasterId || undefined,
      });

      // 2. Call approval endpoint
      const res = await api.post(`/company/ai-suggestions/${blueprintSuggestionId}/approve`, {
        roleMasterId: selectedRoleMasterId || undefined,
        departmentId: basicInfo.departmentId || undefined,
        createRoleMaster: !selectedRoleMasterId,
        approvalNotes: 'Approved directly inside Vacancy Builder',
      });

      setBlueprintStatus('APPROVED');
      const finalBpId = res.data?.suggestion?.id || blueprintSuggestionId;
      setApprovedBlueprintId(finalBpId);
      if (res.data?.roleMasterId && !selectedRoleMasterId) {
        setSelectedRoleMasterId(res.data.roleMasterId);
      }

      // 3. Automatically synchronize approved skills to requirements array
      const syncedReqs: Requirement[] = draftSkills.map((s, idx) => ({
        id: `req-appr-${Date.now()}-${idx}`,
        name: s.name,
        category: s.category,
        type: s.importance === 'Must-have' ? 'Required' : 'Preferred',
        priority: s.importance === 'Must-have' ? 'High' : 'Medium',
        proficiency: 'Advanced',
        method: 'Official Technical Assessment',
      }));
      setRequirements(syncedReqs);

      toast.success(`Role Blueprint approved! ${syncedReqs.length} verified competencies linked to Vacancy.`);
    } catch (err: any) {
      console.error('Approve blueprint error:', err);
      const msg = err.response?.data?.error || 'Failed to approve blueprint.';
      toast.error(msg);
    } finally {
      setAiApproving(false);
    }
  };

  // Skill editing handlers
  const handleToggleSkillImportance = (index: number) => {
    setDraftSkills(prev => prev.map((s, idx) => {
      if (idx !== index) return s;
      return {
        ...s,
        importance: s.importance === 'Must-have' ? 'Good-to-have' : 'Must-have',
      };
    }));
  };

  const handleUpdateSkillName = (index: number, newName: string) => {
    setDraftSkills(prev => prev.map((s, idx) => idx === index ? { ...s, name: newName } : s));
  };

  const handleUpdateSkillCategory = (index: number, category: any) => {
    setDraftSkills(prev => prev.map((s, idx) => idx === index ? { ...s, category } : s));
  };

  const handleUpdateSkillDescription = (index: number, description: string) => {
    setDraftSkills(prev => prev.map((s, idx) => idx === index ? { ...s, description } : s));
  };

  const handleMoveSkill = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftSkills.length) return;
    const copy = [...draftSkills];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setDraftSkills(copy);
  };

  const handleRemoveSkill = (index: number) => {
    setDraftSkills(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddCustomSkill = () => {
    if (!newSkill.name.trim()) {
      toast.error('Skill name is required.');
      return;
    }
    setDraftSkills(prev => [...prev, { ...newSkill, name: newSkill.name.trim() }]);
    setNewSkill({ name: '', category: 'Technical', importance: 'Must-have', description: '' });
    toast.success('Custom skill added to draft blueprint.');
  };

  const importBlueprintSkills = (bpId: string) => {
    const bp = approvedBlueprints.find(b => b.id === bpId);
    if (!bp) return;
    handleUseApprovedBlueprint(bp);
  };

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
      if (requirements.length === 0 && draftSkills.length === 0) {
        errors.requirements = 'Please generate an AI Blueprint or add at least one requirement.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    // If user has draftSkills but hasn't synced requirements, auto sync
    if (currentStep === 2 && requirements.length === 0 && draftSkills.length > 0) {
      const autoSync: Requirement[] = draftSkills.map((s, idx) => ({
        id: `req-draft-${Date.now()}-${idx}`,
        name: s.name,
        category: s.category,
        type: s.importance === 'Must-have' ? 'Required' : 'Preferred',
        priority: s.importance === 'Must-have' ? 'High' : 'Medium',
        proficiency: 'Advanced',
        method: 'Official Technical Assessment',
      }));
      setRequirements(autoSync);
    }
    setCurrentStep(Math.min(5, currentStep + 1));
  };

  const handleSubmitVerification = async () => {
    if (isSubmitting || savedSuccess) return;
    setStepErrors({});

    // Step 1 Validation
    if (!basicInfo.title.trim()) {
      toast.error('Position title is required (Step 1).');
      setStepErrors({ title: 'Position title is required' });
      setCurrentStep(1);
      return;
    }
    if (!basicInfo.location.trim()) {
      toast.error('Location is required (Step 1).');
      setStepErrors({ location: 'Location is required' });
      setCurrentStep(1);
      return;
    }

    // Step 2 Validation: Requirements count >= 1
    if (requirements.length === 0) {
      toast.error('Please add at least one requirement before submitting (Step 2).');
      setStepErrors({ requirements: 'At least one requirement is required' });
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create vacancy as DRAFT only
      const createRes = await api.post('/vacancies', {
        title: basicInfo.title.trim(),
        departmentId: basicInfo.departmentId || undefined,
        departmentName: basicInfo.departmentName || basicInfo.title.split(' ')[0] || 'Engineering',
        location: basicInfo.location.trim() || 'Remote',
        workMode: basicInfo.workMode || 'Hybrid',
        employmentType: basicInfo.employmentType || 'full_time',
        experienceLevel: basicInfo.experienceLevel || 'senior',
        vacancyCount: Number(basicInfo.openings) || 1,
        salaryRange: basicInfo.salaryRange || null,
        closingDate: basicInfo.deadline || null,
        jobDescription: basicInfo.description || '',
        roleMasterId: selectedRoleMasterId || undefined,
        approvedRoleBlueprintId: approvedBlueprintId || undefined,
        assessmentConfig: assessmentConfig.required ? assessmentConfig : undefined,
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
        toast.error('Failed to create vacancy draft. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 2. Submit for admin verification using proper POST /api/vacancies/:id/submit
      try {
        await api.post(`/vacancies/${vacancy.id}/submit`);
      } catch (submitErr: any) {
        const errMsg = submitErr.response?.data?.error ||
          (Array.isArray(submitErr.response?.data?.errors) ? submitErr.response.data.errors.map((e: any) => e.msg).join('; ') : '') ||
          'Submission to platform verification queue failed.';
        toast.error(errMsg);
        setStepErrors({ submission: errMsg });
        router.push(`/dashboard/vacancies/${vacancy.id}`);
        return;
      }

      // 3. Broadcast real-time status sync to admin verification queue
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('genuai_status_sync');
          bc.postMessage({ type: 'VACANCY_SUBMITTED', vacancyId: vacancy.id });
          bc.close();
        }
      } catch (_) {}

      setSavedSuccess(true);
      toast.success('Vacancy successfully submitted for platform admin review!');
      setTimeout(() => {
        router.push(`/dashboard/vacancies/${vacancy.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create/submit vacancy', err);
      const errMsg = err.response?.data?.error ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors.map((e: any) => e.msg).join('; ') : '') ||
        'Failed to initialize vacancy requisition.';
      toast.error(errMsg);
      setStepErrors({ submission: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isSubmitting || savedSuccess) return;
    setStepErrors({});

    if (!basicInfo.title.trim()) {
      toast.error('Job title is required to save a draft.');
      setStepErrors({ title: 'Job title is required' });
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const createRes = await api.post('/vacancies', {
        title: basicInfo.title.trim(),
        departmentId: basicInfo.departmentId || undefined,
        departmentName: basicInfo.departmentName || basicInfo.title.split(' ')[0] || 'Engineering',
        location: basicInfo.location.trim() || 'Remote',
        workMode: basicInfo.workMode || 'Hybrid',
        employmentType: basicInfo.employmentType || 'full_time',
        experienceLevel: basicInfo.experienceLevel || 'senior',
        vacancyCount: Number(basicInfo.openings) || 1,
        salaryRange: basicInfo.salaryRange || null,
        closingDate: basicInfo.deadline || null,
        jobDescription: basicInfo.description || '',
        roleMasterId: selectedRoleMasterId || undefined,
        approvedRoleBlueprintId: approvedBlueprintId || undefined,
        assessmentConfig: assessmentConfig.required ? assessmentConfig : undefined,
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
      const errMsg = err.response?.data?.error ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors.map((e: any) => e.msg).join('; ') : '') ||
        'Failed to save draft.';
      toast.error(errMsg);
      setStepErrors({ submission: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 1150 }}>
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
              Create Vacancy &amp; Role Blueprint
            </h1>
            <p className="page-subtitle">
              Define role parameters, generate or link AI Role Skill Blueprints, and submit for admin verification.
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
              <p className="card-subtitle">
                Select your Department and Role Master, or enter custom vacancy information.
              </p>
            </div>
            <span className="badge badge-gold">Step 1 of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Master Selection — clean inline row */}
            <div className="form-group md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0 text-slate-800 font-bold">
                  Select Role Master <span className="text-xs font-normal text-slate-500">(optional — links verified blueprints across vacancies)</span>
                </label>
              </div>
              <select
                className="form-select"
                value={selectedRoleMasterId}
                onChange={e => handleSelectRoleMaster(e.target.value)}
              >
                <option value="">— None (create custom vacancy) —</option>
                {roleMasters.map(rm => (
                  <option key={rm.id} value={rm.id}>
                    {rm.title} {rm.department_name ? `(${rm.department_name})` : ''} {rm.approved_role_blueprint_id ? '★' : ''}
                  </option>
                ))}
              </select>
              {selectedRoleMasterId && (
                <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                  <Info size={11} className="flex-shrink-0" />
                  Auto-filled role details. Any approved blueprint for this Role Master has been loaded in Step 2.
                </div>
              )}
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Job / Role Title <span className="required">*</span></label>
              <input
                className={`form-input${stepErrors.title ? ' error' : ''}`}
                value={basicInfo.title}
                onChange={e => { setBasicInfo({...basicInfo, title: e.target.value}); setStepErrors(p => ({...p, title: ''})); }}
                placeholder="e.g. Senior Backend Engineer"
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
                placeholder="Describe role responsibilities, team context, and expectations..."
              />
              <div className="form-hint">At least 20 characters recommended to help the AI generator tailor competencies.</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Requirements Matrix & AI Blueprint Studio */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Card: AI-Assisted Blueprint Studio */}
          <div className="card border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/40 via-white to-white">
            <div className="card-header pb-3 border-b border-amber-200/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-sm">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="card-title text-base text-slate-900 flex items-center gap-2">
                    AI-Assisted Role Skill Blueprint Generator
                    {blueprintStatus === 'APPROVED' && (
                      <span className="badge badge-emerald flex items-center gap-1 text-[11px]">
                        <CheckCircle2 size={12} /> Approved &amp; Linked
                      </span>
                    )}
                    {blueprintStatus === 'DRAFT' && (
                      <span className="badge badge-amber text-[11px]">
                        Draft — Review &amp; Approve Below
                      </span>
                    )}
                  </h2>
                  <p className="card-subtitle text-xs text-slate-600">
                    Generate, customize, and approve verified skill matrices, learning paths, flashcards, and assessments directly inside this vacancy.
                  </p>
                </div>
              </div>

              {/* Action buttons on header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  onClick={handleGenerateAiBlueprint}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate AI Suggestions
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* If an approved blueprint exists for the selected Role Master */}
            {existingApprovedBlueprint && blueprintStatus !== 'APPROVED' && (
              <div className="p-4 m-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-700 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Approved Blueprint Found for this Role Master: &ldquo;{existingApprovedBlueprint.role_title}&rdquo;
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Contains {Array.isArray(existingApprovedBlueprint.suggested_skills) ? existingApprovedBlueprint.suggested_skills.length : 0} verified competencies approved on {new Date(existingApprovedBlueprint.approved_at || existingApprovedBlueprint.updated_at).toLocaleDateString()}.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                    onClick={() => handleUseApprovedBlueprint(existingApprovedBlueprint)}
                  >
                    <Check size={13} className="mr-1" /> Use Approved Blueprint
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEditApprovedBlueprint(existingApprovedBlueprint)}
                  >
                    <Edit3 size={13} className="mr-1" /> Edit Blueprint
                  </button>
                </div>
              </div>
            )}

            {/* Quick import from other approved blueprints */}
            {approvedBlueprints.length > 0 && !existingApprovedBlueprint && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Import approved blueprint:</span>
                <select
                  className="form-select text-xs h-8 bg-white border-slate-300 flex-1 min-w-[200px] max-w-xs"
                  onChange={e => {
                    if (e.target.value) {
                      importBlueprintSkills(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select approved blueprint...</option>
                  {approvedBlueprints.map(bp => (
                    <option key={bp.id} value={bp.id}>
                      {bp.role_title} ({new Date(bp.approved_at || bp.updated_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 whitespace-nowrap ml-auto">
                  <input
                    type="checkbox"
                    checked={includeCommonSkills}
                    onChange={e => setIncludeCommonSkills(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Include foundational competencies</span>
                </label>
              </div>
            )}

            {/* STUDIO TABS: When draft skills exist */}
            {draftSkills.length > 0 && (
              <div className="p-5 border-t border-slate-200 mt-2">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBlueprintTab === 'skills' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setActiveBlueprintTab('skills')}
                  >
                    <Layers size={13} className="mr-1" /> Skills Matrix ({draftSkills.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBlueprintTab === 'learning' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setActiveBlueprintTab('learning')}
                  >
                    <BookOpen size={13} className="mr-1" /> Learning Path ({draftLearningPaths.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBlueprintTab === 'flashcards' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setActiveBlueprintTab('flashcards')}
                  >
                    <Award size={13} className="mr-1" /> Flashcards ({draftFlashcards.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBlueprintTab === 'practice' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setActiveBlueprintTab('practice')}
                  >
                    <ClipboardList size={13} className="mr-1" /> Practice Tasks ({draftPracticeTasks.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBlueprintTab === 'assessment' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setActiveBlueprintTab('assessment')}
                  >
                    <Target size={13} className="mr-1" /> Assessment Ideas ({draftAssessmentIdeas.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBlueprintTab === 'evidence' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setActiveBlueprintTab('evidence')}
                  >
                    <FileCheck size={13} className="mr-1" /> Evidence Types ({draftEvidenceTypes.length})
                  </button>
                </div>

                {/* TAB 1: Skills Matrix */}
                {activeBlueprintTab === 'skills' && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>
                        Customize skill names, categories, importance (Must-have vs Good-to-have), and descriptions.
                      </span>
                      <span className="font-semibold text-slate-800">
                        {draftSkills.filter(s => s.importance === 'Must-have').length} Must-have &bull; {draftSkills.filter(s => s.importance === 'Good-to-have').length} Good-to-have
                      </span>
                    </div>

                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th style={{ width: '25%' }}>Skill Name</th>
                            <th style={{ width: '15%' }}>Category</th>
                            <th style={{ width: '15%' }}>Importance</th>
                            <th>Description</th>
                            <th style={{ textAlign: 'right', width: 110 }}>Reorder / Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draftSkills.map((skill, idx) => (
                            <tr key={idx}>
                              <td className="text-xs text-slate-400 font-mono">{idx + 1}</td>
                              <td>
                                <input
                                  className="form-input text-xs py-1 h-8 font-semibold text-slate-900"
                                  value={skill.name}
                                  onChange={e => handleUpdateSkillName(idx, e.target.value)}
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select text-xs py-1 h-8"
                                  value={skill.category}
                                  onChange={e => handleUpdateSkillCategory(idx, e.target.value)}
                                >
                                  <option>Technical</option>
                                  <option>Problem Solving</option>
                                  <option>Communication</option>
                                  <option>Domain</option>
                                  <option>Infrastructure</option>
                                </select>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSkillImportance(idx)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                                    skill.importance === 'Must-have'
                                      ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                                      : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                  }`}
                                  title="Click to toggle between Must-have and Good-to-have"
                                >
                                  {skill.importance === 'Must-have' ? '★ Must-have' : 'Good-to-have'}
                                </button>
                              </td>
                              <td>
                                <input
                                  className="form-input text-xs py-1 h-8 text-slate-600"
                                  value={skill.description}
                                  onChange={e => handleUpdateSkillDescription(idx, e.target.value)}
                                  placeholder="Skill competency description"
                                />
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                    onClick={() => handleMoveSkill(idx, 'up')}
                                    disabled={idx === 0}
                                    title="Move up"
                                  >
                                    <ArrowUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                    onClick={() => handleMoveSkill(idx, 'down')}
                                    disabled={idx === draftSkills.length - 1}
                                    title="Move down"
                                  >
                                    <ArrowDown size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1 text-red-600 hover:bg-red-50 rounded ml-1"
                                    onClick={() => handleRemoveSkill(idx)}
                                    title="Remove skill"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Custom Skill Row */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700">Add Skill:</span>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Skill title (e.g. PostgreSQL Optimization)"
                        value={newSkill.name}
                        onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                      />
                      <select
                        className="form-select text-xs py-1 h-8 w-32"
                        value={newSkill.category}
                        onChange={e => setNewSkill({ ...newSkill, category: e.target.value as any })}
                      >
                        <option>Technical</option>
                        <option>Problem Solving</option>
                        <option>Communication</option>
                        <option>Domain</option>
                        <option>Infrastructure</option>
                      </select>
                      <select
                        className="form-select text-xs py-1 h-8 w-32"
                        value={newSkill.importance}
                        onChange={e => setNewSkill({ ...newSkill, importance: e.target.value as any })}
                      >
                        <option value="Must-have">Must-have</option>
                        <option value="Good-to-have">Good-to-have</option>
                      </select>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Optional description"
                        value={newSkill.description}
                        onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddCustomSkill}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: Learning Path */}
                {activeBlueprintTab === 'learning' && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      Curated study materials, official documentation, and interactive guides candidates use to build readiness.
                    </div>
                    <div className="space-y-2">
                      {draftLearningPaths.map((lp, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                          <div className="flex-1">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{lp.title}</span>
                              <span className="badge badge-gray text-[10px]">{lp.skill}</span>
                              <span className="text-[10px] text-slate-500">{lp.duration}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] truncate mt-0.5">{lp.url}</div>
                          </div>
                          <button
                            type="button"
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                            onClick={() => setDraftLearningPaths(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700">Add Guide:</span>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Module title (e.g. Official Docker Tutorial)"
                        value={newLearning.title}
                        onChange={e => setNewLearning({ ...newLearning, title: e.target.value })}
                      />
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Resource URL (https://...)"
                        value={newLearning.url}
                        onChange={e => setNewLearning({ ...newLearning, url: e.target.value })}
                      />
                      <input
                        className="form-input text-xs py-1 h-8 w-24"
                        placeholder="45 mins"
                        value={newLearning.duration}
                        onChange={e => setNewLearning({ ...newLearning, duration: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (!newLearning.title.trim()) return toast.error('Title required');
                          setDraftLearningPaths(prev => [...prev, { ...newLearning, skill: draftSkills[0]?.name || 'General' }]);
                          setNewLearning({ skill: '', title: '', url: '', duration: '45 mins', type: 'GUIDE' });
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: Flashcards */}
                {activeBlueprintTab === 'flashcards' && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      Quick recall flashcards used in the candidate portal to verify technical concepts.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {draftFlashcards.map((fc, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 relative">
                          <div className="font-bold text-slate-800 pr-6">Q: {fc.front}</div>
                          <div className="text-slate-600 text-[11px] pr-6">A: {fc.back}</div>
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-red-600 hover:bg-red-50 p-1 rounded"
                            onClick={() => setDraftFlashcards(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700">Add Card:</span>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Front / Question"
                        value={newFlashcard.front}
                        onChange={e => setNewFlashcard({ ...newFlashcard, front: e.target.value })}
                      />
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Back / Answer"
                        value={newFlashcard.back}
                        onChange={e => setNewFlashcard({ ...newFlashcard, back: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (!newFlashcard.front.trim() || !newFlashcard.back.trim()) return toast.error('Both front and back required');
                          setDraftFlashcards(prev => [...prev, { ...newFlashcard }]);
                          setNewFlashcard({ front: '', back: '' });
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: Practice Tasks */}
                {activeBlueprintTab === 'practice' && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      Practical tasks that candidates implement and upload evidence for in their readiness funnel.
                    </div>
                    <div className="space-y-2">
                      {draftPracticeTasks.map((pt, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{pt.title}</span>
                              <span className="badge badge-gold text-[10px]">{pt.difficulty}</span>
                            </div>
                            <div className="text-slate-600 text-[11px] mt-1">{pt.prompt}</div>
                            {pt.expectedDeliverable && (
                              <div className="text-slate-500 text-[10px] mt-0.5">
                                <strong>Expected Deliverable:</strong> {pt.expectedDeliverable}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                            onClick={() => setDraftPracticeTasks(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700">Add Task:</span>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Task title"
                        value={newPractice.title}
                        onChange={e => setNewPractice({ ...newPractice, title: e.target.value })}
                      />
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[180px]"
                        placeholder="Task prompt"
                        value={newPractice.prompt}
                        onChange={e => setNewPractice({ ...newPractice, prompt: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (!newPractice.title.trim()) return toast.error('Task title required');
                          setDraftPracticeTasks(prev => [...prev, { ...newPractice }]);
                          setNewPractice({ title: '', prompt: '', difficulty: 'Intermediate', expectedDeliverable: '' });
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: Assessment Ideas */}
                {activeBlueprintTab === 'assessment' && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      Standardized questions and scenarios used during official candidate technical evaluation.
                    </div>
                    <div className="space-y-2">
                      {draftAssessmentIdeas.map((ai, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{ai.question}</div>
                            <span className="badge badge-gray text-[10px] mt-1">{ai.type}</span>
                          </div>
                          <button
                            type="button"
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                            onClick={() => setDraftAssessmentIdeas(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700">Add Question:</span>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[200px]"
                        placeholder="Evaluation question or scenario"
                        value={newAssessment.question}
                        onChange={e => setNewAssessment({ ...newAssessment, question: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (!newAssessment.question.trim()) return toast.error('Question required');
                          setDraftAssessmentIdeas(prev => [...prev, { ...newAssessment }]);
                          setNewAssessment({ question: '', type: 'Multiple Choice' });
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 6: Evidence Types */}
                {activeBlueprintTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      Accepted evidence formats (e.g. GitHub Repository, System Architecture Doc, Live URL) for human recruiter verification.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {draftEvidenceTypes.map((et, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 relative">
                          <div className="font-bold text-slate-900 pr-6">{et.name}</div>
                          <div className="text-slate-600 text-[11px] pr-6">{et.description}</div>
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-red-600 hover:bg-red-50 p-1 rounded"
                            onClick={() => setDraftEvidenceTypes(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-700">Add Type:</span>
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[140px]"
                        placeholder="Evidence name (e.g. GitHub PR Link)"
                        value={newEvidence.name}
                        onChange={e => setNewEvidence({ ...newEvidence, name: e.target.value })}
                      />
                      <input
                        className="form-input text-xs py-1 h-8 flex-1 min-w-[180px]"
                        placeholder="Description of required proof"
                        value={newEvidence.description}
                        onChange={e => setNewEvidence({ ...newEvidence, description: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (!newEvidence.name.trim()) return toast.error('Name required');
                          setDraftEvidenceTypes(prev => [...prev, { ...newEvidence }]);
                          setNewEvidence({ name: '', description: '' });
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Studio Bottom Action Bar */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-xs text-slate-500">
                    {blueprintStatus === 'APPROVED' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Blueprint is Approved and locked to this vacancy &amp; Role Master.
                      </span>
                    ) : (
                      <span>Draft suggestions must be approved before publishing this vacancy.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleSaveBlueprintDraft}
                      disabled={aiSavingDraft || aiApproving}
                    >
                      {aiSavingDraft ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                      Save Blueprint Draft
                    </button>
                    <button
                      type="button"
                      className="btn btn-gold btn-sm"
                      onClick={handleApproveBlueprint}
                      disabled={aiSavingDraft || aiApproving}
                    >
                      {aiApproving ? (
                        <>
                          <Loader2 size={13} className="animate-spin mr-1" /> Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="mr-1" /> Approve Blueprint &amp; Sync Skills
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regular Requirements List (Manual addition & viewing synced requirements) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title flex items-center gap-2 text-sm">
                  <Target size={16} className="text-amber-600" />
                  Active Vacancy Requirements ({requirements.length})
                </h3>
                <p className="card-subtitle text-xs">
                  Competencies required for this vacancy. These are evaluated in the Candidate Readiness Funnel.
                </p>
              </div>
            </div>

            {stepErrors.requirements && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={13} /> {stepErrors.requirements}
              </div>
            )}

            {/* Manual Requirement Form */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Plus size={14} className="text-amber-600" />
                Add Custom Vacancy Requirement
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
                No requirements added yet. Click &ldquo;Generate AI Suggestions&rdquo; above or add requirements manually.
              </div>
            )}
          </div>
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
              <p className="card-subtitle">Review the complete vacancy and linked blueprint configuration before submitting.</p>
            </div>
            <span className="badge badge-gold">Final Step</span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mb-6 space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Vacancy Title:</span>
              <span className="font-bold text-slate-900">{basicInfo.title || '—'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Role Master:</span>
              <span className="font-bold text-slate-900">
                {selectedRoleMasterId
                  ? roleMasters.find(r => r.id === selectedRoleMasterId)?.title || 'Selected Role Master'
                  : 'Custom Requisition (Auto-generated)'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Approved Role Blueprint:</span>
              <span className="font-bold">
                {approvedBlueprintId ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Verified &amp; Linked ({approvedBlueprintId.substring(0, 8)}...)
                  </span>
                ) : (
                  <span className="text-amber-700">None linked (Blueprint can be approved in Step 2)</span>
                )}
              </span>
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
              <span className="text-slate-500">Active Requirements:</span>
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

          {stepErrors.submission && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg mb-3 text-red-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
              <span>{stepErrors.submission}</span>
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
