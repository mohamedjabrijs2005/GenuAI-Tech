'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Plus, Edit2, PowerOff, Power, Loader2, AlertCircle, FolderOpen,
  Briefcase, X, MoreVertical, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface Department {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  role_count: string;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
  department_name: string;
  job_description: string;
  experience_level: string;
  employment_type: string;
  location: string;
  vacancy_count: number;
  status: string;
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
const EXP_LABELS: Record<string, string> = {
  entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior',
  lead: 'Lead', executive: 'Executive',
};
const EMP_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  internship: 'Internship', freelance: 'Freelance',
};

// ─────────────────────────────────────────────────────
// Department Modal
// ─────────────────────────────────────────────────────
function DepartmentModal({
  dept, onClose, onSaved,
}: { dept: Department | null; onClose: () => void; onSaved: (d: Department) => void }) {
  const isEdit = !!dept;
  const [name, setName] = useState(dept?.name ?? '');
  const [description, setDescription] = useState(dept?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined };
      const res = isEdit
        ? await api.patch(`/departments/${dept!.id}`, payload)
        : await api.post('/departments', payload);
      onSaved(res.data.department);
      toast.success(isEdit ? 'Department updated' : 'Department created');
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.errors) {
        const map: Record<string, string> = {};
        err.response.data.errors.forEach((fe: { path: string; msg: string }) => { map[fe.path] = fe.msg; });
        setErrors(map);
      } else if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Something went wrong.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dept-modal-title">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(184,134,11,0.1))',
              border: '1px solid rgba(212,175,55,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854d0e',
            }}>
              <FolderOpen size={17} />
            </div>
            <div>
              <h2 className="modal-title" id="dept-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                {isEdit ? 'Edit Department' : 'Create Department'}
              </h2>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>
                {isEdit ? 'Update this department\'s details' : 'Add a new department to your organisation'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ paddingTop: 20 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dept-name">
                Department Name <span className="required">*</span>
              </label>
              <input
                id="dept-name"
                type="text"
                className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="e.g. Engineering, Product, Sales"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({...p, name:''})); }}
                required
                autoFocus
              />
              {errors.name && <div className="form-error"><AlertCircle size={11}/> {errors.name}</div>}
              <div className="form-hint">Use a clear, recognisable name for this department</div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="dept-desc">
                Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <textarea
                id="dept-desc"
                className="form-textarea"
                placeholder="Briefly describe this department's purpose and responsibilities…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ minHeight: 90, resize: 'vertical' }}
              />
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button id="save-dept" type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ minWidth: 130 }}>
              {saving
                ? <><Loader2 size={13} style={{animation:'spin 0.6s linear infinite'}}/> Saving…</>
                : isEdit ? 'Save Changes' : 'Create Department'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Role Modal
// ─────────────────────────────────────────────────────
function RoleModal({
  role, departments, onClose, onSaved,
}: { role: Role | null; departments: Department[]; onClose: () => void; onSaved: (r: Role) => void }) {
  const isEdit = !!role;
  const [form, setForm] = useState({
    title: role?.title ?? '',
    departmentId: role?.department_id ?? '',
    jobDescription: role?.job_description ?? '',
    experienceLevel: role?.experience_level ?? '',
    employmentType: role?.employment_type ?? '',
    location: role?.location ?? '',
    vacancyCount: role?.vacancy_count?.toString() ?? '1',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [f]: e.target.value }));
    setErrors(prev => ({ ...prev, [f]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Role title is required';
    if (!form.departmentId) errs.departmentId = 'Department is required';
    if (!form.experienceLevel) errs.experienceLevel = 'Experience level is required';
    if (!form.employmentType) errs.employmentType = 'Employment type is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    const vc = parseInt(form.vacancyCount);
    if (isNaN(vc) || vc < 1) errs.vacancyCount = 'Vacancy count must be at least 1';
    if (form.jobDescription && form.jobDescription.trim().length > 0 && form.jobDescription.trim().length < 20) {
      errs.jobDescription = 'Job description must be at least 20 characters';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        departmentId: form.departmentId,
        jobDescription: form.jobDescription.trim() || undefined,
        experienceLevel: form.experienceLevel,
        employmentType: form.employmentType,
        location: form.location.trim(),
        vacancyCount: vc,
      };
      const res = isEdit
        ? await api.patch(`/roles/${role!.id}`, payload)
        : await api.post('/roles', payload);
      onSaved(res.data.role);
      toast.success(isEdit ? 'Role updated' : 'Role created');
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.errors) {
        const map: Record<string, string> = {};
        err.response.data.errors.forEach((fe: { path: string; msg: string }) => { map[fe.path] = fe.msg; });
        setErrors(map);
      } else {
        toast.error('Failed to save role.');
      }
    } finally {
      setSaving(false);
    }
  };

  const activeDepts = departments.filter(d => d.is_active);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h2 className="modal-title" id="role-modal-title">{isEdit ? 'Edit Role' : 'New Role'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label" htmlFor="role-title">Role Title <span className="required">*</span></label>
                <input id="role-title" type="text" className={`form-input${errors.title?' error':''}`}
                  placeholder="e.g. Senior Software Engineer" value={form.title} onChange={set('title')} autoFocus />
                {errors.title && <div className="form-error"><AlertCircle size={11}/> {errors.title}</div>}
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="role-dept">Department <span className="required">*</span></label>
                <select id="role-dept" className={`form-select${errors.departmentId?' error':''}`}
                  value={form.departmentId} onChange={set('departmentId')}>
                  <option value="">Select department</option>
                  {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.departmentId && <div className="form-error"><AlertCircle size={11}/> {errors.departmentId}</div>}
                {activeDepts.length === 0 && <div className="form-hint">No active departments. Create one first.</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role-exp">Experience Level <span className="required">*</span></label>
                <select id="role-exp" className={`form-select${errors.experienceLevel?' error':''}`}
                  value={form.experienceLevel} onChange={set('experienceLevel')}>
                  <option value="">Select level</option>
                  {Object.entries(EXP_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {errors.experienceLevel && <div className="form-error"><AlertCircle size={11}/> {errors.experienceLevel}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role-emp">Employment Type <span className="required">*</span></label>
                <select id="role-emp" className={`form-select${errors.employmentType?' error':''}`}
                  value={form.employmentType} onChange={set('employmentType')}>
                  <option value="">Select type</option>
                  {Object.entries(EMP_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {errors.employmentType && <div className="form-error"><AlertCircle size={11}/> {errors.employmentType}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role-location">Location <span className="required">*</span></label>
                <input id="role-location" type="text" className={`form-input${errors.location?' error':''}`}
                  placeholder="e.g. London, UK or Remote" value={form.location} onChange={set('location')} />
                {errors.location && <div className="form-error"><AlertCircle size={11}/> {errors.location}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role-vacancies">Vacancies <span className="required">*</span></label>
                <input id="role-vacancies" type="number" className={`form-input${errors.vacancyCount?' error':''}`}
                  min={1} value={form.vacancyCount} onChange={set('vacancyCount')} />
                {errors.vacancyCount && <div className="form-error"><AlertCircle size={11}/> {errors.vacancyCount}</div>}
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="role-desc">Job Description</label>
                <textarea id="role-desc" className={`form-textarea${errors.jobDescription?' error':''}`}
                  placeholder="Describe the role responsibilities, requirements, and expectations..."
                  value={form.jobDescription} onChange={set('jobDescription')}
                  style={{ minHeight: 130 }} />
                {errors.jobDescription && <div className="form-error"><AlertCircle size={11}/> {errors.jobDescription}</div>}
                <div className="form-hint">At least 20 characters if provided</div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button id="save-role" type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <><Loader2 size={13} style={{animation:'spin 0.6s linear infinite'}}/> Saving...</> : isEdit ? 'Save Changes' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Confirm Dialog
// ─────────────────────────────────────────────────────
function ConfirmDialog({
  title, message, confirmLabel, onConfirm, onCancel, danger = true,
}: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal confirm-dialog">
        <div className="modal-body">
          <div className="confirm-icon">
            <AlertCircle size={20} />
          </div>
          <div className="confirm-title">{title}</div>
          <div className="confirm-desc">{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Role View Modal
// ─────────────────────────────────────────────────────
function RoleViewModal({ role, onClose, onEdit }: { role: Role; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">{role.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            {[
              ['Department', role.department_name],
              ['Status', role.status],
              ['Experience', EXP_LABELS[role.experience_level] ?? role.experience_level],
              ['Employment', EMP_LABELS[role.employment_type] ?? role.employment_type],
              ['Location', role.location],
              ['Vacancies', role.vacancy_count],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          {role.job_description && (
            <>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Job Description</div>
              <div style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{role.job_description}</div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={onEdit}><Edit2 size={13} /> Edit Role</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
function DepartmentsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'departments' | 'roles'>(
    searchParams.get('tab') === 'roles' ? 'roles' : 'departments'
  );

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [deptModal, setDeptModal] = useState<{ open: boolean; dept: Department | null }>({ open: false, dept: null });
  const [roleModal, setRoleModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean; type: 'dept-deactivate' | 'dept-activate' | 'role-deactivate'; id: string; name: string;
  } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [dr, rr] = await Promise.all([
        api.get('/departments'),
        api.get('/roles'),
      ]);
      setDepartments(dr.data.departments);
      setRoles(rr.data.roles);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const switchTab = (tab: 'departments' | 'roles') => {
    setActiveTab(tab);
    router.replace(`/dashboard/departments${tab === 'roles' ? '?tab=roles' : ''}`, { scroll: false });
  };

  // ── Department handlers ──
  const handleDeptSaved = (d: Department) => {
    setDepartments(prev => {
      const idx = prev.findIndex(x => x.id === d.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = d; return next; }
      return [...prev, d];
    });
  };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'dept-deactivate') {
        const { data } = await api.patch(`/departments/${confirm.id}/deactivate`);
        setDepartments(prev => prev.map(d => d.id === confirm.id ? { ...d, is_active: data.department.is_active } : d));
        toast.success('Department deactivated');
      } else if (confirm.type === 'dept-activate') {
        const { data } = await api.patch(`/departments/${confirm.id}/activate`);
        setDepartments(prev => prev.map(d => d.id === confirm.id ? { ...d, is_active: data.department.is_active } : d));
        toast.success('Department activated');
      } else if (confirm.type === 'role-deactivate') {
        const { data } = await api.patch(`/roles/${confirm.id}/deactivate`);
        setRoles(prev => prev.map(r => r.id === confirm.id ? { ...r, status: data.role.status } : r));
        toast.success('Role deactivated');
      }
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setConfirm(null);
    }
  };

  const handleRoleSaved = (r: Role) => {
    setRoles(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = r; return next; }
      return [r, ...prev];
    });
  };

  const activeDepts = departments.filter(d => d.is_active);
  const activeRoles = roles.filter(r => r.status !== 'DEACTIVATED');

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Departments & Roles</h1>
          <p className="page-subtitle">Structure your organisation and define your open roles.</p>
        </div>
        <button
          id={activeTab === 'departments' ? 'add-dept-btn' : 'add-role-btn'}
          className="btn btn-primary"
          onClick={() => activeTab === 'departments'
            ? setDeptModal({ open: true, dept: null })
            : setRoleModal({ open: true, role: null })
          }
        >
          <Plus size={15} />
          {activeTab === 'departments' ? 'New Department' : 'New Role'}
        </button>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {(['departments', 'roles'] as const).map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => switchTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 13.5,
              fontWeight: 500,
              color: activeTab === tab ? 'var(--color-brand-light)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {tab === 'departments' ? <FolderOpen size={14}/> : <Briefcase size={14}/>}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{
              background: 'var(--color-surface-3)',
              color: 'var(--color-text-muted)',
              padding: '1px 7px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
            }}>
              {tab === 'departments' ? activeDepts.length : activeRoles.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── DEPARTMENTS TAB ── */}
      {activeTab === 'departments' && (
        <>
          {departments.length === 0 ? (
            <div className="table-wrapper">
              <div className="empty-state">
                <div className="empty-icon"><FolderOpen size={22} /></div>
                <div className="empty-title">No departments yet</div>
                <div className="empty-desc">Create your first department to start organising your company structure.</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}
                  onClick={() => setDeptModal({ open: true, dept: null })}>
                  <Plus size={14} /> Create Department
                </button>
              </div>
            </div>
          ) : (
            <div className="dept-grid">
              {departments.map(dept => (
                <div key={dept.id} className={`dept-card${dept.is_active ? '' : ' inactive'}`}>
                  {/* Card top: icon + name + status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: dept.is_active
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(184,134,11,0.08))'
                        : '#f1f5f9',
                      border: `1px solid ${dept.is_active ? 'rgba(212,175,55,0.3)' : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: dept.is_active ? '#854d0e' : '#94a3b8',
                      marginTop: 2,
                    }}>
                      <FolderOpen size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="dept-name">
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dept.name}
                        </span>
                        {!dept.is_active && (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontSize: 10, flexShrink: 0 }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      {dept.description ? (
                        <div className="dept-meta">{dept.description}</div>
                      ) : (
                        <div className="dept-meta" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          No description provided
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dept-footer">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11.5, fontWeight: 600, color: '#64748b',
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: 20, padding: '3px 10px',
                    }}>
                      <Briefcase size={11} />
                      {dept.role_count} {parseInt(dept.role_count) === 1 ? 'role' : 'roles'}
                    </span>
                    <div className="actions-row">
                      <button className="btn btn-ghost btn-sm" title="Edit"
                        onClick={() => setDeptModal({ open: true, dept })}>
                        <Edit2 size={13} />
                      </button>
                      {dept.is_active ? (
                        <button className="btn btn-ghost btn-sm" title="Deactivate"
                          onClick={() => setConfirm({ open: true, type: 'dept-deactivate', id: dept.id, name: dept.name })}>
                          <PowerOff size={13} />
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" title="Activate"
                          onClick={() => setConfirm({ open: true, type: 'dept-activate', id: dept.id, name: dept.name })}>
                          <Power size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ROLES TAB ── */}
      {activeTab === 'roles' && (
        <>
          {roles.length === 0 ? (
            <div className="table-wrapper">
              <div className="empty-state">
                <div className="empty-icon"><Briefcase size={22} /></div>
                <div className="empty-title">No roles yet</div>
                <div className="empty-desc">
                  Create your first role to start defining your recruitment structure.
                  {departments.length === 0 && ' You\'ll need to create a department first.'}
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}
                  onClick={() => {
                    if (departments.length === 0) {
                      switchTab('departments');
                    } else {
                      setRoleModal({ open: true, role: null });
                    }
                  }}>
                  <Plus size={14} /> {departments.length === 0 ? 'Create Department First' : 'Create Role'}
                </button>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Employment</th>
                    <th>Vacancies</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{role.title}</div>
                      </td>
                      <td className="td-muted">{role.department_name}</td>
                      <td className="td-muted">{role.location}</td>
                      <td className="td-muted">{EXP_LABELS[role.experience_level] ?? role.experience_level}</td>
                      <td className="td-muted">{EMP_LABELS[role.employment_type] ?? role.employment_type}</td>
                      <td className="td-muted">{role.vacancy_count}</td>
                      <td>
                        <span className={`badge badge-${role.status.toLowerCase()}`}>
                          <span className="badge-dot" style={{
                            background: role.status === 'DRAFT' ? 'var(--color-text-muted)' : 'var(--color-error)'
                          }} />
                          {role.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-row">
                          <button className="btn btn-ghost btn-sm" title="View"
                            onClick={() => setViewRole(role)}>
                            <Eye size={13} />
                          </button>
                          {role.status !== 'DEACTIVATED' && (
                            <>
                              <button className="btn btn-ghost btn-sm" title="Edit"
                                onClick={() => setRoleModal({ open: true, role })}>
                                <Edit2 size={13} />
                              </button>
                              <button className="btn btn-ghost btn-sm" title="Deactivate"
                                onClick={() => setConfirm({ open: true, type: 'role-deactivate', id: role.id, name: role.title })}>
                                <PowerOff size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ── */}
      {deptModal.open && (
        <DepartmentModal
          dept={deptModal.dept}
          onClose={() => setDeptModal({ open: false, dept: null })}
          onSaved={handleDeptSaved}
        />
      )}

      {roleModal.open && (
        <RoleModal
          role={roleModal.role}
          departments={departments}
          onClose={() => setRoleModal({ open: false, role: null })}
          onSaved={handleRoleSaved}
        />
      )}

      {viewRole && (
        <RoleViewModal
          role={viewRole}
          onClose={() => setViewRole(null)}
          onEdit={() => { setRoleModal({ open: true, role: viewRole }); setViewRole(null); }}
        />
      )}

      {confirm?.open && (
        <ConfirmDialog
          title={
            confirm.type === 'dept-deactivate' ? 'Deactivate Department' :
            confirm.type === 'dept-activate' ? 'Activate Department' :
            'Deactivate Role'
          }
          message={
            confirm.type === 'dept-deactivate'
              ? `Deactivating "${confirm.name}" will prevent new roles from being created under it. Existing roles will remain.`
              : confirm.type === 'dept-activate'
              ? `This will re-activate the "${confirm.name}" department.`
              : `Deactivating "${confirm.name}" will mark it as inactive. You can still view it.`
          }
          confirmLabel={confirm.type === 'dept-activate' ? 'Activate' : 'Deactivate'}
          danger={confirm.type !== 'dept-activate'}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<div className="page-content"><div className="spinner spinner-lg" style={{ color: 'var(--color-brand)', margin: '60px auto' }} /></div>}>
      <DepartmentsPageInner />
    </Suspense>
  );
}
