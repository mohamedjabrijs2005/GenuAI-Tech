const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { recomputeTargetCoverage } = require('./evidenceService');

const router = express.Router();

/**
 * Middleware: Ensure the authenticated user has role = 'CANDIDATE' or 'APPLICANT'
 */
function requireCandidate(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  if (role !== 'CANDIDATE' && role !== 'APPLICANT') {
    return res.status(403).json({ error: 'Forbidden: Requires Candidate account.' });
  }
  next();
}

/**
 * Helper: Calculate Profile Completion Checklist & Percentage
 */
function calculateProfileCompletion(profile) {
  const items = [
    {
      key: 'basic',
      label: 'Basic information (Name, Email, Phone)',
      completed: !!(profile.first_name && profile.last_name && profile.email && profile.phone && profile.phone !== '—'),
    },
    {
      key: 'location',
      label: 'Location',
      completed: !!(profile.location && profile.location !== 'Global' && profile.location.trim() !== ''),
    },
    {
      key: 'resume',
      label: 'Upload resume or CV',
      completed: !!(profile.resume_url && profile.resume_url.trim() !== ''),
    },
    {
      key: 'education',
      label: 'Education background',
      completed: Array.isArray(profile.education) && profile.education.length > 0,
    },
    {
      key: 'skills',
      label: 'General skills checklist',
      completed: Array.isArray(profile.general_skills) && profile.general_skills.length > 0,
    },
    {
      key: 'experience',
      label: 'Experience summary or employment history',
      completed: !!(
        (profile.experience_summary && profile.experience_summary.trim() !== '') ||
        (Array.isArray(profile.employment_history) && profile.employment_history.length > 0)
      ),
    },
    {
      key: 'links',
      label: 'Portfolio, GitHub or LinkedIn link',
      completed: !!(profile.github_url || profile.portfolio_url || profile.linkedin_url),
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const missingItems = items.filter((i) => !i.completed).map((i) => i.label);

  return {
    percentage,
    completedCount,
    totalCount: items.length,
    items,
    missingItems,
  };
}

// ============================================================
// PUBLIC / CANDIDATE VACANCY DISCOVERY
// ============================================================

// GET /api/candidate-portal/vacancies
// Public / candidate discovery: Returns ONLY published vacancies from approved, non-suspended companies
router.get('/vacancies', async (req, res) => {
  try {
    const { search, department, level, workMode } = req.query;

    let query = `
      SELECT cr.id, cr.title, cr.experience_level, cr.employment_type,
             cr.location, cr.work_mode, cr.salary_range, cr.vacancy_count,
             cr.published_at, cr.created_at,
             d.name AS department_name,
             c.id AS company_id, c.name AS company_name, c.verification_status AS company_status,
             vv.id AS vacancy_version_id, vv.version_number,
             COUNT(DISTINCT r.id) AS requirements_count
      FROM company_roles cr
      JOIN companies c ON c.id = cr.company_id
      LEFT JOIN departments d ON d.id = cr.department_id
      LEFT JOIN vacancy_versions vv ON vv.role_id = cr.id AND (vv.status = 'Published' OR vv.status = 'Approved')
      LEFT JOIN requirements r ON r.role_id = cr.id
      WHERE cr.status = 'PUBLISHED'
        AND c.verification_status = 'APPROVED'
        AND c.suspended_at IS NULL
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (cr.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }
    if (department && department !== 'ALL') {
      params.push(department);
      query += ` AND d.name = $${params.length}`;
    }
    if (level && level !== 'ALL') {
      params.push(level);
      query += ` AND cr.experience_level = $${params.length}`;
    }
    if (workMode && workMode !== 'ALL') {
      params.push(workMode);
      query += ` AND cr.work_mode = $${params.length}`;
    }

    query += ` GROUP BY cr.id, d.name, c.id, c.name, c.verification_status, vv.id, vv.version_number ORDER BY cr.published_at DESC NULLS LAST, cr.created_at DESC`;

    const result = await pool.query(query, params);
    return res.json({ vacancies: result.rows });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      return res.json({ vacancies: [] });
    }
    console.error('Candidate vacancies discovery error:', err);
    return res.status(500).json({ error: 'Failed to fetch published vacancies' });
  }
});

// GET /api/candidate-portal/vacancies/:id
// Public / candidate detail view of a verified published vacancy
router.get('/vacancies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(404).json({ error: 'Vacancy not found or is not currently published.' });
    }

    const roleRes = await pool.query(
      `SELECT cr.id, cr.title, cr.job_description, cr.experience_level, cr.employment_type,
              cr.location, cr.work_mode, cr.salary_range, cr.vacancy_count, cr.status,
              cr.published_at, cr.created_at,
              d.name AS department_name,
              c.id AS company_id, c.name AS company_name, c.website AS company_website,
              c.industry AS company_industry, c.description AS company_description,
              c.location AS company_location, c.verification_status AS company_status,
              vv.id AS vacancy_version_id, vv.version_number
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       LEFT JOIN departments d ON d.id = cr.department_id
       LEFT JOIN vacancy_versions vv ON vv.role_id = cr.id AND (vv.status = 'Published' OR vv.status = 'Approved')
       WHERE cr.id = $1
         AND cr.status = 'PUBLISHED'
         AND c.verification_status = 'APPROVED'
         AND c.suspended_at IS NULL`,
      [id]
    );

    if (roleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found or is not currently published.' });
    }

    const vacancy = roleRes.rows[0];

    // Fetch requirements mapped to this vacancy
    const reqRes = await pool.query(
      `SELECT id, name, description, requirement_type, importance, eval_method, evaluation_methods, weight
       FROM requirements
       WHERE role_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return res.json({
      vacancy,
      requirements: reqRes.rows,
    });
  } catch (err) {
    console.error('Candidate vacancy detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancy details' });
  }
});

// ============================================================
// CANDIDATE AUTHENTICATED WORKSPACE ENDPOINTS
// ============================================================

// GET /api/candidate-portal/dashboard
// Honest, action-oriented candidate home metrics
router.get('/dashboard', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query(
      `SELECT id, email, first_name, last_name, phone, location, resume_url, education,
              general_skills, experience_summary, employment_history, github_url, portfolio_url,
              linkedin_url, languages, work_preferences, accessibility_needs, privacy_settings, created_at
       FROM candidates WHERE email = $1`,
      [req.user.email]
    );

    let candidate;
    if (candRes.rowCount === 0) {
      const newCand = await pool.query(
        `INSERT INTO candidates (first_name, last_name, email, phone, location)
         VALUES ($1, $2, $3, '—', 'Global')
         RETURNING *`,
        [req.user.first_name, req.user.last_name, req.user.email]
      );
      candidate = newCand.rows[0];
    } else {
      candidate = candRes.rows[0];
    }

    const candidateId = candidate.id;
    const completion = calculateProfileCompletion(candidate);

    // 1. Active Targets count & list
    const targetsRes = await pool.query(
      `SELECT t.id AS target_id, t.status AS target_status, t.targeted_at, t.last_activity_at,
              cr.id AS vacancy_id, cr.title AS vacancy_title, cr.experience_level, cr.location, cr.work_mode,
              cr.status AS vacancy_status,
              c.id AS company_id, c.name AS company_name, c.verification_status AS company_status,
              d.name AS department_name,
              vv.id AS vacancy_version_id, vv.version_number,
              COUNT(DISTINCT r.id) AS requirements_count,
              tc.total_requirements, tc.supported_count, tc.limited_count, tc.pending_count, tc.gap_count, tc.coverage_pct
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       LEFT JOIN departments d ON d.id = cr.department_id
       LEFT JOIN vacancy_versions vv ON vv.id = t.vacancy_version_id
       LEFT JOIN requirements r ON r.role_id = cr.id
       LEFT JOIN target_coverage tc ON tc.target_id = t.id
       WHERE t.candidate_id = $1
       GROUP BY t.id, cr.id, c.id, d.name, vv.id, vv.version_number,
                tc.total_requirements, tc.supported_count, tc.limited_count, tc.pending_count, tc.gap_count, tc.coverage_pct
       ORDER BY t.targeted_at DESC`,
      [candidateId]
    );
    const allTargets = targetsRes.rows;
    const activeTargets = allTargets.filter((t) => !['WITHDRAWN', 'CLOSED'].includes(t.target_status));

    // 2. Published Vacancies count
    const vacCountRes = await pool.query(
      `SELECT COUNT(DISTINCT cr.id) AS count
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.status = 'PUBLISHED'
         AND c.verification_status = 'APPROVED'
         AND c.suspended_at IS NULL`
    );
    const publishedVacanciesCount = parseInt(vacCountRes.rows[0]?.count || 0, 10);

    // 3. Evidence Awaiting Action count (drafts + more info requested)
    const evActionRes = await pool.query(
      `SELECT COUNT(e.id) AS count
       FROM evidence e
       WHERE e.candidate_id = $1 AND e.review_status IN ('DRAFT', 'MORE_INFORMATION_REQUESTED')`,
      [candidateId]
    );
    const evidenceAwaitingActionCount = parseInt(evActionRes.rows[0]?.count || 0, 10);

    // 4. Upcoming schedule (candidate interviews)
    let upcomingSchedule = null;
    try {
      const interviewRes = await pool.query(
        `SELECT i.id, i.scheduled_at, i.duration_minutes, i.interview_type, i.status, i.meeting_link,
                cr.title AS vacancy_title, c.name AS company_name
         FROM interviews i
         LEFT JOIN targets t ON t.id = i.target_id
         LEFT JOIN company_roles cr ON cr.id = t.vacancy_id
         LEFT JOIN companies c ON c.id = t.company_id
         WHERE i.candidate_id = $1 AND i.scheduled_at >= NOW() AND i.status != 'CANCELLED'
         ORDER BY i.scheduled_at ASC LIMIT 1`,
        [candidateId]
      );
      if (interviewRes.rowCount > 0) {
        upcomingSchedule = interviewRes.rows[0];
      }
    } catch (_) {}

    // 5. Action Required items (honest, real tasks)
    const actionRequired = [];
    if (completion.percentage < 100 && completion.missingItems.length > 0) {
      actionRequired.push({
        id: 'complete-profile',
        title: 'Complete your Global Profile',
        description: `Your profile is ${completion.percentage}% complete. Consider adding: ${completion.missingItems.slice(0, 2).join(', ')}.`,
        link: '/candidate/profile',
        priority: 'MEDIUM',
      });
    }

    if (evidenceAwaitingActionCount > 0) {
      actionRequired.push({
        id: 'evidence-action',
        title: 'Evidence Awaiting Submission or Review Response',
        description: `You have ${evidenceAwaitingActionCount} evidence item(s) saved as draft or requiring additional information.`,
        link: activeTargets.length > 0 ? `/candidate/targets/${activeTargets[0].target_id}/evidence` : '/candidate/targets',
        priority: 'HIGH',
      });
    }

    // Check if any active target has zero evidence submitted
    const targetsWithoutEvidence = activeTargets.filter(
      (t) => (t.supported_count || 0) === 0 && (t.pending_count || 0) === 0 && (t.requirements_count || 0) > 0
    );
    if (targetsWithoutEvidence.length > 0) {
      actionRequired.push({
        id: 'target-evidence-needed',
        title: `Submit evidence for ${targetsWithoutEvidence[0].vacancy_title}`,
        description: `You have an active target with ${targetsWithoutEvidence[0].requirements_count} role requirement(s) awaiting supporting evidence.`,
        link: `/candidate/targets/${targetsWithoutEvidence[0].target_id}/requirements`,
        priority: 'HIGH',
      });
    }

    // 6. Recent Candidate-Visible Activity (never internal admin / recruiter private notes)
    const activityRes = await pool.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.new_status, a.reason, a.created_at,
              c.name AS company_name
       FROM audit_logs a
       LEFT JOIN companies c ON c.id = a.company_id
       WHERE (a.actor_user_id = $1 OR a.entity_id IN (
         SELECT id::text FROM targets WHERE candidate_id = $2
         UNION
         SELECT id::text FROM evidence WHERE candidate_id = $2
       ))
       AND a.action IN (
         'TARGET_CREATED', 'TARGET_WITHDRAWN', 'EVIDENCE_SUBMITTED', 'EVIDENCE_DRAFT_SAVED',
         'EVIDENCE_WITHDRAWN', 'EVIDENCE_ACCEPTED', 'EVIDENCE_LIMITED', 'EVIDENCE_MORE_INFORMATION_REQUESTED',
         'EVIDENCE_REJECTED', 'PROFILE_UPDATED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED', 'ACCOMMODATION_REQUESTED'
       )
       ORDER BY a.created_at DESC
       LIMIT 10`,
      [req.user.id, candidateId]
    );

    return res.json({
      candidate,
      profileCompletion: completion,
      activeTargetsCount: activeTargets.length,
      publishedVacanciesCount,
      evidenceAwaitingActionCount,
      upcomingSchedule,
      actionRequired,
      targets: allTargets,
      recentActivity: activityRes.rows,
    });
  } catch (err) {
    console.error('Candidate dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate dashboard metrics' });
  }
});

// GET /api/candidate-portal/profile
// Fetch full candidate profile
router.get('/profile', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query(
      `SELECT id, email, first_name, last_name, phone, location, resume_url, education,
              general_skills, experience_summary, employment_history, github_url, portfolio_url,
              linkedin_url, languages, work_preferences, accessibility_needs, privacy_settings,
              created_at, updated_at
       FROM candidates
       WHERE email = $1`,
      [req.user.email]
    );

    if (candRes.rowCount === 0) {
      const newCand = await pool.query(
        `INSERT INTO candidates (first_name, last_name, email, phone, location)
         VALUES ($1, $2, $3, '—', 'Global')
         RETURNING id, email, first_name, last_name, phone, location, resume_url, created_at, updated_at`,
        [req.user.first_name, req.user.last_name, req.user.email]
      );
      const profile = newCand.rows[0];
      return res.json({ profile, completion: calculateProfileCompletion(profile) });
    }

    const profile = candRes.rows[0];
    return res.json({ profile, completion: calculateProfileCompletion(profile) });
  } catch (err) {
    console.error('Get candidate profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate profile' });
  }
});

// PUT /api/candidate-portal/profile
// Update candidate profile
router.put('/profile', authenticate, requireCandidate, async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    location,
    resumeUrl,
    education,
    generalSkills,
    experienceSummary,
    employmentHistory,
    githubUrl,
    portfolioUrl,
    linkedinUrl,
    languages,
    workPreferences,
    accessibilityNeeds,
    privacySettings,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update users table for name if provided
    if (firstName || lastName) {
      await client.query(
        `UPDATE users
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             updated_at = NOW()
         WHERE email = $3`,
        [firstName || null, lastName || null, req.user.email]
      );
    }

    // Update candidates table
    const updateRes = await client.query(
      `UPDATE candidates
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           location = COALESCE($4, location),
           resume_url = COALESCE($5, resume_url),
           education = COALESCE($6, education),
           general_skills = COALESCE($7, general_skills),
           experience_summary = COALESCE($8, experience_summary),
           employment_history = COALESCE($9, employment_history),
           github_url = COALESCE($10, github_url),
           portfolio_url = COALESCE($11, portfolio_url),
           linkedin_url = COALESCE($12, linkedin_url),
           languages = COALESCE($13, languages),
           work_preferences = COALESCE($14, work_preferences),
           accessibility_needs = COALESCE($15, accessibility_needs),
           privacy_settings = COALESCE($16, privacy_settings),
           updated_at = NOW()
       WHERE email = $17
       RETURNING id, email, first_name, last_name, phone, location, resume_url, education,
                 general_skills, experience_summary, employment_history, github_url, portfolio_url,
                 linkedin_url, languages, work_preferences, accessibility_needs, privacy_settings,
                 created_at, updated_at`,
      [
        firstName || null,
        lastName || null,
        phone || null,
        location || null,
        resumeUrl || null,
        education ? JSON.stringify(education) : null,
        generalSkills ? JSON.stringify(generalSkills) : null,
        experienceSummary !== undefined ? experienceSummary : null,
        employmentHistory ? JSON.stringify(employmentHistory) : null,
        githubUrl !== undefined ? githubUrl : null,
        portfolioUrl !== undefined ? portfolioUrl : null,
        linkedinUrl !== undefined ? linkedinUrl : null,
        languages ? JSON.stringify(languages) : null,
        workPreferences ? JSON.stringify(workPreferences) : null,
        accessibilityNeeds !== undefined ? accessibilityNeeds : null,
        privacySettings ? JSON.stringify(privacySettings) : null,
        req.user.email,
      ]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    const updatedProfile = updateRes.rows[0];

    // Candidate activity log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, 'CANDIDATE', 'PROFILE_UPDATED', 'Candidate', $2, 'UPDATED', 'Candidate updated global profile', $3)`,
      [
        req.user.id,
        updatedProfile.id,
        JSON.stringify({ email: req.user.email, timestamp: new Date().toISOString() }),
      ]
    );

    await client.query('COMMIT');

    const completion = calculateProfileCompletion(updatedProfile);

    return res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
      completion,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Update candidate profile error:', err);
    return res.status(500).json({ error: 'Failed to update candidate profile' });
  } finally {
    client.release();
  }
});

