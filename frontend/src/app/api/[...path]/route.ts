import { NextRequest, NextResponse } from 'next/server';

// In-memory store (migrated from Express + PostgreSQL backend for single-port AI Studio runtime)
interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface CompanyRecord {
  id: string;
  name: string;
  industry: string;
  description: string;
  size: string;
  website: string;
  official_email: string;
  location: string;
  hiring_contact_name: string;
  hiring_contact_email: string;
  hiring_contact_phone: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

interface DepartmentRecord {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoleRecord {
  id: string;
  title: string;
  department_id: string;
  job_description: string;
  experience_level: string;
  employment_type: string;
  location: string;
  vacancy_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const nowIso = () => new Date().toISOString();

let currentUser: UserRecord = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'sarah@acme.example.com',
  firstName: 'Sarah',
  lastName: 'Connor',
  role: 'company_admin',
};

let currentCompany: CompanyRecord = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Acme Technologies Ltd.',
  industry: 'Enterprise Software & Artificial Intelligence',
  description:
    'Acme Technologies builds enterprise software solutions for mid-market companies. We specialize in cloud infrastructure, data platforms, and AI-driven products.',
  size: '51-200',
  website: 'https://acme.example.com',
  official_email: 'hr@acme.example.com',
  location: 'London, United Kingdom',
  hiring_contact_name: 'Sarah Connor',
  hiring_contact_email: 'sarah@acme.example.com',
  hiring_contact_phone: '+44 20 1234 5678',
  verification_status: 'VERIFIED',
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
};

const departments: DepartmentRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Engineering',
    description: 'Core software engineering, platform architecture, and infrastructure.',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Design',
    description: 'Product design, UX research, and design systems.',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Data & Analytics',
    description: 'Data engineering, BI analytics, and machine learning pipelines.',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
];

const roles: RoleRecord[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Software Developer',
    department_id: '11111111-1111-4111-8111-111111111111',
    job_description:
      'Design and build scalable backend services using Java, SQL, and cloud-native microservices architecture.',
    experience_level: 'mid',
    employment_type: 'full_time',
    location: 'London, UK / Hybrid',
    vacancy_count: 3,
    status: 'ACTIVE',
    created_at: '2026-09-10T00:00:00.000Z',
    updated_at: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Product Designer',
    department_id: '22222222-2222-4222-8222-222222222222',
    job_description:
      'Lead end-to-end UX research, wireframing, interactive prototyping, and Figma design system governance.',
    experience_level: 'mid',
    employment_type: 'full_time',
    location: 'Remote',
    vacancy_count: 2,
    status: 'ACTIVE',
    created_at: '2026-09-14T00:00:00.000Z',
    updated_at: '2026-09-14T00:00:00.000Z',
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    title: 'Data Engineer',
    department_id: '33333333-3333-4333-8333-333333333333',
    job_description:
      'Architect and maintain high-throughput data pipelines, SQL analytical models, and warehouse infrastructure.',
    experience_level: 'senior',
    employment_type: 'full_time',
    location: 'London, UK',
    vacancy_count: 1,
    status: 'DRAFT',
    created_at: '2026-09-18T00:00:00.000Z',
    updated_at: '2026-09-18T00:00:00.000Z',
  },
];

function formatDepartment(dept: DepartmentRecord) {
  const activeRoleCount = roles.filter(
    (r) => r.department_id === dept.id && r.status !== 'DEACTIVATED'
  ).length;
  return {
    ...dept,
    role_count: String(activeRoleCount),
  };
}

