# GenuAI Pilot Runbook

## 1. Pilot Scope
Controlled pilot with **one real company** (`1` Company Owner, `1+` Recruiters, `N` Candidates, `1` Platform Super Admin) covering the core verified-hiring spine:
- Company onboarding, verification, vacancy creation, rubric checklist generation/approval/locking.
- Candidate vacancy discovery, targeting, skill claim confirmation, evidence submission, and proof coverage.
- Company shortlist review, candidate detail inspection, assessment invitation, interview stage tracking, HR override with immutable reason, and hiring outcome recording.
- Candidate privacy rights (data export, correction, and admin-reviewed deletion requests) and Admin governance (company/vacancy approval, audit logs, privacy requests, system health).

**Out of scope for pilot:** Resume upload/parsing, LLM features, payments/subscriptions, college dashboards.

---

## 2. Pilot Test Accounts & Roles
| Role | Purpose | Portal |
|---|---|---|
| `COMPANY_OWNER` | Full company control, vacancy publishing, checklist lock, team invites, overrides, outcomes | `https://genuai-technologies.vercel.app/company` |
| `COMPANY_RECRUITER` | Shortlist filtering, comparison, candidate review, assessment invite, interview stage, HR overrides, outcomes | `https://genuai-technologies.vercel.app/company` |
| `CANDIDATE` | Browse vacancies, apply/target, confirm skill claims, upload evidence, view coverage/requirements, privacy requests | `https://genuai-technologies.vercel.app/candidate` |
| `SUPER_ADMIN` | Approve companies & vacancies, view platform audit logs, review privacy requests, monitor system health | `https://genuai-technologies.vercel.app/admin` |

*(Use dedicated pilot test accounts provisioned for QA/onboarding only. Never print, store, or expose real passwords, tokens, secrets, or database credentials.)*

### Recruiter-Permitted vs. Owner-Only Actions
| Action | `COMPANY_OWNER` | `COMPANY_RECRUITER` |
|---|---|---|
| View company overview, vacancies, candidates, shortlist, interviews, audit log | Allowed | Allowed |
| Create/edit draft vacancies, generate/edit/approve checklist, submit vacancy | Allowed | Allowed |
| Invite candidate for assessment, update interview stage, apply HR override, record hiring outcome | Allowed | Allowed |
| Update company profile (`PATCH /api/company/profile`) | Allowed | **Blocked (`403`)** |
| Invite/manage team members (`POST /api/company/members/invite`, role/status changes) | Allowed | **Blocked (`403`)** |
| Publish approved vacancy (`POST /api/vacancies/:id/publish`) | Allowed | **Blocked (`403`)** |
| Lock checklist (`POST /api/vacancies/:id/checklist/lock`) & close vacancy (`POST /api/vacancies/:id/close`) | Allowed | **Blocked (`403`)** |

---

## 3. Step-by-Step Pilot Flows

### A. Company Owner Flow (`/company`)
1. **Create Vacancy:** `/company/vacancies` → `POST /api/vacancies`
2. **Generate / Edit Checklist:** Vacancy detail → `POST /api/vacancies/:id/checklist/generate`, `PUT /api/vacancies/:id/checklist/items`
3. **Submit for Approval:** `POST /api/vacancies/:id/submit`
4. **Publish (after Admin approval):** `POST /api/vacancies/:id/publish`
5. **Approve & Lock Checklist:** `POST /api/vacancies/:id/checklist/approve` → `POST /api/vacancies/:id/checklist/lock`
6. **View Interested Candidates & Shortlist:** `/company/candidates` → `GET /api/company/vacancies/:vacancyId/shortlist`
7. **View Candidate Detail & Proof Coverage:** `/company/candidates/:id` → `GET /api/candidates/:appId`
8. **Invite for Assessment:** `POST /api/assessments/company/invite`
9. **Update Interview Stage:** `PATCH /api/company/vacancies/:vacancyId/candidates/:targetId/interview-stage`
10. **Apply HR Override (with reason):** `POST /api/company/vacancies/:vacancyId/candidates/:targetId/shortlist-override`
11. **Record Hiring Outcome:** `POST /api/company/vacancies/:vacancyId/candidates/:targetId/hiring-outcome`

### B. Recruiter Flow (`/company`)
1. Access permitted pages: `/company`, `/company/vacancies`, `/company/candidates`, `/company/interviews`, `/company/audit`.
2. Filter and compare shortlisted candidates, invite for assessment, update interview stage, apply HR override with reason, and record hiring outcome.
3. **Verify RBAC:** Owner-only actions (`PATCH /api/company/profile`, `POST /api/company/members/invite`, `POST /api/vacancies/:id/publish`, `POST /api/vacancies/:id/checklist/lock`) return `403`.
4. Verify permitted actions appear in `/company/audit` (`GET /api/reports/audit`).

