'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Target, Trash2, Edit2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

interface RequirementItem {
  id: string;
  skill: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  type: 'required' | 'preferred';
}

export default function RequirementsPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacId, setSelectedVacId] = useState<string>('');
  const [requirementsMap, setRequirementsMap] = useState<Record<string, RequirementItem[]>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCategory, setNewCategory] = useState('Technical');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newType, setNewType] = useState<'required' | 'preferred'>('required');

  useEffect(() => {
    async function load() {
      const vList = await DataService.getVacancies();
      setVacancies(vList);
      if (vList.length > 0) {
        setSelectedVacId(vList[0].id);
        const initialMap: Record<string, RequirementItem[]> = {};
        vList.forEach(v => {
          initialMap[v.id] = [
            { id: '1', skill: 'Core Distributed Architecture & Concurrency', category: 'Technical', priority: 'high', type: 'required' },
            { id: '2', skill: 'PostgreSQL Query Optimization & Indexing', category: 'Technical', priority: 'high', type: 'required' },
            { id: '3', skill: 'Kafka Streaming & Event Driven Design', category: 'Architecture', priority: 'medium', type: 'required' },
            { id: '4', skill: 'Docker & Kubernetes Microservice Deployment', category: 'Infrastructure', priority: 'low', type: 'preferred' },
            { id: '5', skill: 'Technical Communication & Rubric Defense', category: 'Soft Skills', priority: 'medium', type: 'required' },
          ];
        });
        setRequirementsMap(initialMap);
      }
    }
    load();
  }, []);

  const selectedVacancy = vacancies.find(v => v.id === selectedVacId) || vacancies[0];
  const currentReqs = selectedVacId ? (requirementsMap[selectedVacId] || []) : [];

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    const newItem: RequirementItem = {
      id: 'req-' + Math.random().toString(36).substring(2, 7),
      skill: newSkill.trim(),
      category: newCategory,
      priority: newPriority,
      type: newType,
    };

    setRequirementsMap(prev => ({
      ...prev,
      [selectedVacId]: [...(prev[selectedVacId] || []), newItem],
    }));

    toast.success('Requirement added to role blueprint');
    setIsAddModalOpen(false);
    setNewSkill('');
  };

  const handleDeleteReq = (id: string) => {
    setRequirementsMap(prev => ({
      ...prev,
      [selectedVacId]: (prev[selectedVacId] || []).filter(r => r.id !== id),
    }));
    toast.success('Requirement removed');
  };

  return (
    <div className="page-content">
      {/* Header with single primary action */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Recruitment</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Role Requirements</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Role Requirements &amp; Competency Specs
            </h1>
            <p className="page-subtitle">Define what each role requires — this drives the GenuAI automated assessment &amp; evidence hashing matrix.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-gold">
            <Plus size={16} />
            Add Requirement
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column: Vacancy List */}
        <div style={{ gridColumn: 'span 1' }}>
          <div className="section-title">Active Vacancies ({vacancies.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vacancies.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVacId(v.id)}
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '14px 16px',
                  borderLeft: `3px solid ${selectedVacId === v.id ? '#00236f' : 'var(--border)'}`,
                  background: selectedVacId === v.id ? '#eff6ff' : 'var(--white)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, color: selectedVacId === v.id ? '#00236f' : 'var(--text-primary)', marginBottom: 3, fontSize: 13.5 }}>
                  {v.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {v.dept} • {v.openings} opening(s) • {(requirementsMap[v.id] || []).length} criteria
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Requirements Blueprint */}
        {selectedVacancy && (
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="card-header" style={{ marginBottom: 14 }}>
                <div>
                  <div className="card-title" style={{ fontSize: 16 }}>{selectedVacancy.title}</div>
                  <div className="card-subtitle">{selectedVacancy.dept} • {selectedVacancy.location || 'Remote'} • {selectedVacancy.openings} Open Position(s)</div>
                </div>
                <Link href={`/dashboard/vacancies/${selectedVacancy.id}`} className="btn btn-secondary btn-sm">
                  View Vacancy Details →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentReqs.map(r => (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{r.skill}</span>
                        <span className={`badge ${r.type === 'required' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                          {r.type}
                        </span>
                        <span className={`badge ${r.priority === 'high' ? 'badge-red' : r.priority === 'medium' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                          {r.priority} priority
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        Category: {r.category} • Assessed via automated sandbox
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteReq(r.id)}
                      className="btn btn-ghost btn-sm btn-icon text-muted"
                      title="Remove requirement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Requirement Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Add Competency Requirement</div>
                <div className="modal-subtitle">Attach verifiable criteria to {selectedVacancy?.title}</div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddRequirement} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Skill or Competency Benchmark *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Consensus & Raft Protocol"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="form-select"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Architecture">Architecture</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Security">Security</option>
                      <option value="Soft Skills">Soft Skills</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Add Criterion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