function formatRole(role: RoleRecord) {
  const dept = departments.find((d) => d.id === role.department_id);
  return {
    ...role,
    department_name: dept?.name || 'General',
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const route = '/' + (path || []).join('/');

  if (route === '/health') {
    return NextResponse.json({
      status: 'ok',
      service: 'GenuAI API',
      timestamp: nowIso(),
    });
  }

  if (route === '/auth/me') {
    return NextResponse.json({
      user: currentUser,
      company: {
        id: currentCompany.id,
        name: currentCompany.name,
        verificationStatus: currentCompany.verification_status,
      },
    });
  }

  if (route === '/company') {
    return NextResponse.json({ company: currentCompany });
  }

  if (route === '/company/overview') {
    const activeDepts = departments.filter((d) => d.is_active).length;
    const nonDeactivatedRoles = roles.filter((r) => r.status !== 'DEACTIVATED');
    const draftRoles = nonDeactivatedRoles.filter((r) => r.status === 'DRAFT').length;
    return NextResponse.json({
      verificationStatus: currentCompany.verification_status,
      departmentCount: activeDepts,
      roleCount: nonDeactivatedRoles.length,
      draftRoleCount: draftRoles,
    });
  }

  if (route === '/departments') {
    const sorted = [...departments]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(formatDepartment);
    return NextResponse.json({ departments: sorted });
  }

  if (path[0] === 'departments' && path.length === 2) {
    const dept = departments.find((d) => d.id === path[1]);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ department: formatDepartment(dept) });
  }

  if (route === '/roles') {
    return NextResponse.json({ roles: roles.map(formatRole) });
  }

  if (path[0] === 'roles' && path.length === 2) {
    const role = roles.find((r) => r.id === path[1]);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ role: formatRole(role) });
  }

  return NextResponse.json({ error: `Route GET ${route} not found` }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const route = '/' + (path || []).join('/');
  const body = await req.json().catch(() => ({}));

  if (route === '/auth/register') {
    const { firstName, lastName, email, password, companyName } = body;
    const errors: { path: string; msg: string }[] = [];
    if (!firstName?.trim()) errors.push({ path: 'firstName', msg: 'First name is required' });
    if (!lastName?.trim()) errors.push({ path: 'lastName', msg: 'Last name is required' });
    if (!email?.trim()) errors.push({ path: 'email', msg: 'Valid email is required' });
    if (!password || password.length < 8) {
      errors.push({ path: 'password', msg: 'Password must be at least 8 characters' });
    }
    if (!companyName?.trim()) errors.push({ path: 'companyName', msg: 'Company name is required' });

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    currentUser = {
      id: crypto.randomUUID(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'company_admin',
    };
    currentCompany = {
      ...currentCompany,
      id: crypto.randomUUID(),
      name: companyName.trim(),
      verification_status: 'VERIFIED',
      updated_at: nowIso(),
    };

    return NextResponse.json(
      {
        token: 'mock-jwt-token-genuai',
        user: currentUser,
        company: {
          id: currentCompany.id,
          name: currentCompany.name,
          verificationStatus: currentCompany.verification_status,
        },
      },
      { status: 201 }
    );
  }

  if (route === '/auth/login') {
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 422 });
    }
    currentUser = {
      ...currentUser,
      email: email.trim(),
    };
    return NextResponse.json({
      token: 'mock-jwt-token-genuai',
      user: currentUser,
      company: {
        id: currentCompany.id,
        name: currentCompany.name,
        verificationStatus: currentCompany.verification_status,
      },
    });
  }

  if (route === '/departments') {
    const name = body.name?.trim();
    const description = body.description?.trim() || '';
    if (!name) {
      return NextResponse.json(
        { errors: [{ path: 'name', msg: 'Department name is required' }] },
        { status: 422 }
      );
    }
    if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { error: 'A department with this name already exists' },
        { status: 409 }
      );
    }
    const newDept: DepartmentRecord = {
      id: crypto.randomUUID(),
      name,
      description,
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    departments.push(newDept);
    return NextResponse.json({ department: formatDepartment(newDept) }, { status: 201 });
  }

  if (route === '/roles') {
    const {
      title,
      departmentId,
      jobDescription,
      experienceLevel,
      employmentType,
      location,
      vacancyCount,
    } = body;
    const dept = departments.find((d) => d.id === departmentId && d.is_active);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found or inactive' }, { status: 404 });
    }
    const newRole: RoleRecord = {
      id: crypto.randomUUID(),
      title: title?.trim() || 'Untitled Role',
      department_id: departmentId,
      job_description: jobDescription?.trim() || '',
      experience_level: experienceLevel || 'mid',
      employment_type: employmentType || 'full_time',
      location: location?.trim() || 'Remote',
      vacancy_count: Number(vacancyCount) || 1,
      status: 'DRAFT',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    roles.unshift(newRole);
    return NextResponse.json({ role: formatRole(newRole) }, { status: 201 });
  }

  return NextResponse.json({ error: `Route POST ${route} not found` }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const route = '/' + (path || []).join('/');
  const body = await req.json().catch(() => ({}));

  if (route === '/company') {
    currentCompany = {
      ...currentCompany,
      name: body.name ?? currentCompany.name,
      industry: body.industry ?? currentCompany.industry,
      description: body.description ?? currentCompany.description,
      size: body.size ?? currentCompany.size,
      website: body.website ?? currentCompany.website,
      official_email: body.officialEmail ?? currentCompany.official_email,
      location: body.location ?? currentCompany.location,
      hiring_contact_name: body.hiringContactName ?? currentCompany.hiring_contact_name,
      hiring_contact_email: body.hiringContactEmail ?? currentCompany.hiring_contact_email,
      hiring_contact_phone: body.hiringContactPhone ?? currentCompany.hiring_contact_phone,
      updated_at: nowIso(),
    };
    return NextResponse.json({ company: currentCompany });
  }

  // PATCH /api/departments/:id/deactivate or /activate
  if (path[0] === 'departments' && path.length === 3) {
    const dept = departments.find((d) => d.id === path[1]);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    if (path[2] === 'deactivate') {
      dept.is_active = false;
      dept.updated_at = nowIso();
      return NextResponse.json({ department: formatDepartment(dept) });
    }
    if (path[2] === 'activate') {
      dept.is_active = true;
      dept.updated_at = nowIso();
      return NextResponse.json({ department: formatDepartment(dept) });
    }
  }

  // PATCH /api/departments/:id
  if (path[0] === 'departments' && path.length === 2) {
    const dept = departments.find((d) => d.id === path[1]);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    if (body.name !== undefined) dept.name = body.name.trim();
    if (body.description !== undefined) dept.description = body.description.trim();
    dept.updated_at = nowIso();
    return NextResponse.json({ department: formatDepartment(dept) });
  }

  // PATCH /api/roles/:id/deactivate
  if (path[0] === 'roles' && path.length === 3 && path[2] === 'deactivate') {
    const role = roles.find((r) => r.id === path[1]);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    role.status = 'DEACTIVATED';
    role.updated_at = nowIso();
    return NextResponse.json({ role: formatRole(role) });
  }

  // PATCH /api/roles/:id
  if (path[0] === 'roles' && path.length === 2) {
    const role = roles.find((r) => r.id === path[1]);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    if (body.title !== undefined) role.title = body.title.trim();
    if (body.departmentId !== undefined) role.department_id = body.departmentId;
    if (body.jobDescription !== undefined) role.job_description = body.jobDescription.trim();
    if (body.experienceLevel !== undefined) role.experience_level = body.experienceLevel;
    if (body.employmentType !== undefined) role.employment_type = body.employmentType;
    if (body.location !== undefined) role.location = body.location.trim();
    if (body.vacancyCount !== undefined) role.vacancy_count = Number(body.vacancyCount);
    role.updated_at = nowIso();
    return NextResponse.json({ role: formatRole(role) });
  }

  return NextResponse.json({ error: `Route PATCH ${route} not found` }, { status: 404 });
}
