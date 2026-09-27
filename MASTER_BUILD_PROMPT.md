# GenuAI Company Dashboard — Master Build Prompt & Product Specification

**PROJECT NAME:**  
GenuAI Technologies — Company Recruitment Intelligence Dashboard

**PRODUCT POSITIONING:**  
GenuAI is an evidence-centered recruitment intelligence platform built around role requirements.

**Company flow:**  
`DEFINE → ASSESS → EVIDENCE → REVIEW → HIRE`

**Candidate flow:**  
`SELECT COMPANY → SELECT VACANCY → TARGET → LEARN → PRACTICE → CANDIDATE VERIFICATION → OFFICIAL RECRUITMENT ASSESSMENT → EVIDENCE`

**Core principle:**  
One Vacancy → Defined Role Requirements → Structured Assessment → Requirement-Level Evidence → Evidence Coverage/Gaps → Recruiter Intelligence → Human Review → Human Hiring Decision

---

### CRITICAL GOVERNANCE & ARCHITECTURAL PRINCIPLES

1. **NO Autonomous Hiring Decisions:**  
   GenuAI must NOT make autonomous hiring decisions.  
   Do NOT build:
   - "Best Candidate"
   - "Recommended Candidate"
   - "AI Hire" / "AI Reject"
   - Hidden hiring scores
   - Automatic candidate ranking  
   *GenuAI only structures evidence and intelligence for human recruiter review.*

2. **ROLE INTELLIGENCE vs. PRIVATE ASSESSMENT EVIDENCE:**  
   The cross-company "top 6–7 assessment areas" is a **Role Intelligence layer** derived from **company-shared requirement/assessment metadata** (e.g., skills, priority, required/preferred classification, category mappings), **NOT** a copy of proprietary company question banks or candidate assessment results. Company-specific official assessments remain strictly private to that vacancy/company.

3. **CORE FORMULAS:**  
   - `ASSESSMENT SCORE ≠ EVIDENCE ≠ HIRING DECISION`  
   - `ROLE INTELLIGENCE ≠ COMPANY-SPECIFIC RECRUITMENT EVIDENCE`  

---

