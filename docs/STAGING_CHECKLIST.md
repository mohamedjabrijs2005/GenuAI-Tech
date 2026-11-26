# GenuAI Staging Deployment Checklist

## 1. Required Environment Variables

### Backend (`backend/.env` / Render)
| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Use live Supabase pooler URL; never `dpg-*` |
| `JWT_SECRET` | Auth token signing key | Strong random secret in production |
| `NODE_ENV` | Runtime mode | `production` (or `staging`) |
| `PORT` | HTTP port | Default `5000` (Render sets automatically) |
| `FRONTEND_URL` | Allowed CORS origin(s) | Comma-separated URLs |

### Frontend (`frontend/.env.local` / Vercel)
| Variable | Purpose | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | e.g. `https://genuai-backend.onrender.com/api` |

## 2. Database Migration & Schema Verification

```bash
cd backend
node src/database/migrate_all.js
node src/database/verify_schema.js
```

Expected: V1–V30 applied cleanly, `analytics_events` and all Phase 1 tables present.

## 3. Core-Flow Automated Tests

```bash
cd backend
node --test tests/coreFlow.test.js
```

Expected: `11/11` tests passing with exit code `0`.

## 4. Frontend Production Build

```bash
cd frontend
npm run build
```

Expected: Next.js build completes with exit code `0` and zero compilation errors.

## 5. Pilot Seed (Staging Only)

```bash
cd backend
npm run seed:pilot
```

## 6. Health Check Verification

```bash
curl -s https://genuai-backend.onrender.com/api/health
```

Expected JSON: `status: "ok"`, `database: "connected"`, `dbConfigured: true`.

## 7. API Smoke Test (Register → Create Vacancy → Submit)

```bash
# 1. Register test company (expects 201)
curl -X POST "$API_URL/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.test","password":"Password@123","firstName":"Smoke","lastName":"Test","role":"COMPANY_OWNER","companyName":"Smoke Co"}'

# 2. Log in and capture token, then create draft vacancy (expects 201)
curl -X POST "$API_URL/vacancies" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Backend Engineer","jobDescription":"Node & Postgres"}'
```
