'use client';

import { useState } from 'react';
import {
  FileText, Download, Filter, Sparkles, CheckCircle2,
  TrendingUp, BarChart2, ShieldCheck, ChevronRight, Share2,
} from 'lucide-react';

const REPORTS = [
  {
    id: 1,
    title: 'Q3 Software Developer Assessment Summary',
    vacancy: 'Software Developer',
    candidatesAssessed: 18,
    evidenceCoverageAvg: '94%',
    integrityScoreAvg: '98%',
    generatedDate: '2026-09-25',
    status: 'Ready',
  },
  {
    id: 2,
    title: 'Senior DevOps Specialist Evidence Audit',
    vacancy: 'Senior DevOps Specialist',
    candidatesAssessed: 6,
    evidenceCoverageAvg: '88%',
    integrityScoreAvg: '95%',
    generatedDate: '2026-09-24',
    status: 'Ready',
  },
  {
    id: 3,
    title: 'AI VIVA Technical Evaluation Digest',
    vacancy: 'Data Engineer',
    candidatesAssessed: 12,
    evidenceCoverageAvg: '91%',
    integrityScoreAvg: '100%',
    generatedDate: '2026-09-22',
    status: 'Ready',
  },
];

export default function ReportsPage() {
  const [reports] = useState(REPORTS);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>GenuAI Intelligence</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Reports</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Recruiter Intelligence Reports
            </h1>
            <p className="page-subtitle">
              Export verified candidate evidence reports and audit summaries for hiring decisions.
            </p>
          </div>
          <button className="btn btn-gold">
            <FileText size={16} />
            Generate New Audit Report
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-card stat-card-gold">
          <div className="stat-icon stat-icon-gold">
            <FileText size={20} />
          </div>
          <div className="stat-label">Total Reports Generated</div>
          <div className="stat-value">24</div>
          <div className="stat-sub">100% verified evidence trail</div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon stat-icon-success">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-label">Avg Candidate Integrity</div>
          <div className="stat-value">97.6%</div>
          <div className="stat-sub">Proctored & AI Verified</div>
        </div>

        <div className="stat-card stat-card-brand">
          <div className="stat-icon stat-icon-brand">
            <TrendingUp size={20} />
          </div>
          <div className="stat-label">Evidence Coverage Rate</div>
          <div className="stat-value">93.2%</div>
          <div className="stat-sub">Across 36 candidates</div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Target Vacancy</th>
              <th>Candidates Assessed</th>
              <th>Evidence Coverage</th>
              <th>Integrity Score</th>
              <th>Generated Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: '#fefce8', border: '1px solid rgba(212,175,55,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#a16207', flexShrink: 0
                      }}
                    >
                      <FileText size={16} style={{ margin: 'auto' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                        {report.title}
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 10, marginTop: 2 }}>
                        <CheckCircle2 size={10} /> Verified Audit
                      </span>
                    </div>
                  </div>
                </td>
                <td className="font-medium">{report.vacancy}</td>
                <td className="td-mono font-semibold">{report.candidatesAssessed}</td>
                <td className="font-semibold text-emerald-600">{report.evidenceCoverageAvg}</td>
                <td className="font-semibold">{report.integrityScoreAvg}</td>
                <td className="td-muted">{report.generatedDate}</td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex items-center justify-end gap-2">
                    <button className="btn btn-secondary btn-sm" title="Share Report">
                      <Share2 size={14} />
                    </button>
                    <button className="btn btn-gold btn-sm">
                      <Download size={14} />
                      Export PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