// GET /api/candidate-portal/targets
// List active targets for the authenticated candidate
router.get('/targets', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query(
      'SELECT id FROM candidates WHERE email = $1',
      [req.user.email]
    );

    if (candRes.rowCount === 0) {
      return res.json({ targets: [] });
    }

    const candidateId = candRes.rows[0].id;

    const targetsRes = await pool.query(
      `SELECT t.id AS target_id, t.status AS target_status, t.targeted_at, t.last_activity_at,
              cr.id AS vacancy_id, cr.title AS vacancy_title, cr.experience_level, cr.location, cr.work_mode,
              cr.status AS vacancy_status,
              c.id AS company_id, c.name AS company_name, c.verification_status AS company_status,
              d.name AS department_name,
              vv.id AS vacancy_version_id, vv.version_number,
              COUNT(DISTINCT r.id) AS requirements_count,
              tc.total_requirements, tc.supported_count, tc.limited_count, tc.pending_count, tc.gap_count, tc.coverage_pct
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       LEFT JOIN departments d ON d.id = cr.department_id
       LEFT JOIN vacancy_versions vv ON vv.id = t.vacancy_version_id
       LEFT JOIN requirements r ON r.role_id = cr.id
       LEFT JOIN target_coverage tc ON tc.target_id = t.id
       WHERE t.candidate_id = $1
       GROUP BY t.id, cr.id, c.id, d.name, vv.id, vv.version_number,
                tc.total_requirements, tc.supported_count, tc.limited_count, tc.pending_count, tc.gap_count, tc.coverage_pct
       ORDER BY t.targeted_at DESC`,
      [candidateId]
    );

    return res.json({ targets: targetsRes.rows });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      return res.json({ targets: [] });
    }
    console.error('Get targets error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate targets' });
  }
});

