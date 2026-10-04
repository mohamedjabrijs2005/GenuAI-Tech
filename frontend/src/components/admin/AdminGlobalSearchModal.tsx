'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Briefcase, ClipboardList, Users, ShieldAlert, FileText, X, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminDataService } from '@/lib/adminDataService';

export function AdminGlobalSearchModal() {
  const { isSearchOpen, setIsSearchOpen } = useAdminAuth();
  const [query, setQuery] = useState('');
  const router = useRouter();

  const companies = adminDataService.getCompanies();
  const vacancies = adminDataService.getVacancies();
  const assessments = adminDataService.getAssessments();
  const users = adminDataService.getUsers();
  const disputes = adminDataService.getDisputes();
  const incidents = adminDataService.getIntegrityIncidents();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedCompanies = companies
      .filter((c) => c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .map((c) => ({
        type: 'Company Verification',
        title: c.name,
        subtitle: `${c.domain} • ${c.verificationStatus}`,
        href: `/admin/verification/companies?id=${c.id}`,
        icon: Building2,
      }));

    const matchedVacancies = vacancies
      .filter((v) => v.roleTitle.toLowerCase().includes(q) || v.companyName.toLowerCase().includes(q) || v.id.toLowerCase().includes(q))
      .map((v) => ({
        type: 'Vacancy Governance',
        title: v.roleTitle,
        subtitle: `${v.companyName} • ${v.status}`,
        href: `/admin/verification/vacancies?id=${v.id}`,
        icon: Briefcase,
      }));

    const matchedAssessments = assessments
      .filter((a) => a.title.toLowerCase().includes(q) || a.companyName.toLowerCase().includes(q))
      .map((a) => ({
        type: 'Assessment Governance',
        title: a.title,
        subtitle: `${a.companyName} • ${a.status}`,
        href: `/admin/verification/assessments?id=${a.id}`,
        icon: ClipboardList,
      }));

    const matchedUsers = users
      .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map((u) => ({
        type: 'Platform User',
        title: u.name,
        subtitle: `${u.email} • ${u.userType} • ${u.accountStatus}`,
        href: `/admin/users?email=${encodeURIComponent(u.email)}`,
        icon: Users,
      }));

    const matchedDisputes = disputes
      .filter((d) => d.id.toLowerCase().includes(q) || d.companyName.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))
      .map((d) => ({
        type: 'Dispute Case',
        title: d.id + ': ' + d.type,
        subtitle: `${d.companyName} • ${d.status}`,
        href: `/admin/disputes?id=${d.id}`,
        icon: FileText,
      }));

    const matchedIncidents = incidents
      .filter((i) => i.id.toLowerCase().includes(q) || i.sessionId.toLowerCase().includes(q) || i.companyName.toLowerCase().includes(q))
      .map((i) => ({
        type: 'Integrity Incident',
        title: `${i.id} (${i.candidateMaskedId})`,
        subtitle: `${i.companyName} • ${i.observableStatus}`,
        href: `/admin/integrity?id=${i.id}`,
        icon: ShieldAlert,
      }));

    return [
      ...matchedCompanies,
      ...matchedVacancies,
      ...matchedAssessments,
      ...matchedUsers,
      ...matchedDisputes,
      ...matchedIncidents,
    ].slice(0, 10);
  }, [query, companies, vacancies, assessments, users, disputes, incidents]);

  if (!isSearchOpen) return null;

  const handleSelect = (href: string) => {
    setIsSearchOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      <div
        onClick={() => setIsSearchOpen(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '620px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          zIndex: 10,
          border: '1px solid var(--border)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            gap: '12px',
          }}
        >
          <Search size={18} style={{ color: '#b8860b' }} />
          <input
            type="text"
            autoFocus
            placeholder="Search platform companies, vacancies, assessments, users, disputes, incidents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              background: 'transparent',
            }}
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            style={{
              padding: '4px',
              borderRadius: '4px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {!query.trim() ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Type a company name, domain, vacancy title, case ID, or email address...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No platform records matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((res, i) => {
              const Icon = res.icon;
              return (
                <div
                  key={i}
                  onClick={() => handleSelect(res.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  className="hover:bg-amber-50/60"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#b8860b',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {res.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: '#854d0e' }}>{res.type}</span> • {res.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '8px 16px',
            background: '#f8fafc',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <span>Tip: Press ESC to close</span>
          <span>GenuAI Admin Console Global Search</span>
        </div>
      </div>
    </div>
  );
}
