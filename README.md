# GenuAI Technologies — Company Dashboard

## Architecture

```
GenuAI-Tech/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── database/
│   │   │   ├── pool.js       # PostgreSQL connection pool
│   │   │   └── migrate.js    # DB migration script
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT auth + tenant isolation
│   │   ├── routes/
│   │   │   ├── auth.js       # Register / Login / Me
│   │   │   ├── company.js    # Company Profile + Overview
│   │   │   ├── departments.js
│   │   │   └── roles.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/         # Next.js 16 (App Router, TypeScript)
    └── src/
        ├── app/
        │   ├── dashboard/
        │   │   ├── page.tsx              # Overview
        │   │   ├── company-profile/      # Company Profile
        │   │   └── departments/          # Departments & Roles
        │   ├── login/
        │   └── register/
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── Topbar.tsx
        │   └── VerificationBadge.tsx
        ├── contexts/AuthContext.tsx
        └── lib/api.ts
```

## Database Tables (Phase 1)

| Table | Purpose |
|-------|---------|
| `users` | Authenticated users |
| `companies` | Company profiles |
| `company_members` | Maps users → companies (tenant isolation) |
| `departments` | Company-scoped departments |
| `company_roles` | Roles under departments |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register user + create company
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current session

### Company (auth required)
- `GET /api/company` — Get profile
- `PATCH /api/company` — Update profile
- `GET /api/company/overview` — Dashboard stats

### Departments (auth + company required)
- `GET /api/departments`
- `POST /api/departments`
- `GET /api/departments/:id`
- `PATCH /api/departments/:id`
- `PATCH /api/departments/:id/deactivate`
- `PATCH /api/departments/:id/activate`

### Roles (auth + company required)
- `GET /api/roles`
- `POST /api/roles`
- `GET /api/roles/:id`
- `PATCH /api/roles/:id`
- `PATCH /api/roles/:id/deactivate`

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm install
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
# .env.local already configured for local dev
npm install
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/genuai
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Security

- JWT-based authentication — token stored in localStorage
- **Company tenant isolation**: `company_id` is always derived from the authenticated JWT, never trusted from request body/query
- Every department and role query is scoped to `company_id` from the server-side session
- Passwords hashed with bcrypt (12 rounds)
- Helmet.js security headers
- CORS restricted to frontend origin

## Verification Status

Companies are created as `UNVERIFIED`. Companies cannot self-verify. Status values: `UNVERIFIED` → `UNDER_REVIEW` → `VERIFIED` / `SUSPENDED`. Admin verification workflow is a future phase.

## Phase 1 Scope

✅ Company registration & login  
✅ Company profile (view + edit)  
✅ Department CRUD (create, edit, activate, deactivate)  
✅ Role CRUD (create, edit, deactivate) under departments  
✅ Role table with all columns  
✅ Overview page with real data only  
✅ Verification status display  
✅ Tenant isolation enforced on every query  
✅ Empty states, loading states, error states  
✅ Confirmation dialogs for destructive actions  

## NOT Implemented (Future Phases)

- Role Requirements
- Assessment Configuration
- Candidate dashboard
- Evidence / Evidence Coverage
- Recruiter Intelligence
- Hiring workflow
- Admin verification