// GET /api/candidate-portal/targets/:id
// Get single target workspace detail for authenticated candidate
router.get('/targets/:id', authenticate, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }

    const candRes = await pool.query(
      'SELECT id FROM candidates WHERE email = $1',
      [req.user.email]
    );
    if (candRes.rowCount === 0) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }
    const candidateId = candRes.rows[0].id;

    const targetRes = await pool.query(
      `SELECT t.id AS target_id, t.status AS target_status, t.targeted_at, t.last_activity_at,
              cr.id AS vacancy_id, cr.title AS vacancy_title, cr.job_description, cr.experience_level,
              cr.employment_type, cr.location, cr.work_mode, cr.salary_range, cr.status AS vacancy_status,
              c.id AS company_id, c.name AS company_name, c.website AS company_website,
              c.industry AS company_industry, c.verification_status AS company_status,
              d.name AS department_name,
              vv.id AS vacancy_version_id, vv.version_number
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       LEFT JOIN departments d ON d.id = cr.department_id
       LEFT JOIN vacancy_versions vv ON vv.id = t.vacancy_version_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [id, candidateId]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }

    const target = targetRes.rows[0];

    // Fetch requirements
    const reqRes = await pool.query(
      `SELECT id, name, description, requirement_type, importance, eval_method, evaluation_methods, weight
       FROM requirements
       WHERE role_id = $1
       ORDER BY created_at ASC`,
      [target.vacancy_id]
    );

    // Fetch coverage snapshot
    const coverage = await recomputeTargetCoverage(pool, id);

    return res.json({
      target,
      requirements: reqRes.rows,
      coverage,
      modulesStatus: {
        learn: 'PLANNED',
        practice: 'PLANNED',
        prove: 'PLANNED',
        evidence: 'LIVE',
      },
    });
  } catch (err) {
    console.error('Get target workspace error:', err);
    return res.status(500).json({ error: 'Failed to fetch target workspace' });
  }
});

// POST /api/candidate-portal/targets
// Create a new target for a published vacancy
router.post('/targets', authenticate, requireCandidate, async (req, res) => {
  const { vacancyId } = req.body;
  if (!vacancyId) {
    return res.status(400).json({ error: 'Vacancy ID (vacancyId) is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify vacancy exists, is PUBLISHED, and belongs to an APPROVED non-suspended company
    const vacancyRes = await client.query(
      `SELECT cr.id, cr.company_id, cr.title, cr.status AS vacancy_status,
              c.name AS company_name, c.verification_status AS company_status, c.suspended_at
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1`,
      [vacancyId]
    );

    if (vacancyRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacancyRes.rows[0];

    if (vacancy.vacancy_status !== 'PUBLISHED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot target vacancy: Vacancy status is ${vacancy.vacancy_status}. Only PUBLISHED vacancies can be targeted.`,
      });
    }

    if (vacancy.company_status !== 'APPROVED' || vacancy.suspended_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cannot target vacancy: Hiring company is not an active verified entity.',
      });
    }

    // 2. Resolve active vacancy_version
    let versionRes = await client.query(
      `SELECT id, version_number FROM vacancy_versions
       WHERE role_id = $1 AND (status = 'Published' OR status = 'Approved')
       ORDER BY version_number DESC LIMIT 1`,
      [vacancyId]
    );

    let vacancyVersionId = null;
    if (versionRes.rowCount > 0) {
      vacancyVersionId = versionRes.rows[0].id;
    } else {
      const newVer = await client.query(
        `INSERT INTO vacancy_versions (role_id, company_id, version_number, status, change_summary, published_at)
         VALUES ($1, $2, 1, 'Published', 'Initial Published Version', NOW())
         RETURNING id`,
        [vacancyId, vacancy.company_id]
      );
      vacancyVersionId = newVer.rows[0].id;
    }

    // 3. Ensure candidate record exists
    let candRes = await client.query(
      'SELECT id FROM candidates WHERE email = $1',
      [req.user.email]
    );
    let candidateId;
    if (candRes.rowCount === 0) {
      const newCand = await client.query(
        `INSERT INTO candidates (first_name, last_name, email, phone, location)
         VALUES ($1, $2, $3, '—', 'Global')
         RETURNING id`,
        [req.user.first_name, req.user.last_name, req.user.email]
      );
      candidateId = newCand.rows[0].id;
    } else {
      candidateId = candRes.rows[0].id;
    }

    // 4. Block duplicate active target
    const existing = await client.query(
      `SELECT id, status FROM targets WHERE candidate_id = $1 AND vacancy_id = $2 AND status NOT IN ('WITHDRAWN', 'CLOSED')`,
      [candidateId, vacancyId]
    );
    if (existing.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Duplicate target: You already have an active target for this vacancy.',
        targetId: existing.rows[0].id,
      });
    }

    // 5. Insert target record
    const targetInsert = await client.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, vacancy_version_id, status, targeted_at, last_activity_at)
       VALUES ($1, $2, $3, $4, 'TARGETED', NOW(), NOW())
       RETURNING id, candidate_id, company_id, vacancy_id, vacancy_version_id, status, targeted_at, created_at`,
      [candidateId, vacancy.company_id, vacancyId, vacancyVersionId]
    );
    const target = targetInsert.rows[0];

    // 6. Record TARGET_CREATED audit log
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, 'CANDIDATE', 'TARGET_CREATED', 'Target', $3, 'TARGETED', 'Candidate created role target', $4)`,
      [
        vacancy.company_id,
        req.user.id,
        target.id,
        JSON.stringify({ vacancyId, vacancyVersionId, candidateEmail: req.user.email }),
      ]
    );

    // 7. Insert Notification for candidate
    await client.query(
      `INSERT INTO candidate_notifications (candidate_id, title, message, type, link)
       VALUES ($1, $2, $3, 'SUCCESS', $4)`,
      [
        candidateId,
        `Target Created: ${vacancy.title}`,
        `You have targeted ${vacancy.title} at ${vacancy.company_name}. You can now prepare and submit evidence against role requirements.`,
        `/candidate/targets/${target.id}`,
      ]
    );

    await client.query('COMMIT');

    try {
      await recomputeTargetCoverage(pool, target.id);
    } catch (_) {}

    return res.status(201).json({
      message: 'Target created successfully',
      target,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Target creation error:', err);
    return res.status(500).json({ error: 'Failed to create role target' });
  } finally {
    client.release();
  }
});