```text
PROJECT NAME:
GenuAI Technologies — Company Recruitment Intelligence Dashboard

PRODUCT POSITIONING:
GenuAI is an evidence-centered recruitment intelligence platform built around role requirements.

Company flow:
DEFINE → ASSESS → EVIDENCE → REVIEW → HIRE

Candidate flow:
SELECT COMPANY → SELECT VACANCY → TARGET → LEARN → PRACTICE → CANDIDATE VERIFICATION → OFFICIAL RECRUITMENT ASSESSMENT → EVIDENCE

Core principle:
One Vacancy → Defined Role Requirements → Structured Assessment → Requirement-Level Evidence → Evidence Coverage/Gaps → Recruiter Intelligence → Human Review → Human Hiring Decision

IMPORTANT:
GenuAI must NOT make autonomous hiring decisions.
Do NOT build:
- “Best Candidate”
- “Recommended Candidate”
- “AI Hire”
- “AI Reject”
- hidden hiring score
- automatic candidate ranking

GenuAI only structures evidence and intelligence for human recruiter review.

==================================================
1. PRIMARY TECHNOLOGY STACK
==================================================

Frontend:
- React
- Vite / Next.js
- TypeScript
- HTML5
- CSS3
- Tailwind CSS

UI:
- shadcn/ui
- Radix UI primitives
- Lucide React icons
- Reusable design-system components

State / Data:
- TanStack Query for server state
- React Context only where appropriate for lightweight local app state

Forms / Validation:
- React Hook Form
- Zod

Routing:
- React Router / Next.js App Router

Charts:
- Recharts

Animation:
- Framer Motion / Motion

Backend / Realtime:
- Supabase / PostgreSQL API
  - Authentication
  - PostgreSQL
  - Row Level Security / Tenant Isolation
  - Storage
  - Realtime subscriptions
  - Edge Functions / API endpoints where needed

Deployment:
- Free-tier compatible deployment platform
- Abstracted infrastructure for portability

Development principle:
FREE-TIER-FIRST.
Do not make the core MVP dependent on mandatory paid APIs or paid infrastructure.

Architecture principle:
Use an abstraction layer for AI/model services so an open-source/free model or another provider can be plugged in later.

==================================================
2. DESIGN TOOL / FIGMA DESIGN SYSTEM
==================================================

Design the product in Figma first.
Create a complete professional Figma design system containing:
- Desktop 1440px primary layout
- Laptop 1280px layout
- Tablet responsive layout
- Mobile responsive layout
- Tokens (Typography scale, Spacing, Border radius, Shadows)
- Components (Inputs, Buttons, Cards, Tables, Tabs, Badges, Modals, Drawers, Dropdowns, Tooltips, Toasts, Skeletons, Empty/Loading/Error states, Charts)

Figma pages:
1. Cover / Product Overview
2. Design System
3. Company Overview
4. Vacancies
5. Vacancy Builder
6. Role Requirements
7. Assessment Builder
8. Candidates
9. Candidate Detail
10. Evidence Workspace
11. Evidence Coverage
12. Interviews
13. Integrity Review
14. Recruiter Intelligence
15. Agreements
16. Settings
17. Responsive / Mobile

High-Fidelity Separate Screens:
1. Overview (Recruitment health + action queue + realtime activity)
2. Vacancies (Table + filters + status)
3. Vacancy Builder (Step-by-step creation)
4. Requirements Studio (Groups → requirements → required/preferred → priority → evaluation method)
5. Assessment Studio (Assessment Group → Evaluation Group → Questions/Tasks → mapping)
6. Agreement Center (Recruitment permission + Role Intelligence permission)
7. Candidates (Recruitment pipeline)
8. Candidate Evidence Workspace (Requirements → evidence → coverage → gaps → interview → integrity)
9. Recruiter Intelligence (Requirement-level intelligence and review queue)
10. Role Intelligence (Aggregated metadata across participating companies: Zoho + Accenture + Cognifyz → Software Developer → common assessment coverage)

==================================================
3. VISUAL DIRECTION
==================================================
- Modern enterprise SaaS, clean, trustworthy, premium, data-rich but readable, recruiter-focused.
- Layout: Fixed left sidebar desktop, compact top nav, generous content area spacing, responsive drawer on mobile.
- Colors: Neutral foundation with one strong GenuAI accent color. Semantic colors (success, warning, error, info, neutral) always paired with text/icons.
- Typography: Modern sans-serif, clear hierarchy, strong numerical readability.

==================================================
4. INFORMATION ARCHITECTURE & NAVIGATION
==================================================
Sidebar:
- GenuAI logo
- Overview
- Recruitment: Vacancies, Candidates, Assessments, Interviews
- Intelligence: Evidence, Coverage & Gaps, Recruiter Intelligence, Integrity Review
- Management: Company, Recruiters, Agreements, Reports
- System: Notifications, Settings

==================================================
5. COMPANY PROFILE & RBAC
==================================================
Profile fields: Name, Logo, Email, Website, Industry, Size, Description, HQ, Locations, Contact Person, Recruiter Info.
Verification status: Draft, Submitted, Under Review, Verified, Needs Correction, Rejected. Only verified companies can publish vacancies.
RBAC:
- COMPANY ADMIN: Full company access, manage profile/vacancies/requirements/assessments/recruiters/agreements/reports.
- RECRUITER: Assigned vacancy access, candidates, assessments, evidence review, interview scheduling, notes.
- INTERVIEWER: Assigned interviews, candidate info required for interview, assigned requirement evaluation submission.
*Enforce organization-level tenant isolation (Company A never sees Company B's data).*

==================================================
6. VACANCIES & MULTI-STEP BUILDER
==================================================
Multi-step guided builder:
STEP 1: Basic Role Information
STEP 2: Role Requirements
STEP 3: Requirement Grouping
STEP 4: Assessment Plan
STEP 5: Assessment Grouping
STEP 6: Evaluation Grouping
STEP 7: Assessment Review
STEP 8: Agreement
STEP 9: Submit for Admin Verification

==================================================
7. CORE REQUIREMENT & ASSESSMENT ARCHITECTURE
==================================================
Role Requirements (Core):
Each requirement: Requirement ID, Name, Description, Category, Required/Preferred, Priority (High/Medium/Low), Expected proficiency, Evaluation method, Evidence expectation, Status.

Requirement Evaluation Methods:
- Official Technical Assessment
- Structured Interview
- Project Evaluation
- Credential / Certification
- Candidate Submission
- Resume / Experience Evidence
- Multiple Evidence Sources

Assessment & Evaluation Grouping:
- Assessment Group: Logical evaluation unit (e.g., Technical Assessment covering Java, DSA, SQL). One assessment can cover multiple requirements.
- Evaluation Group: Specific capability evaluated inside assessment (e.g., inside Java Assessment: OOP, Collections, Exception Handling).
- Question/Task Mapping: Question → Evaluation Group → Requirement → Requirement Group → Assessment Group → Vacancy → Vacancy Version.

==================================================
8. RECRUITMENT AGREEMENT (DUAL PERMISSIONS)
==================================================
Explicit "Recruitment Assessment & Evidence Agreement" with TWO SEPARATE PERMISSIONS:
- PERMISSION A (Recruitment Assessment & Result Sharing): Authorizes GenuAI to conduct/manage official recruitment assessment, process results, share with company recruiters, map performance to role requirements.
- PERMISSION B (Aggregated Role Intelligence Contribution): Authorizes GenuAI to use non-confidential role metadata (skills, required/preferred, priority, proficiency, categories) for aggregated role-level intelligence across participating companies.
*Proprietary question banks & candidate results are NEVER used across companies.*

==================================================
9. CROSS-COMPANY ROLE INTELLIGENCE ENGINE
==================================================
Pipeline:
Multiple Companies (Zoho, Accenture, Cognifyz) → Same/Similar Role (Software Developer) → Requirement Normalization → Assessment Category Mapping → Priority/Frequency Analysis → Role Assessment Coverage Set (Top 6–7 Common Assessment Areas).
*Role intelligence is derived strictly from company-shared requirement/assessment METADATA, presented as AGGREGATED ROLE INTELLIGENCE, keeping company-specific official exams private.*

==================================================
10. EVIDENCE MODEL, COVERAGE, GAPS & INTEGRITY
==================================================
- Evidence Record: Candidate ID, Company ID, Vacancy ID, Version, Requirement ID, Source, Result, Timestamp, Status, Integrity context.
- Evidence Coverage: Compare ROLE REQUIREMENTS against AVAILABLE EVIDENCE. (e.g. 4 of 5 requirements have supporting evaluation evidence).
- Evidence Gap: Insufficient supporting evidence for a requirement (does NOT mean candidate lacks skill; indicates need for interview question / project / credential / additional test).
- Integrity Review: Observable signals (tab switch, copy/paste, face missing, multi-person). Displayed as "Integrity Signal Detected — Review Required" (never automated accusations).

==================================================
11. RECRUITER INTELLIGENCE & HUMAN REVIEW WORKSPACE
==================================================
Recruiter Workspace provides comprehensive matrix, evidence map, coverage/gap panel, source panel, activity timeline, and notes.
Final Decisions: Decision Pending, Selected, Not Selected, On Hold, Withdrawn (Human recruiter records decisions; GenuAI never auto-rejects or auto-hires).
```

### CORE TECHNICAL RELATIONSHIPS

```text
Company
   ↓
Vacancy
   ↓
Requirement Groups
   ↓
Requirements
   ↓
Assessment Groups
   ↓
Evaluation Groups
   ↓
Questions / Tasks
   ↓
Candidate Assessment
   ↓
Result
   ↓
Evidence
   ↓
Coverage / Gaps
   ↓
Recruiter Intelligence
   ↓
Human Review
```

**And Separately (Role Intelligence Engine):**

```text
Participating Companies
        ↓
Approved Role Metadata (Shared)
        ↓
Normalization & Frequency Analysis
        ↓
Role Intelligence
        ↓
Common 6–7 Assessment Areas
        ↓
Candidate Preparation / Skill Gap Targeting
```

---

*This specification is frozen and ready for direct execution across coding agents (Cursor, Claude Code, Lovable, Bolt, Antigravity).*
