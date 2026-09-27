'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BrainCircuit, Sparkles, Building2, ShieldCheck, Layers, Target, CheckCircle2,
  HelpCircle, ArrowRight, Lock, AlertCircle, Info, RefreshCw, BarChart2
} from 'lucide-react';

interface AssessmentArea {
  id: string;
  name: string;
  category: string;
  frequency: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}

const ROLE_DATA: Record<string, {
  commonAreas: AssessmentArea[];
  companySpecific: { skill: string; type: string }[];
  aggregatedSample: { skill: string; frequency: string }[];
}> = {
  'Software Developer': {
    commonAreas: [
      { id: 'AREA-01', name: 'Core Programming', category: 'Technical', frequency: '98%', priority: 'High', description: 'Core language proficiency (Java, Python, C++ syntax, OOP, Memory allocation)' },
      { id: 'AREA-02', name: 'Data Structures & Algorithms', category: 'Technical', frequency: '95%', priority: 'High', description: 'Trees, Graphs, Sorting, Time & Space Complexity Analysis' },
      { id: 'AREA-03', name: 'SQL & Database Architecture', category: 'Technical', frequency: '92%', priority: 'Medium', description: 'Complex Joins, Indexing, Query Optimization & Schema Design' },
      { id: 'AREA-04', name: 'Systemic Problem Solving', category: 'Problem Solving', frequency: '89%', priority: 'High', description: 'Algorithmic debugging, edge-case analysis, logic reasoning' },
      { id: 'AREA-05', name: 'CS Fundamentals', category: 'Technical', frequency: '84%', priority: 'Medium', description: 'Operating System concepts, Networking basics, Concurrency' },
      { id: 'AREA-06', name: 'Technical Aptitude', category: 'Aptitude', frequency: '78%', priority: 'Medium', description: 'Quantitative reasoning, spatial logic, analytical puzzle solving' },
      { id: 'AREA-07', name: 'Technical Communication', category: 'Communication', frequency: '72%', priority: 'Medium', description: 'Explanation clarity, architectural rationale, team communication' },
    ],
    companySpecific: [
      { skill: 'Advanced Java Spring Boot & Microservices', type: 'Required' },
      { skill: 'PostgreSQL & Complex SQL Design', type: 'Required' },
      { skill: 'AWS Cloud Infrastructure', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'Core Programming (Java / Python / C++)', frequency: '98% Frequency' },
      { skill: 'Data Structures & Algorithms', frequency: '95% Frequency' },
      { skill: 'Relational SQL Databases', frequency: '92% Frequency' },
    ],
  },
  'Product Designer': {
    commonAreas: [
      { id: 'AREA-01', name: 'UI & Visual Design Systems', category: 'Design', frequency: '97%', priority: 'High', description: 'Figma mastery, design tokens, component architecture, responsive grid layout' },
      { id: 'AREA-02', name: 'User Experience & Wireframing', category: 'UX', frequency: '94%', priority: 'High', description: 'User flows, information architecture, low/high-fidelity wireframes' },
      { id: 'AREA-03', name: 'Interactive Prototyping', category: 'Design', frequency: '91%', priority: 'Medium', description: 'Micro-interactions, clickable prototypes, developer handoff specs' },
      { id: 'AREA-04', name: 'UX Research & Usability Testing', category: 'Research', frequency: '88%', priority: 'High', description: 'User interviews, usability heuristics, customer journey mapping' },
      { id: 'AREA-05', name: 'Design System Governance', category: 'Design', frequency: '82%', priority: 'Medium', description: 'Component lifecycle, design tokens, multi-platform consistency' },
      { id: 'AREA-06', name: 'Design Communication', category: 'Communication', frequency: '79%', priority: 'Medium', description: 'Presenting design rationale to product managers and engineers' },
    ],
    companySpecific: [
      { skill: 'Figma Design System Mastery', type: 'Required' },
      { skill: 'B2B SaaS Dashboard UI Design', type: 'Required' },
      { skill: 'Framer / Motion Micro-Interactions', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'UI & Design Systems (Figma)', frequency: '97% Frequency' },
      { skill: 'User Experience & Wireframing', frequency: '94% Frequency' },
      { skill: 'Interactive Prototyping', frequency: '91% Frequency' },
    ],
  },
  'Data Analyst': {
    commonAreas: [
      { id: 'AREA-01', name: 'Advanced SQL & Data Querying', category: 'Data', frequency: '99%', priority: 'High', description: 'Window functions, CTEs, complex aggregations, query optimization' },
      { id: 'AREA-02', name: 'Python for Data Analysis', category: 'Programming', frequency: '93%', priority: 'High', description: 'Pandas, NumPy, data cleaning, automated pipeline scripting' },
      { id: 'AREA-03', name: 'BI & Dashboard Visualization', category: 'Visualization', frequency: '91%', priority: 'Medium', description: 'PowerBI / Tableau, metric definitions, KPI reporting dashboards' },
      { id: 'AREA-04', name: 'Statistical Analysis & Modeling', category: 'Math', frequency: '86%', priority: 'Medium', description: 'Probability, hypothesis testing, regression analysis' },
      { id: 'AREA-05', name: 'Business Acumen & Storytelling', category: 'Communication', frequency: '80%', priority: 'Medium', description: 'Translating data insights into executive business decisions' },
    ],
    companySpecific: [
      { skill: 'PostgreSQL & Window Functions', type: 'Required' },
      { skill: 'Python / Pandas Data Analysis', type: 'Required' },
      { skill: 'Tableau Executive Reporting', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'Advanced SQL Querying', frequency: '99% Frequency' },
      { skill: 'Python Data Analysis', frequency: '93% Frequency' },
      { skill: 'BI Dashboard Visualization', frequency: '91% Frequency' },
    ],
  },
  'DevOps Engineer': {
    commonAreas: [
      { id: 'AREA-01', name: 'CI/CD Pipelines & Automation', category: 'DevOps', frequency: '98%', priority: 'High', description: 'GitHub Actions, GitLab CI, automated test/build/deploy pipelines' },
      { id: 'AREA-02', name: 'Docker & Containerization', category: 'Infrastructure', frequency: '96%', priority: 'High', description: 'Dockerfile optimization, multi-stage builds, container security' },
      { id: 'AREA-03', name: 'Kubernetes Orchestration', category: 'Infrastructure', frequency: '93%', priority: 'High', description: 'Deployments, Services, Ingress, Helm charts, cluster operations' },
      { id: 'AREA-04', name: 'Infrastructure as Code (IaC)', category: 'Cloud', frequency: '90%', priority: 'Medium', description: 'Terraform, CloudFormation, declarative cloud provisioning' },
      { id: 'AREA-05', name: 'Cloud Platform Architecture', category: 'Cloud', frequency: '87%', priority: 'Medium', description: 'AWS / GCP / Azure compute, networking, IAM security policies' },
      { id: 'AREA-06', name: 'Monitoring & Observability', category: 'Operations', frequency: '82%', priority: 'Medium', description: 'Prometheus, Grafana, ELK Stack, log aggregation' },
    ],
    companySpecific: [
      { skill: 'Docker & Kubernetes Cluster Admin', type: 'Required' },
      { skill: 'Terraform IaC for AWS', type: 'Required' },
      { skill: 'Prometheus & Grafana Observability', type: 'Preferred' },
    ],
    aggregatedSample: [
      { skill: 'CI/CD Pipelines & Automation', frequency: '98% Frequency' },
      { skill: 'Docker Containerization', frequency: '96% Frequency' },
      { skill: 'Kubernetes Orchestration', frequency: '93% Frequency' },
    ],
  },
};