// POST /api/candidate-portal/targets/:id/withdraw
// Candidate withdraws own active target before final decision
router.post('/targets/:id/withdraw', authenticate, requireCandidate, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(404).json({ error: 'Target not found or access denied.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetRes = await client.query(
      `SELECT t.id, t.candidate_id, t.company_id, t.status, cr.title AS vacancy_title, c.name AS company_name
       FROM targets t
       JOIN candidates c_cand ON c_cand.id = t.candidate_id
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND c_cand.email = $2`,
      [id, req.user.email]
    );

    if (targetRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Target not found or access denied.' });
    }

    const target = targetRes.rows[0];

    if (['DECIDED', 'CLOSED'].includes(target.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot withdraw target: Target has already reached final status (${target.status}).`,
      });
    }

    if (target.status === 'WITHDRAWN') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Target is already withdrawn.' });
    }

    // Update target status to WITHDRAWN
    await client.query(
      `UPDATE targets
       SET status = 'WITHDRAWN',
           last_activity_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, 'CANDIDATE', 'TARGET_WITHDRAWN', 'Target', $3, 'WITHDRAWN', $4, $5)`,
      [
        target.company_id,
        req.user.id,
        id,
        reason ? `Candidate withdrew target: ${reason}` : 'Candidate withdrew active target',
        JSON.stringify({ previousStatus: target.status, candidateEmail: req.user.email }),
      ]
    );

    await client.query('COMMIT');

    return res.json({
      message: 'Target withdrawn successfully',
      target: { ...target, status: 'WITHDRAWN' },
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Target withdrawal error:', err);
    return res.status(500).json({ error: 'Failed to withdraw target' });
  } finally {
    client.release();
  }
});

// ============================================================
// TARGET-SPECIFIC EVIDENCE ENDPOINTS
// ============================================================

// GET /api/candidate-portal/targets/:targetId/evidence
// List all evidence submitted for this target
router.get('/targets/:targetId/evidence', authenticate, requireCandidate, async (req, res) => {
  try {
    const { targetId } = req.params;
    if (!targetId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const targetRes = await pool.query(
      `SELECT t.id, t.candidate_id FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       WHERE t.id = $1 AND c.email = $2`,
      [targetId, req.user.email]
    );
    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target not found or access denied' });
    }

    const evidenceRes = await pool.query(
      `SELECT e.id, e.requirement_id, e.evidence_type, e.title, e.description,
              e.external_url, e.file_url, e.file_hash, e.review_status,
              e.reviewer_note, e.submitted_at, e.created_at, e.updated_at,
              r.name AS requirement_name, r.importance, r.requirement_type
       FROM evidence e
       JOIN requirements r ON r.id = e.requirement_id
       WHERE e.target_id = $1 AND e.review_status != 'WITHDRAWN'
       ORDER BY e.created_at DESC`,
      [targetId]
    );

    return res.json({ evidence: evidenceRes.rows });
  } catch (err) {
    console.error('Get target evidence error:', err);
    return res.status(500).json({ error: 'Failed to fetch target evidence' });
  }
});

// POST /api/candidate-portal/targets/:targetId/evidence
// Submit or save draft evidence for a specific requirement on this target
router.post('/targets/:targetId/evidence', authenticate, requireCandidate, async (req, res) => {
  const { targetId } = req.params;
  const {
    requirementId,
    evidenceType = 'PROJECT',
    title,
    description,
    externalUrl,
    fileUrl,
    fileHash,
    action = 'SUBMIT',
  } = req.body;

  if (!targetId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
    return res.status(404).json({ error: 'Target not found' });
  }
  if (!requirementId) {
    return res.status(400).json({ error: 'Requirement ID is required' });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Evidence title is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetRes = await client.query(
      `SELECT t.id, t.candidate_id, t.company_id, t.vacancy_id, t.vacancy_version_id
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       WHERE t.id = $1 AND c.email = $2`,
      [targetId, req.user.email]
    );
    if (targetRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Target not found or access denied' });
    }
    const target = targetRes.rows[0];

    const reqRes = await client.query(
      'SELECT id, name FROM requirements WHERE id = $1 AND role_id = $2',
      [requirementId, target.vacancy_id]
    );
    if (reqRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Invalid requirement: The specified requirement does not belong to this target vacancy.',
      });
    }

    const reviewStatus = action === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';
    const submittedAt = action === 'DRAFT' ? null : new Date().toISOString();

    const insertRes = await client.query(
      `INSERT INTO evidence
         (target_id, candidate_id, company_id, vacancy_id, vacancy_version_id,
          requirement_id, evidence_type, title, description, external_url,
          file_url, file_hash, review_status, submitted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING id, target_id, requirement_id, evidence_type, title, review_status, submitted_at, created_at`,
      [
        targetId,
        target.candidate_id,
        target.company_id,
        target.vacancy_id,
        target.vacancy_version_id,
        requirementId,
        evidenceType,
        title.trim(),
        description ? description.trim() : null,
        externalUrl ? externalUrl.trim() : null,
        fileUrl ? fileUrl.trim() : null,
        fileHash ? fileHash.trim() : null,
        reviewStatus,
        submittedAt,
      ]
    );
    const evidenceItem = insertRes.rows[0];

    // Update target last activity
    await client.query(
      `UPDATE targets SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [targetId]
    );

    const auditAction = action === 'DRAFT' ? 'EVIDENCE_DRAFT_SAVED' : 'EVIDENCE_SUBMITTED';
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, 'CANDIDATE', $3, 'Evidence', $4, $5, $6, $7)`,
      [
        target.company_id,
        req.user.id,
        auditAction,
        evidenceItem.id,
        reviewStatus,
        `Candidate ${action === 'DRAFT' ? 'saved draft' : 'submitted'} evidence for requirement ${reqRes.rows[0].name}`,
        JSON.stringify({ targetId, requirementId, evidenceType, title }),
      ]
    );

    await client.query('COMMIT');

    const coverage = await recomputeTargetCoverage(pool, targetId);

    return res.status(201).json({
      message: action === 'DRAFT' ? 'Evidence draft saved' : 'Evidence submitted successfully for review',
      evidence: evidenceItem,
      coverage,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Evidence submission error:', err);
    return res.status(500).json({ error: 'Failed to submit evidence' });
  } finally {
    client.release();
  }
});

// POST /api/candidate-portal/targets/:targetId/evidence/:evidenceId/withdraw
// Candidate withdraws own evidence item if not yet reviewed/locked
router.post('/targets/:targetId/evidence/:evidenceId/withdraw', authenticate, requireCandidate, async (req, res) => {
  const { targetId, evidenceId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const evRes = await client.query(
      `SELECT e.id, e.target_id, e.company_id, e.review_status, e.title
       FROM evidence e
       JOIN targets t ON t.id = e.target_id
       JOIN candidates c ON c.id = t.candidate_id
       WHERE e.id = $1 AND e.target_id = $2 AND c.email = $3`,
      [evidenceId, targetId, req.user.email]
    );
    if (evRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evidence record not found or access denied' });
    }
    const ev = evRes.rows[0];

    if (['ACCEPTED', 'REJECTED'].includes(ev.review_status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot withdraw evidence that has already reached final decision: ${ev.review_status}`,
      });
    }

    await client.query(
      "UPDATE evidence SET review_status = 'WITHDRAWN', updated_at = NOW() WHERE id = $1",
      [evidenceId]
    );

    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, 'CANDIDATE', 'EVIDENCE_WITHDRAWN', 'Evidence', $3, 'WITHDRAWN', 'Candidate withdrew submitted evidence', $4)`,
      [
        ev.company_id,
        req.user.id,
        evidenceId,
        JSON.stringify({ targetId, title: ev.title }),
      ]
    );

    await client.query('COMMIT');

    const coverage = await recomputeTargetCoverage(pool, targetId);

    return res.json({
      message: 'Evidence item withdrawn',
      coverage,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Evidence withdrawal error:', err);
    return res.status(500).json({ error: 'Failed to withdraw evidence' });
  } finally {
    client.release();
  }
});

// GET /api/candidate-portal/targets/:targetId/coverage
// Get requirement coverage for target
router.get('/targets/:targetId/coverage', authenticate, requireCandidate, async (req, res) => {
  try {
    const { targetId } = req.params;
    if (!targetId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const targetRes = await pool.query(
      `SELECT t.id FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       WHERE t.id = $1 AND c.email = $2`,
      [targetId, req.user.email]
    );
    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target not found or access denied' });
    }

    const coverage = await recomputeTargetCoverage(pool, targetId);
    return res.json({ coverage });
  } catch (err) {
    console.error('Get target coverage error:', err);
    return res.status(500).json({ error: 'Failed to fetch requirement coverage' });
  }
});

// GET /api/candidate-portal/targets/:targetId/interview
// Candidate interview workspace view (omits recruiter private notes & internal scoring)
router.get('/targets/:targetId/interview', authenticate, requireCandidate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });

    const targetRes = await pool.query(
      `SELECT t.id, t.status, cr.title AS vacancy_title, c.name AS company_name
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [targetId, candRes.rows[0].id]
    );
    if (targetRes.rowCount === 0) return res.status(404).json({ error: 'Target not found' });

    let interviews = [];
    try {
      const intRes = await pool.query(
        `SELECT id, scheduled_at, duration_minutes, interview_type, status, meeting_link, location, instructions, created_at
         FROM interviews
         WHERE target_id = $1 OR (candidate_id = $2 AND status != 'CANCELLED')
         ORDER BY scheduled_at ASC`,
        [targetId, candRes.rows[0].id]
      );
      interviews = intRes.rows;
    } catch (_) {}

    return res.json({
      target: targetRes.rows[0],
      interviews,
      hasScheduledInterview: interviews.length > 0,
      accommodationNotice: 'If you require accessibility accommodations or time adjustments for an upcoming interview, please submit an accommodation request.',
    });
  } catch (err) {
    console.error('Candidate interview error:', err);
    return res.status(500).json({ error: 'Failed to fetch interview details' });
  }
});

