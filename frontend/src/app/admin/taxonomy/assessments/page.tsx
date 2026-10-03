'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  Shield,
  Search,
} from 'lucide-react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { PermissionDeniedState } from '@/components/admin/States';
import { adminDataService, AssessmentTaxonomyItem } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

export default function AssessmentTaxonomyPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [items, setItems] = useState<AssessmentTaxonomyItem[]>(adminDataService.getAssessmentTaxonomy());
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Coding');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [integrityProfile, setIntegrityProfile] = useState<'Standard' | 'Strict' | 'High-Trust'>('Strict');

  const refresh = () => {
    setItems(adminDataService.getAssessmentTaxonomy());
  };

  useEffect(() => {
    const unsub = adminDataService.subscribe(refresh);
    return () => unsub();
  }, []);

  if (!hasPermission('manage_taxonomy')) {
    return <PermissionDeniedState requiredRole="Super Admin or Verification Admin" />;
  }

  const filtered = items.filter((t) => {
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Assessment track name is required');
      return;
    }

    adminDataService.addAssessmentTaxonomy(
      {
        name,
        category,
        description: description || 'Standard platform benchmark sandbox for objective technical verification.',
        standardDurationMin: Number(duration) || 60,
        defaultEvaluationMetrics: ['Correctness', 'Algorithmic Efficiency', 'Edge Cases'],
        supportedQuestionTypes: ['Interactive Sandbox', 'Automated Unit Tests'],
        integrityProfile,
      },
      adminUser.name,
      adminUser.role
    );

    toast.success(`Assessment track "${name}" added to platform taxonomy.`);
    setIsCreateOpen(false);
    setName('');
    setDescription('');
  };

  const columns: Column<AssessmentTaxonomyItem>[] = [
    {
      key: 'name',
      header: 'Canonical Assessment Track',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', maxWidth: '420px', whiteSpace: 'normal' }}>
            {item.description}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'category',
      header: 'Evaluation Track',
      render: (item) => (
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(212, 175, 55, 0.15)',
            color: '#854d0e',
          }}
        >
          {item.category}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'integrityProfile',
      header: 'Integrity Profile',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: item.integrityProfile === 'Strict' ? '#dc2626' : '#059669' }}>
            {item.integrityProfile} Enforcement
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {item.standardDurationMin} mins standard
          </div>
        </div>
      ),
    },
    {
      key: 'activeUsageCount',
      header: 'Tenant Usage',
      render: (item) => (
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {item.activeUsageCount} Active Vacancies
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Platform Assessment Taxonomy
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
              Evaluation Benchmark Catalog
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Standardize authorized assessment sandbox modules, question schemas, and anti-tampering baseline profiles.
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
          <Plus size={15} /> Add Assessment Track
        </button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter assessment tracks by name, category, profile..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Canonical Assessment Track"
        subtitle="Define standardized test specification and execution sandbox parameters"
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
              Save Assessment Track
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Track Title
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Consensus & Raft Lab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            >
              <option value="Technical">Technical</option>
              <option value="Coding">Coding Sandbox</option>
              <option value="SQL">SQL Performance Lab</option>
              <option value="Problem Solving">Problem Solving</option>
              <option value="Domain Knowledge">Domain Knowledge</option>
              <option value="Structured Interview">Structured Oral Interview</option>
              <option value="Project Evaluation">Project Evaluation</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Integrity Profile
            </label>
            <select
              value={integrityProfile}
              onChange={(e) => setIntegrityProfile(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            >
              <option value="Strict">Strict (Webcam + Audio + Full Tab Enforcement)</option>
              <option value="Standard">Standard (Tab Switch & Copy/Paste Restriction)</option>
              <option value="High-Trust">High-Trust (Oral Interview / Canvas)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Standard Duration (Minutes)
            </label>
            <input
              type="number"
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Description & Sandbox Specification
            </label>
            <textarea
              rows={3}
              placeholder="Describe execution environment and unit test capabilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
