'use client';

import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  CheckCircle2,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, RoleTaxonomyItem } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function RoleTaxonomyPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [roles, setRoles] = useState<RoleTaxonomyItem[]>(adminDataService.getRoleTaxonomy());
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newFamily, setNewFamily] = useState('Software Engineering');
  const [newSkillsStr, setNewSkillsStr] = useState('');
  const [newReqTypesStr, setNewReqTypesStr] = useState('Architectural Design, Concurrency Implementation, Failure Recovery');
  const [newEvalCatsStr, setNewEvalCatsStr] = useState('Algorithmic Efficiency, Fault Tolerance, Code Correctness');
  const [newBenchmark, setNewBenchmark] = useState(80);

  const refresh = () => {
    setRoles(adminDataService.getRoleTaxonomy());
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, []);

  if (!hasPermission('manage_taxonomy')) {
    return <PermissionDeniedState requiredRole="Super Admin or Verification Admin" />;
  }

  const filtered = roles.filter((r) => {
    return (
      r.roleName.toLowerCase().includes(search.toLowerCase()) ||
      r.family.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = () => {
    if (!newRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    const parsedSkills = newSkillsStr
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    adminDataService.addRoleTaxonomy(
      {
        roleName: newRoleName,
        family: newFamily,
        skillCategories: [
          {
            categoryName: 'Standard Core Competencies',
            skills: parsedSkills.length > 0 ? parsedSkills : ['Distributed Computing', 'Clean Architecture'],
          },
        ],
        requirementTypes: newReqTypesStr.split(',').map((s) => s.trim()).filter(Boolean),
        evaluationCategories: newEvalCatsStr.split(',').map((s) => s.trim()).filter(Boolean),
        standardBenchmarkScore: Number(newBenchmark) || 80,
      },
      adminUser.name,
      adminUser.role
    );

    toast.success(`Standardized Role "${newRoleName}" added to platform taxonomy.`);
    setIsCreateOpen(false);
    setNewRoleName('');
    setNewSkillsStr('');
  };

  const columns: Column<RoleTaxonomyItem>[] = [
    {
      key: 'roleName',
      header: 'Normalized Role Title',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
            {item.roleName}
          </div>
          <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 600 }}>
            Family: {item.family}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'skillCategories',
      header: 'Standard Skill Taxonomy',
      render: (item) => {
        const totalSkills = item.skillCategories.reduce((acc, c) => acc + c.skills.length, 0);
        return (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>
              {totalSkills} Normalized Skills across {item.skillCategories.length} Categories
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {item.skillCategories.map((c) => c.categoryName).join(', ')}
            </div>
          </div>
        );
      },
    },
    {
      key: 'requirementTypes',
      header: 'Standard Requirement Types',
      render: (item) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {item.requirementTypes.map((rt, i) => (
            <span
              key={i}
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#f1f5f9',
                color: '#475569',
              }}
            >
              {rt}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'standardBenchmarkScore',
      header: 'Benchmark',
      render: (item) => (
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#059669' }}>
          {item.standardBenchmarkScore}% Pass
        </span>
      ),
      sortable: true,
    },
    {
      key: 'lastUpdated',
      header: 'Last Catalog Update',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.lastUpdated}</span>,
      sortable: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Platform Role Taxonomy
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#854d0e',
              }}
            >
              Platform Canonical Standard
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Standardize global role definitions, skill ontology, and evaluation rubrics applied across all corporate tenants.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#b8860b',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(184, 134, 11, 0.25)',
          }}
        >
          <Plus size={15} /> Add Canonical Role
        </button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter role catalog by name or family..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />

      {/* Add Role Taxonomy Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Normalized Platform Role"
        subtitle="Define standardized competency matrix for company vacancy alignment"
        maxWidth="580px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => setIsCreateOpen(false)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#b8860b',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Standard Role
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Role Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Site Reliability Engineer"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Family Group
            </label>
            <select
              value={newFamily}
              onChange={(e) => setNewFamily(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            >
              <option value="Software Engineering">Software Engineering</option>
              <option value="Security & Trust">Security & Trust</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Data & Analytics">Data & Analytics</option>
              <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Normalized Skills (One per line)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Linux Kernel Tuning&#10;Kubernetes Operator Pattern&#10;eBPF Observability"
              value={newSkillsStr}
              onChange={(e) => setNewSkillsStr(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Standard Benchmark Pass Score (%)
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={newBenchmark}
              onChange={(e) => setNewBenchmark(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