const PARTICIPATING_DEMO_COMPANIES = [
  { name: 'Zoho Corporation', role: 'Software Developer', metadataShared: true },
  { name: 'Accenture Technology', role: 'Software Engineer', metadataShared: true },
  { name: 'Cognifyz Technologies', role: 'Software Developer', metadataShared: true },
  { name: 'ABC Technologies (Your Company)', role: 'Senior Software Developer', metadataShared: true },
];

export default function RoleIntelligencePage() {
  const [selectedRole, setSelectedRole] = useState('Software Developer');
  const roleInfo = ROLE_DATA[selectedRole] || ROLE_DATA['Software Developer'];

  return (
    <div className="page-content" style={{ maxWidth: 1300 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="breadcrumbs">
          <Link href="/dashboard/intelligence" className="hover:text-primary">Intelligence</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Cross-Company Role Intelligence</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title flex items-center gap-3">
              Cross-Company Role Intelligence Engine
              <span className="gold-badge">
                <Sparkles size={12} />
                Aggregated Metadata Layer
              </span>
            </h1>
            <p className="page-subtitle">
              Normalized requirement intelligence synthesized from participating company metadata.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="gold-badge flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold" style={{ background: '#fffbeb', border: '1px solid rgba(212,175,55,0.4)', color: '#854d0e' }}>
              <ShieldCheck size={14} className="text-amber-700" />
              Row-Level Tenant Isolation Active
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Notice Header */}
      <div className="p-4 bg-amber-50/80 border border-amber-300/90 rounded-xl mb-6 flex items-start gap-3">
        <Info size={18} className="text-amber-800 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong>Privacy Boundary Notice:</strong> Role Intelligence is derived <em>strictly</em> from non-confidential requirement metadata (skill names, priorities, required/preferred tags, assessment categories) authorized under <strong>Permission B</strong>. Proprietary company question banks, confidential test contents, and individual candidate evaluation results are <strong>NEVER</strong> accessed, copied, or shared across companies.
        </div>
      </div>

      {/* Target Role Selector & Normalization Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Left Card: Target Role Category & Metadata Sources (4 cols on desktop) */}
        <div className="card lg:col-span-4 flex flex-col justify-between" style={{ padding: '20px 22px' }}>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Target Role Category
            </div>
            <select
              className="form-select font-bold text-slate-900 w-full mb-4"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              <option>Software Developer</option>
              <option>Product Designer</option>
              <option>Data Analyst</option>
              <option>DevOps Engineer</option>
            </select>

            <div className="pt-3 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-2.5">
                Participating Metadata Sources
              </div>
              <div className="space-y-2">
                {PARTICIPATING_DEMO_COMPANIES.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs py-1">
                    <span className={`font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${c.name.includes('Your Company') ? 'text-amber-800 font-bold' : 'text-slate-700'}`}>
                      {c.name}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                      Shared
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Normalization Pipeline (8 cols on desktop) */}
        <div className="card lg:col-span-8 flex flex-col justify-between" style={{ padding: '20px 24px' }}>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Role Requirement Normalization Pipeline</span>
              <span className="badge badge-gray text-[10px]">Realtime Aggregation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900 mb-1">1. Metadata</div>
                <div className="text-[11px] text-slate-500">4 Companies</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900 mb-1">2. Normalize</div>
                <div className="text-[11px] text-slate-500">Synonym Mapping</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900 mb-1">3. Frequency</div>
                <div className="text-[11px] text-slate-500">Weight Analysis</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-bold">
                <div className="mb-1">4. Core Set</div>
                <div className="text-[11px] text-amber-700 font-semibold">{roleInfo.commonAreas.length} Common Areas</div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="leading-normal">
              Labeling Standard: <strong>"Aggregated role intelligence"</strong> (Derived from participating company requirement metadata).
            </span>
            <span className="text-amber-800 font-bold flex items-center gap-1 text-xs whitespace-nowrap">
              <RefreshCw size={12} className="animate-spin" /> Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Top Assessment Areas Set */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h2 className="card-title flex items-center gap-2">
              <BarChart2 size={18} className="text-amber-600" />
              Core Assessment Coverage Set for "{selectedRole}"
            </h2>
            <p className="card-subtitle">
              The normalized top assessment areas supported by cross-company metadata frequency analysis.
            </p>
          </div>
          <span className="badge badge-gold font-bold">
            {roleInfo.commonAreas.length} Core Assessment Areas Identified
          </span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Area Code</th>
                <th>Assessment Area</th>
                <th>Category</th>
                <th>Cross-Company Frequency</th>
                <th>Typical Priority</th>
                <th>Area Scope & Assessment Focus</th>
                <th>Your Company Status</th>
              </tr>
            </thead>
            <tbody>
              {roleInfo.commonAreas.map(area => (
                <tr key={area.id}>
                  <td className="td-mono font-bold text-amber-800">{area.id}</td>
                  <td className="font-bold text-slate-900">{area.name}</td>
                  <td><span className="badge badge-gray">{area.category}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full" style={{ width: area.frequency }} />
                      </div>
                      <span className="td-mono font-bold text-xs">{area.frequency}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${area.priority === 'High' ? 'badge-yellow' : 'badge-gray'}`}>
                      {area.priority}
                    </span>
                  </td>
                  <td className="td-muted text-xs font-medium" style={{ whiteSpace: 'normal', maxWidth: 320 }}>
                    {area.description}
                  </td>
                  <td>
                    <span className="badge badge-green flex items-center gap-1 text-xs font-semibold">
                      <CheckCircle2 size={12} /> Configured in Vacancy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specific Company vs Generic Role Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-amber-200 bg-amber-50/20">
          <div className="card-header">
            <div>
              <h3 className="card-title text-amber-900 flex items-center gap-2">
                <Building2 size={16} />
                ABC Technologies (Your Company Specifics)
              </h3>
              <p className="card-subtitle">Company-specific verified vacancy requirements.</p>
            </div>
            <span className="badge badge-gold">Private & Specific</span>
          </div>

          <ul className="space-y-2 text-xs">
            {roleInfo.companySpecific.map((item, i) => (
              <li key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between font-bold text-slate-800">
                <span>{item.skill}</span>
                <span className={`badge ${item.type === 'Required' ? 'badge-red' : 'badge-blue'}`}>
                  {item.type}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-blue-200 bg-blue-50/20">
          <div className="card-header">
            <div>
              <h3 className="card-title text-blue-900 flex items-center gap-2">
                <BrainCircuit size={16} />
                Aggregated Role Intelligence (Cross-Company)
              </h3>
              <p className="card-subtitle">Generic baseline expectations across participating companies.</p>
            </div>
            <span className="badge badge-blue">Aggregated Metadata</span>
          </div>

          <ul className="space-y-2 text-xs">
            {roleInfo.aggregatedSample.map((item, i) => (
              <li key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between font-medium text-slate-700">
                <span>{item.skill}</span>
                <span className="td-mono font-bold text-slate-900">{item.frequency}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
