# GenuAI Phase 1 Pilot Manual QA Checklist

Verify the end-to-end proof-shortlist loop on staging with 1 test company and 3–5 candidates.

## Core End-to-End Flow

- [ ] **1. Company signs up & onboards** — Register `COMPANY_OWNER`, submit onboarding details.
- [ ] **2. Admin approves company** — Super Admin approves the company in `/admin`; status becomes `APPROVED`.
- [ ] **3. Company creates vacancy** — Create a new vacancy in `/dashboard/vacancies`; initial status is `DRAFT`.
- [ ] **4. Company generates checklist** — Open vacancy **Skill Checklist & Matrix** tab and click Generate Checklist; requirements populate.
- [ ] **5. HR edits and approves checklist** — Adjust must-have / good-to-have skills or weights, click **Approve Checklist**.
- [ ] **6. HR locks checklist** — Click **Lock Checklist**; items become read-only and `checklistStatus` is `locked`.
- [ ] **7. Admin approves vacancy** — Submit vacancy for review; Admin approves it.
- [ ] **8. Company publishes vacancy** — Publish vacancy; status becomes `PUBLISHED`.
- [ ] **9. Candidate applies (creates target)** — Candidate logs in, finds the published vacancy, and creates a target (`/candidate/targets/:id`).
- [ ] **10. Candidate confirms skill claims** — In the target detail page, add and confirm skill claims (`POST /api/candidate/skill-claims`).
- [ ] **11. GenuAI computes proof levels** — Verify each skill transitions cleanly across `claimed` / `assessed` / `verified` / `missing` / `trainable`.
- [ ] **12. HR views explainable shortlist** — Open `/dashboard/vacancies/:id/readiness`; confirm candidates, per-skill proof matrix, missing skills, trainable gaps, and interview focus appear.
- [ ] **13. HR overrides one candidate ranking** — Use inline HR override on one candidate with a reason; verify rank order updates and persists on reload.
- [ ] **14. HR records hiring outcome** — Record `Rejected`, `Offered`, `Joined`, or `On Hold` on a shortlisted candidate; verify persistence and audit log entry.

## Tenant Isolation & Security Checks

- [ ] **Candidate A cannot access Candidate B's data** — Calling `GET /api/candidate-portal/targets/:targetB` or skill-claims with Candidate A's JWT returns `403` / `404`.
- [ ] **Company A cannot access Company B's data** — Calling `GET /api/company/vacancies/:vacancyB/shortlist` or checklist endpoints with Company A's JWT returns `404` / `403`.
- [ ] **Audit & Analytics verification** — Check `/dashboard/audit` and `GET /api/admin/analytics/pilot-funnel` show recorded actions and funnel counts.
