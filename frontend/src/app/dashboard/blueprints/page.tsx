'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Layers,
  BookOpen,
  Award,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Briefcase,
  Copy,
  Info,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SkillItem {
  name: string;
  category: string;
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

const SUPPORTED_ROLES = [
  'Backend Developer',
  'Frontend Developer',
  'Electrical Design Engineer',
  'Mechanical Design Engineer',
  'Data Analyst',
  'Digital Marketing Executive',
  'HR Executive',
  'Sales Executive',
];

export default function RoleBlueprintAssistantPage() {
  const router = useRouter();

  // Step 1: Input controls
  const [selectedRole, setSelectedRole] = useState<string>('Backend Developer');
  const [customRoleTitle, setCustomRoleTitle] = useState<string>('');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [includeCommon, setIncludeCommon] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Step 2: Draft suggestion state
  const [suggestionId, setSuggestionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningItem[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [practiceTasks, setPracticeTasks] = useState<PracticeTaskItem[]>([]);
  const [assessmentIdeas, setAssessmentIdeas] = useState<AssessmentIdeaItem[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceTypeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'skills' | 'learning' | 'flashcards' | 'practice' | 'assessment' | 'evidence'>('skills');

  // New item inputs
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical');
  const [newSkillImportance, setNewSkillImportance] = useState<'Must-have' | 'Good-to-have'>('Must-have');
  const [newSkillDescription, setNewSkillDescription] = useState('');

  // Approval state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [approvedResult, setApprovedResult] = useState<any>(null);

  const activeRoleName = selectedRole === 'Custom' ? (customRoleTitle || 'Custom Role') : selectedRole;

  // Generate suggestions
  const handleGenerate = async () => {
    if (selectedRole === 'Custom' && !customRoleTitle.trim()) {
      toast.error('Please enter a role title for custom role generation.');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        roleTitle: activeRoleName,
        roleDescription: roleDescription.trim(),
        includeCommon,
      };

      const res = await api.post('/company/role-blueprints/ai-suggest', payload);
      const sug = res.data?.suggestion;

      if (sug) {
        setSuggestionId(sug.id);
        setStatus(sug.status || 'DRAFT');
        setSkills(Array.isArray(sug.suggested_skills) ? sug.suggested_skills : []);
        setLearningPaths(Array.isArray(sug.suggested_learning_paths) ? sug.suggested_learning_paths : []);
        setFlashcards(Array.isArray(sug.suggested_flashcards) ? sug.suggested_flashcards : []);
        setPracticeTasks(Array.isArray(sug.suggested_practice_tasks) ? sug.suggested_practice_tasks : []);
        setAssessmentIdeas(Array.isArray(sug.suggested_assessment_ideas) ? sug.suggested_assessment_ideas : []);
        setEvidenceTypes(Array.isArray(sug.suggested_evidence_types) ? sug.suggested_evidence_types : []);
        setApprovedResult(null);

        toast.success('AI suggestions generated as DRAFT. Please review & edit!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate AI blueprint.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add new skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) {
      toast.error('Please provide a skill name');
      return;
    }
    const item: SkillItem = {
      name: newSkillName.trim(),
      category: newSkillCategory,
      importance: newSkillImportance,
      description: newSkillDescription.trim() || `Verified competency in ${newSkillName.trim()}`,
    };
    setSkills((prev) => [...prev, item]);
    setNewSkillName('');
    setNewSkillDescription('');
    toast.success('Skill added to draft');
  };

  // Remove skill
  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
    toast('Skill removed from draft', { icon: '🗑️' });
  };

  // Toggle importance
  const handleToggleImportance = (index: number) => {
    setSkills((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, importance: s.importance === 'Must-have' ? 'Good-to-have' : 'Must-have' }
          : s
      )
    );
  };

  // Save edits back to backend draft
  const handleSaveDraftEdits = async () => {
    if (!suggestionId) return;
    setIsSaving(true);
    try {
      await api.put(`/company/role-blueprints/ai-suggestions/${suggestionId}`, {
        suggestedSkills: skills,
        suggestedLearningPaths: learningPaths,
        suggestedFlashcards: flashcards,
        suggestedPracticeTasks: practiceTasks,
        suggestedAssessmentIdeas: assessmentIdeas,
        suggestedEvidenceTypes: evidenceTypes,
        roleTitle: activeRoleName,
        roleDescription,
      });
      toast.success('Draft updates saved successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve blueprint
  const handleApprove = async () => {
    if (!suggestionId) return;
    if (skills.length === 0) {
      toast.error('Blueprint must contain at least one skill before approval.');
      return;
    }

    setIsApproving(true);
    try {
      // First save current in-memory edits to DB
      await api.put(`/company/role-blueprints/ai-suggestions/${suggestionId}`, {
        suggestedSkills: skills,
        suggestedLearningPaths: learningPaths,
        suggestedFlashcards: flashcards,
        suggestedPracticeTasks: practiceTasks,
        suggestedAssessmentIdeas: assessmentIdeas,
        suggestedEvidenceTypes: evidenceTypes,
      });

      // Submit official approval
      const res = await api.post(`/company/role-blueprints/ai-suggestions/${suggestionId}/approve`, {
        approvalNotes: approvalNotes || 'Reviewed and approved by company hiring manager.',
        createRoleMaster: true,
      });

      setStatus('APPROVED');
      setApprovedResult(res.data);
      toast.success('Role blueprint officially approved & active for vacancies!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve blueprint');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject blueprint
  const handleReject = async () => {
    if (!suggestionId) return;
    try {
      await api.post(`/company/role-blueprints/ai-suggestions/${suggestionId}/reject`, {
        reason: 'Discarded by reviewer in blueprint generator',
      });
      setStatus('REJECTED');
      toast('Blueprint suggestions discarded', { icon: '🚫' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject blueprint');
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
      {/* ─── HEADER ─── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="breadcrumbs">
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href="/dashboard/vacancies" style={{ color: 'var(--text-secondary)' }}>Recruitment</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">AI Role Skill Blueprint Generator</span>
        </div>
        <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={24} style={{ color: 'var(--primary)' }} />
              AI Role Skill Blueprint Generator
            </h1>
            <p className="page-subtitle">
              Draft role-specific core competencies, learning curriculums, flashcards, practice tasks, and evidence rubrics.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MANDATORY SAFETY NOTICE BANNER ─── */}
      <div
        style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <AlertCircle size={22} style={{ color: '#d97706', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#92400e', marginBottom: 2 }}>
            Human-in-the-Loop Governance Notice
          </div>
          <div style={{ fontSize: 12.5, color: '#b45309', lineHeight: 1.5 }}>
            <strong>AI suggestions are drafts only.</strong> The company or platform admin must review, edit, and approve before the blueprint becomes active for candidates. AI never automatically creates candidate learning paths or hiring decisions.
          </div>
        </div>
      </div>

      {/* ─── STEP 1: CONFIGURATION & GENERATION ─── */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={18} style={{ color: 'var(--primary)' }} />
          Step 1: Select Target Role & Objectives
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Supported Role Profile
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                padding: '0 12px',
                fontSize: 13.5,
                fontWeight: 600,
                color: '#0f172a',
                background: '#fff',
              }}
            >
              {SUPPORTED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Custom">+ Other / Custom Role Title</option>
            </select>
          </div>

          {selectedRole === 'Custom' && (
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Custom Role Title
              </label>
              <input
                type="text"
                placeholder="e.g. Embedded Firmware Engineer"
                value={customRoleTitle}
                onChange={(e) => setCustomRoleTitle(e.target.value)}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: 13.5,
                  color: '#0f172a',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Role Context / Specific Focus (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. High-throughput event streaming, distributed microservices"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                padding: '0 12px',
                fontSize: 13.5,
                color: '#0f172a',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#475569', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeCommon}
              onChange={(e) => setIncludeCommon(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
            />
            Include optional foundational workplace skills (editable & removable)
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 3px 12px rgba(184,134,11,0.25)',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={15} className="spin" /> Generating Role Blueprint...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Generate AI Suggestions
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── STEP 2: DRAFT REVIEW & CUSTOMIZATION ─── */}
      {suggestionId && (
        <div
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {/* Draft header status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingBottom: 16,
              borderBottom: '1px solid #f1f5f9',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Draft Blueprint: {activeRoleName}
                </h2>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: status === 'APPROVED' ? '#ecfdf5' : status === 'REJECTED' ? '#fef2f2' : '#fef9c3',
                    color: status === 'APPROVED' ? '#059669' : status === 'REJECTED' ? '#dc2626' : '#a16207',
                    border: `1px solid ${status === 'APPROVED' ? '#a7f3d0' : status === 'REJECTED' ? '#fecaca' : '#fde047'}`,
                  }}
                >
                  {status}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
                Review and tailor each competency. All suggestions remain unapproved drafts until you save &amp; approve.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={handleSaveDraftEdits}
                disabled={isSaving || status === 'APPROVED'}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Edit3 size={14} /> {isSaving ? 'Saving...' : 'Save Draft Edits'}
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={status === 'APPROVED' || status === 'REJECTED'}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #fecaca',
                  background: '#fff',
                  color: '#dc2626',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <X size={14} /> Discard Draft
              </button>
            </div>
          </div>

          {/* Navigation sub-tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 10,
              marginBottom: 20,
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'skills', label: `Core Skills (${skills.length})`, icon: Layers },
              { id: 'learning', label: `Learning Path (${learningPaths.length})`, icon: BookOpen },
              { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: Copy },
              { id: 'practice', label: `Practice Tasks (${practiceTasks.length})`, icon: Award },
              { id: 'assessment', label: `Assessment Ideas (${assessmentIdeas.length})`, icon: FileCheck },
              { id: 'evidence', label: `Evidence Types (${evidenceTypes.length})`, icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: isSelected ? '#0f172a' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#64748b',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── TAB CONTENT 1: CORE SKILLS ─── */}
          {activeTab === 'skills' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Competency Roster ({skills.filter((s) => s.importance === 'Must-have').length} Must-have, {skills.filter((s) => s.importance === 'Good-to-have').length} Good-to-have)
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Click badge to toggle Must-have vs Good-to-have
                </span>
              </div>

              {/* Skills list table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                          {skill.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: '#e2e8f0',
                            color: '#475569',
                          }}
                        >
                          {skill.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleImportance(index)}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            background: skill.importance === 'Must-have' ? '#fee2e2' : '#f0fdf4',
                            color: skill.importance === 'Must-have' ? '#b91c1c' : '#15803d',
                          }}
                          title="Click to toggle importance"
                        >
                          ★ {skill.importance}
                        </button>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                        {skill.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 6,
                      }}
                      title="Remove skill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {skills.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No skills in draft. Use the form below to add a skill.
                  </div>
                )}
              </div>

              {/* Add Custom Skill Form */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                  + Add Custom Skill to Draft
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Skill Name (e.g. GraphQL Federation)"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    style={{ height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 12.5 }}
                  />
                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    style={{ height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 12.5 }}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Database">Database</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Common">Common / Soft Skill</option>
                  </select>
                  <select
                    value={newSkillImportance}
                    onChange={(e) => setNewSkillImportance(e.target.value as any)}
                    style={{ height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 12.5 }}
                  >
                    <option value="Must-have">Must-have</option>
                    <option value="Good-to-have">Good-to-have</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Short description / requirement expectation..."
                    value={newSkillDescription}
                    onChange={(e) => setNewSkillDescription(e.target.value)}
                    style={{ flex: 1, height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 12.5 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    style={{
                      padding: '0 16px',
                      height: 38,
                      borderRadius: 6,
                      border: 'none',
                      background: '#0f172a',
                      color: '#fff',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB CONTENT 2: LEARNING PATH ─── */}
          {activeTab === 'learning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {learningPaths.map((lp, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{lp.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{lp.duration} · {lp.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Aligned Competency: <strong>{lp.skill}</strong></div>
                  <a href={lp.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: '#b8860b', textDecoration: 'underline' }}>
                    {lp.url}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB CONTENT 3: FLASHCARDS ─── */}
          {activeTab === 'flashcards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {flashcards.map((fc, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Card #{i + 1} Prompt
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{fc.front}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 4 }}>
                    Key Answer
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>{fc.back}</div>
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB CONTENT 4: PRACTICE TASKS ─── */}
          {activeTab === 'practice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {practiceTasks.map((pt, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{pt.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#e2e8f0', color: '#475569' }}>
                      {pt.difficulty}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#334155', margin: '0 0 8px', lineHeight: 1.5 }}>{pt.prompt}</p>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    <strong>Expected Deliverable:</strong> {pt.expectedDeliverable}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB CONTENT 5: ASSESSMENT IDEAS ─── */}
          {activeTab === 'assessment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assessmentIdeas.map((ai, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 }}>
                    {ai.type} Question #{i + 1}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.45 }}>{ai.question}</div>
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB CONTENT 6: EVIDENCE TYPES ─── */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {evidenceTypes.map((et, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{et.name}</div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>{et.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* ─── STEP 3: APPROVAL & ACTIVATION ─── */}
          <div
            style={{
              marginTop: 26,
              paddingTop: 20,
              borderTop: '1px solid #e2e8f0',
              background: '#fafaf9',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
              Final Review &amp; Official Approval
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>
              Approving converts this draft blueprint into active role requirements in your company catalog, making it ready for vacancy posting.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Approval Notes / Compliance Sign-off
              </label>
              <input
                type="text"
                placeholder="e.g. Reviewed competencies for Q4 Engineering hiring pipeline"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                disabled={status === 'APPROVED'}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  padding: '0 10px',
                  fontSize: 12.5,
                  background: status === 'APPROVED' ? '#f1f5f9' : '#fff',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || status === 'APPROVED'}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: status === 'APPROVED' ? '#059669' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: (isApproving || status === 'APPROVED') ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 3px 12px rgba(5,150,105,0.25)',
                }}
              >
                {status === 'APPROVED' ? (
                  <>
                    <CheckCircle2 size={16} /> Blueprint Approved &amp; Active
                  </>
                ) : isApproving ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Activating Blueprint...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Approve &amp; Activate Blueprint
                  </>
                )}
              </button>

              {status === 'APPROVED' && (
                <Link
                  href="/dashboard/vacancies/builder"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid #0f172a',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Create Vacancy with this Blueprint →
                </Link>
              )}
            </div>

            {approvedResult && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  fontSize: 12,
                  color: '#065f46',
                }}
              >
                ✓ Success: Applied {approvedResult.appliedRequirementsCount} requirements and {approvedResult.appliedResourcesCount} learning resources to Role Master catalog.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