### C. Candidate Flow (`/candidate`)
1. **Browse Vacancies:** `/candidate/vacancies` → `GET /api/candidate-portal/vacancies`
2. **Apply / Target Vacancy:** `POST /api/candidate-portal/targets`
3. **View Requirements:** `/candidate/targets/:id/requirements` → `GET /api/candidate-portal/targets/:id`
4. **Confirm Skill Claims:** `POST /api/candidate/skill-claims`, `PATCH /api/candidate/skill-claims/:claimId/confirm`
5. **Add Evidence:** `/candidate/targets/:id/evidence` → `POST /api/candidate-portal/targets/:targetId/evidence`
6. **View Proof Coverage:** `/candidate/targets/:id/coverage` → `GET /api/candidate-portal/targets/:targetId/coverage`
7. **Check Application Status:** `/candidate/targets` → `GET /api/candidate-portal/targets`
8. **Privacy Rights:** `/candidate/privacy` → `GET /api/candidate-portal/privacy-export`, `POST /api/candidate-portal/privacy-requests` (`CORRECTION` / `DELETION`).
   > **Note on Deletion:** Candidate deletion (`DELETION`) creates a privacy request reviewed by Platform Admin (`GET /api/admin/privacy-requests` → `PATCH /api/admin/privacy-requests/:id`), **not** an immediate irreversible hard deletion.
9. **Isolation:** Company (`/api/company/*`) and Admin (`/api/admin/*`) endpoints return `403`.

### D. Admin Flow (`/admin`)
1. **Approve Company & Vacancy:** `/admin/verification/companies`, `/admin/verification/vacancies` → `PATCH /api/admin/companies/:id/status`, `PATCH /api/admin/vacancies/:id/status`
2. **Audit Logs:** `/admin/audit` → `GET /api/admin/audit`
3. **Privacy Requests:** `GET /api/admin/privacy-requests` (and `PATCH /api/admin/privacy-requests/:id`)
4. **System Health:** `/admin/system` → `GET /api/health`
5. **Isolation:** Company-only (`GET /api/company/profile`) and Candidate-only (`GET /api/candidate-portal/targets`) endpoints return `403`.

---

## 4. Expected Audit-Log Events
Every sensitive action must record an audit entry with actor ID/email, action type, entity type & ID, company/candidate context, and timestamp:
- `COMPANY_STATUS_UPDATED`
- `VACANCY_STATUS_UPDATED`
- `VACANCY_SUBMITTED`
- `VACANCY_PUBLISHED`
- `CHECKLIST_APPROVED`
- `CHECKLIST_LOCKED`
- `SHORTLIST_OVERRIDE_RECORDED`
- `INTERVIEW_STAGE_UPDATED`
- `HIRING_OUTCOME_RECORDED`
- `PRIVACY_REQUEST_CREATED`
- `PRIVACY_REQUEST_UPDATED`

---

## 5. Pilot Acceptance Criteria
The system is **READY FOR PILOT** only when all of the following hold on the live deployed product:
1. **Zero P0 or P1 bugs** across Owner, Recruiter, Candidate, and Admin end-to-end flows.
2. **Tenant isolation verified:** Company A cannot access/modify Company B resources; Candidate A cannot access Candidate B applications; cross-role access returns `403`.
3. **Recruiter RBAC enforced:** Owner-only endpoints return `403` for `COMPANY_RECRUITER`.
4. **Audit logging verified:** All 11 expected audit events above are recorded with actor, entity, and timestamp.
5. **UI & Mobile verified:** All core routes load cleanly on desktop (`1280px`) and mobile (`360px`) with zero `5xx` responses and zero horizontal overflow.
6. **Health & Verification:** `GET /api/health` returns `status: ok`, `database: connected`, `migrationCount: 32`; backend tests and frontend build pass.

---

## 6. Pilot Incident Severity Guide
| Severity | Definition | Response |
|---|---|---|
| **P0** | Blocks workflow, crash (`5xx`), security issue, tenant leak, incorrect proof calculation, or audit failure | **Stop pilot onboarding; fix, test, deploy, and re-verify before continuing** |
| **P1** | Prevents a core user from completing a task or creates severe workflow confusion | **Fix before pilot go-live; verify on live site** |
| **P2** | UI/UX polish, loading state, empty state, or non-blocking mobile layout issue | **Track for post-pilot sprint (acceptable if workaround exists)** |
| **P3** | Optional improvement or enhancement | **Backlog** |

---

## 7. Known Limitations
- Legacy `/dashboard/*` URLs redirect (HTTP `307`) to `/company/*` for backward compatibility; all new links use `/company/*`.
- Non-core routes (`/candidate/subscription`, `/candidate/accessibility`, `/candidate/targets/[id]/interview`, `/company/intelligence`, `/company/subscription`, `/company/agreement`, `/admin/disputes`, `/admin/settings`) are hidden from sidebar navigation.
- Render Free Tier backend may take 30–50s on cold start if idle (frontend axios timeout is 60s with retry).

---

## 8. Rollback Plan
1. **Frontend (Vercel):** In Vercel Dashboard (`genuai-technologies`), promote the previous known-good deployment to Production, or `git revert <commit> && git push origin main`.
2. **Backend (Render):** In Render Dashboard (`genuai-backend`), trigger **Manual Deploy → Deploy specific commit** to the previous stable commit. Do **not** drop migrations or Release 2 tables.

---

## 9. Support Contact Process
1. Capture the failing URL, user role, timestamp, and browser Network/Console error.
2. Check `GET https://genuai-backend.onrender.com/api/health` (`status: ok`, `database: connected`, `migrationCount: 32`).
3. Inspect `/admin/audit` or `/company/audit` for the actor's recent actions.
4. Escalate P0/P1 incidents (auth failure, `5xx` errors, tenant isolation issues) to the engineering lead with the request ID and audit log timestamp.