// GET /api/candidate-portal/targets/:targetId/assessment
// Candidate assessment workspace view
router.get('/targets/:targetId/assessment', authenticate, requireCandidate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });

    const targetRes = await pool.query(
      `SELECT t.id, t.status, t.vacancy_id, cr.title AS vacancy_title, c.name AS company_name
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [targetId, candRes.rows[0].id]
    );
    if (targetRes.rowCount === 0) return res.status(404).json({ error: 'Target not found' });

    const target = targetRes.rows[0];

    // Check if company configured assessment
    let assessments = [];
    try {
      const assRes = await pool.query(
        `SELECT id, title, description, duration_minutes, passing_score, total_points, status
         FROM assessments
         WHERE role_id = $1 AND status = 'ACTIVE'`,
        [target.vacancy_id]
      );
      assessments = assRes.rows;
    } catch (_) {}

    return res.json({
      target,
      isConfigured: assessments.length > 0,
      assessments,
      integrityNotice: 'Assessments are evaluated with human oversight. Integrity signals require human review and never trigger automatic rejection.',
      accessibilityNotice: 'Time extensions and screen reader support are available on request via the Accommodations channel.',
    });
  } catch (err) {
    console.error('Candidate assessment error:', err);
    return res.status(500).json({ error: 'Failed to fetch assessment details' });
  }
});

// ============================================================
// CANDIDATE ACTIVITY, NOTIFICATIONS & ACCOMMODATIONS
// ============================================================

// GET /api/candidate-portal/activity
// Paginated candidate-visible activity trail
router.get('/activity', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.json({ activity: [] });
    const candidateId = candRes.rows[0].id;

    const activityRes = await pool.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.new_status, a.reason, a.created_at,
              c.name AS company_name
       FROM audit_logs a
       LEFT JOIN companies c ON c.id = a.company_id
       WHERE (a.actor_user_id = $1 OR a.entity_id IN (
         SELECT id::text FROM targets WHERE candidate_id = $2
         UNION
         SELECT id::text FROM evidence WHERE candidate_id = $2
       ))
       AND a.action IN (
         'TARGET_CREATED', 'TARGET_WITHDRAWN', 'EVIDENCE_SUBMITTED', 'EVIDENCE_DRAFT_SAVED',
         'EVIDENCE_WITHDRAWN', 'EVIDENCE_ACCEPTED', 'EVIDENCE_LIMITED', 'EVIDENCE_MORE_INFORMATION_REQUESTED',
         'EVIDENCE_REJECTED', 'PROFILE_UPDATED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED', 'ACCOMMODATION_REQUESTED'
       )
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [req.user.id, candidateId]
    );

    return res.json({ activity: activityRes.rows });
  } catch (err) {
    console.error('Candidate activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// GET /api/candidate-portal/notifications
// Candidate in-app notifications
router.get('/notifications', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.json({ notifications: [] });
    const candidateId = candRes.rows[0].id;

    const notifRes = await pool.query(
      `SELECT id, title, message, type, link, is_read, created_at
       FROM candidate_notifications
       WHERE candidate_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [candidateId]
    );

    return res.json({ notifications: notifRes.rows });
  } catch (err) {
    console.error('Candidate notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/candidate-portal/notifications/:id/read
router.patch('/notifications/:id/read', authenticate, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });

    await pool.query(
      'UPDATE candidate_notifications SET is_read = TRUE WHERE id = $1 AND candidate_id = $2',
      [id, candRes.rows[0].id]
    );
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/candidate-portal/notifications/mark-all-read
router.post('/notifications/mark-all-read', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });

    await pool.query(
      'UPDATE candidate_notifications SET is_read = TRUE WHERE candidate_id = $1',
      [candRes.rows[0].id]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// GET /api/candidate-portal/accommodations
router.get('/accommodations', authenticate, requireCandidate, async (req, res) => {
  try {
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.json({ accommodations: [] });
    const candidateId = candRes.rows[0].id;

    const accommRes = await pool.query(
      `SELECT a.id, a.target_id, a.request_type, a.description, a.status, a.created_at,
              cr.title AS vacancy_title, c.name AS company_name
       FROM accommodation_requests a
       LEFT JOIN targets t ON t.id = a.target_id
       LEFT JOIN company_roles cr ON cr.id = t.vacancy_id
       LEFT JOIN companies c ON c.id = t.company_id
       WHERE a.candidate_id = $1
       ORDER BY a.created_at DESC`,
      [candidateId]
    );

    return res.json({ accommodations: accommRes.rows });
  } catch (err) {
    console.error('Get accommodations error:', err);
    return res.status(500).json({ error: 'Failed to fetch accommodation requests' });
  }
});

// POST /api/candidate-portal/accommodations
router.post('/accommodations', authenticate, requireCandidate, async (req, res) => {
  const { targetId, requestType = 'GENERAL', description } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description of accommodation request is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const candRes = await client.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Candidate profile not found' });
    }
    const candidateId = candRes.rows[0].id;

    let validTargetId = null;
    let companyId = null;
    if (targetId) {
      const targetRes = await client.query(
        'SELECT id, company_id FROM targets WHERE id = $1 AND candidate_id = $2',
        [targetId, candidateId]
      );
      if (targetRes.rowCount > 0) {
        validTargetId = targetRes.rows[0].id;
        companyId = targetRes.rows[0].company_id;
      }
    }

    const insRes = await client.query(
      `INSERT INTO accommodation_requests (candidate_id, target_id, request_type, description, status, created_at)
       VALUES ($1, $2, $3, $4, 'SUBMITTED', NOW())
       RETURNING *`,
      [candidateId, validTargetId, requestType, description.trim()]
    );
    const requestItem = insRes.rows[0];

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, 'CANDIDATE', 'ACCOMMODATION_REQUESTED', 'AccommodationRequest', $3, 'SUBMITTED', 'Candidate submitted accommodation request', $4)`,
      [
        companyId,
        req.user.id,
        requestItem.id,
        JSON.stringify({ requestType, targetId: validTargetId }),
      ]
    );

    // Notification
    await client.query(
      `INSERT INTO candidate_notifications (candidate_id, title, message, type, link)
       VALUES ($1, 'Accommodation Request Received', 'Your accessibility / accommodation request has been recorded. Our coordination team will review it confidentially.', 'INFO', '/candidate/accessibility')`,
      [candidateId]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Accommodation request submitted successfully',
      accommodation: requestItem,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Accommodation request error:', err);
    return res.status(500).json({ error: 'Failed to submit accommodation request' });
  } finally {
    client.release();
  }
});

module.exports = router;
