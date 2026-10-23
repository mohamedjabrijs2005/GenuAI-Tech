const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { recomputeTargetCoverage } = require('./evidenceService');
const { sendEmail } = require('../services/email');

const router = express.Router();

/**
 * Middleware: Ensure the authenticated user has role = 'CANDIDATE' or 'APPLICANT'
 */
function requireCandidate(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  if (role !== 'CANDIDATE' && role !== 'APPLICANT' && role !== 'USER') {
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
       WHERE LOWER(email) = LOWER($1)`,
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

// PUT & PATCH /api/candidate-portal/profile
// Update candidate profile
const handleProfileUpdate = async (req, res) => {
  const firstName = req.body.firstName || req.body.first_name;
  const lastName = req.body.lastName || req.body.last_name;
  const phone = req.body.phone;
  const location = req.body.location;
  const resumeUrl = req.body.resumeUrl !== undefined ? req.body.resumeUrl : req.body.resume_url;
  const education = req.body.education;
  const generalSkills = req.body.generalSkills !== undefined ? req.body.generalSkills : req.body.general_skills;
  const experienceSummary = req.body.experienceSummary !== undefined ? req.body.experienceSummary : req.body.experience_summary;
  const employmentHistory = req.body.employmentHistory !== undefined ? req.body.employmentHistory : req.body.employment_history;
  const githubUrl = req.body.githubUrl !== undefined ? req.body.githubUrl : req.body.github_url;
  const portfolioUrl = req.body.portfolioUrl !== undefined ? req.body.portfolioUrl : req.body.portfolio_url;
  const linkedinUrl = req.body.linkedinUrl !== undefined ? req.body.linkedinUrl : req.body.linkedin_url;
  const languages = req.body.languages;
  const workPreferences = req.body.workPreferences !== undefined ? req.body.workPreferences : req.body.work_preferences;
  const accessibilityNeeds = req.body.accessibilityNeeds !== undefined ? req.body.accessibilityNeeds : req.body.accessibility_needs;
  const privacySettings = req.body.privacySettings !== undefined ? req.body.privacySettings : req.body.privacy_settings;

  const onboardingSubmitted = req.body.onboardingSubmitted === true || req.body.onboarding_submitted === true;

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
         WHERE LOWER(email) = LOWER($3)`,
        [firstName || null, lastName || null, req.user.email]
      );
    }

    // Ensure candidate row exists
    await client.query(
      `INSERT INTO candidates (first_name, last_name, email, phone, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [req.user.first_name || firstName || 'Candidate', req.user.last_name || lastName || 'User', req.user.email, phone || '—', location || 'Global']
    );

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
           onboarding_submitted = CASE WHEN $18 = TRUE THEN TRUE ELSE onboarding_submitted END,
           updated_at = NOW()
       WHERE LOWER(email) = LOWER($17)
       RETURNING id, email, first_name, last_name, phone, location, resume_url, education,
                 general_skills, experience_summary, employment_history, github_url, portfolio_url,
                 linkedin_url, languages, work_preferences, accessibility_needs, privacy_settings,
                 onboarding_submitted, created_at, updated_at`,
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
        onboardingSubmitted,
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
};

router.put('/profile', authenticate, requireCandidate, handleProfileUpdate);
router.patch('/profile', authenticate, requireCandidate, handleProfileUpdate);

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

    // Compute separate module progress states
    const reqNames = reqRes.rows.map(r => r.name);
    const reqIds = reqRes.rows.map(r => r.id);

    // 1. Learning progress via versioned requirement mapping with fallback
    let totalLearnCount = 0;
    let completedLearnCount = 0;
    if (reqIds.length > 0) {
      const totalLearnRes = await pool.query(
        `SELECT COUNT(DISTINCT lr.id)
         FROM learning_resources lr
         LEFT JOIN learning_resource_requirement_map lrrm ON lrrm.resource_id = lr.id AND lrrm.requirement_id = ANY($1)
         LEFT JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(lr.requirement_name)) AND r.id = ANY($1)
         WHERE (lrrm.requirement_id IS NOT NULL OR r.id IS NOT NULL)
           AND (lr.status IS NULL OR lr.status = 'PUBLISHED')`,
        [reqIds]
      );
      totalLearnCount = parseInt(totalLearnRes.rows[0].count, 10);

      const compLearnRes = await pool.query(
        `SELECT COUNT(DISTINCT tlp.resource_id)
         FROM target_learning_progress tlp
         JOIN learning_resources lr ON lr.id = tlp.resource_id
         LEFT JOIN learning_resource_requirement_map lrrm ON lrrm.resource_id = lr.id AND lrrm.requirement_id = ANY($3)
         LEFT JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(lr.requirement_name)) AND r.id = ANY($3)
         WHERE tlp.target_id = $1 AND tlp.candidate_id = $2 AND tlp.status = 'COMPLETED'
           AND (lrrm.requirement_id IS NOT NULL OR r.id IS NOT NULL)
           AND (lr.status IS NULL OR lr.status = 'PUBLISHED')`,
        [id, candidateId, reqIds]
      );
      completedLearnCount = parseInt(compLearnRes.rows[0].count, 10);
    }
    const learningStatus = totalLearnCount === 0
      ? 'NOT_STARTED'
      : (completedLearnCount === totalLearnCount ? 'COMPLETED' : (completedLearnCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'));

    // 2. Practice progress via versioned requirement mapping with fallback
    const practiceAttemptsRes = await pool.query(
      `SELECT COUNT(DISTINCT COALESCE(pa.requirement_id, r.id)) as completed_sets, COUNT(*) as total_attempts
       FROM practice_attempts pa
       LEFT JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(pa.requirement_name)) AND r.id = ANY($3)
       WHERE pa.target_id = $1 AND pa.candidate_id = $2 AND pa.status = 'COMPLETED'
         AND (pa.requirement_id = ANY($3) OR r.id IS NOT NULL)`,
      [id, candidateId, reqIds]
    );
    const completedPracticeSets = parseInt(practiceAttemptsRes.rows[0]?.completed_sets || 0, 10);
    const totalPracticeAttempts = parseInt(practiceAttemptsRes.rows[0]?.total_attempts || 0, 10);
    const practiceStatus = completedPracticeSets === 0
      ? 'NOT_STARTED'
      : (completedPracticeSets >= reqIds.length ? 'COMPLETED' : 'IN_PROGRESS');

    // 3. Official assessment status (Honest states: NOT_REQUIRED, NOT_ASSIGNED, AVAILABLE, IN_PROGRESS, SUBMITTED, PARTIALLY_GRADED, FULLY_GRADED)
    const attemptRes = await pool.query(
      `SELECT id, status, score, objective_score, scenario_score, grading_status, submitted_at, expires_at
       FROM assessment_attempts
       WHERE target_id = $1 AND candidate_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [id, candidateId]
    );
    let assessmentState = 'AVAILABLE';
    let latestAttempt = null;
    if (reqRes.rows.length === 0) {
      assessmentState = 'NOT_REQUIRED';
    } else if (attemptRes.rowCount > 0) {
      latestAttempt = attemptRes.rows[0];
      if (latestAttempt.status === 'SUBMITTED' || latestAttempt.status === 'GRADED') {
        assessmentState = latestAttempt.grading_status === 'FULLY_GRADED'
          ? 'FULLY_GRADED'
          : (latestAttempt.grading_status === 'PARTIALLY_GRADED' ? 'PARTIALLY_GRADED' : 'SUBMITTED');
      } else if (latestAttempt.status === 'IN_PROGRESS') {
        assessmentState = 'IN_PROGRESS';
      }
    }

    // 4. Evidence submissions
    const evidenceRes = await pool.query(
      `SELECT COUNT(*) as total_evidence,
              COUNT(*) FILTER (WHERE review_status = 'APPROVED') as approved_evidence,
              COUNT(*) FILTER (WHERE review_status = 'PENDING_REVIEW') as pending_evidence
       FROM evidence
       WHERE target_id = $1 AND candidate_id = $2`,
      [id, candidateId]
    );
    const evidenceCount = parseInt(evidenceRes.rows[0]?.total_evidence || 0, 10);
    const approvedEvidence = parseInt(evidenceRes.rows[0]?.approved_evidence || 0, 10);
    const pendingEvidence = parseInt(evidenceRes.rows[0]?.pending_evidence || 0, 10);

    return res.json({
      target,
      requirements: reqRes.rows,
      coverage,
      modulesStatus: {
        learn: 'LIVE',
        practice: 'LIVE',
        prove: 'LIVE',
        evidence: 'LIVE',
      },
      progress: {
        learning: {
          totalResources: totalLearnCount,
          completedResources: completedLearnCount,
          status: learningStatus,
          summary: `${completedLearnCount} of ${totalLearnCount} resources completed`,
        },
        practice: {
          completedSets: completedPracticeSets,
          totalAttempts: totalPracticeAttempts,
          status: practiceStatus,
          summary: `${completedPracticeSets} practice sets completed`,
        },
        assessment: {
          status: assessmentState,
          attemptId: latestAttempt?.id || null,
          score: latestAttempt?.score || null,
          objectiveScore: latestAttempt?.objective_score || null,
          scenarioScore: latestAttempt?.scenario_score || null,
          gradingStatus: latestAttempt?.grading_status || null,
          submittedAt: latestAttempt?.submitted_at || null,
          summary: latestAttempt?.status === 'SUBMITTED' ? `Submitted — ${latestAttempt.grading_status || 'PENDING_REVIEW'}` : 'Available for target',
        },
        evidence: {
          totalSubmitted: evidenceCount,
          approved: approvedEvidence,
          pending: pendingEvidence,
          summary: `${evidenceCount} items submitted`,
        },
        coverage: {
          supportedCount: coverage?.supportedCount || 0,
          limitedCount: coverage?.limitedCount || 0,
          pendingCount: coverage?.pendingCount || 0,
          gapCount: coverage?.gapCount || 0,
          summary: `${coverage?.supportedCount || 0} Supported · ${coverage?.limitedCount || 0} Limited · ${coverage?.pendingCount || 0} Pending`,
        },
        recruitment: {
          status: target.status,
          label: target.status === 'DECIDED' ? 'Decided' : (target.status === 'UNDER_REVIEW' || target.status === 'INTERVIEW' ? 'Under Recruiter Review' : 'Active Preparation'),
        },
      },
    });
  } catch (err) {
    console.error('Get target workspace error:', err);
    return res.status(500).json({ error: 'Failed to fetch target workspace' });
  }
});

// ============================================================
// LEARN ENGINE: TARGET-LINKED PREPARATION CURRICULUM
// ============================================================
router.get('/targets/:id/learn', authenticate, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.candidateId;
    const { id } = req.params;

    // Validate ownership
    const targetRes = await pool.query(
      `SELECT t.id, t.company_id, t.vacancy_id, cr.title AS vacancy_title, c.name AS company_name
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [id, candidateId]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }

    const target = targetRes.rows[0];

    // Fetch requirements for target
    const reqRes = await pool.query(
      `SELECT id, name, description, requirement_type, importance, weight
       FROM requirements
       WHERE role_id = $1
       ORDER BY created_at ASC`,
      [target.vacancy_id]
    );

    const requirements = reqRes.rows;
    const reqIds = requirements.map(r => r.id);
    const reqNames = requirements.map(r => r.name);

    // Fetch learning resources matching these requirements via versioned requirement mapping, with fallback to requirement_name
    const resourcesRes = reqIds.length > 0 ? await pool.query(
      `SELECT DISTINCT lr.id, lr.requirement_name, lr.title, lr.description, lr.source, lr.resource_type, lr.language, lr.estimated_duration_mins, lr.url,
              COALESCE(lrrm.requirement_id, r.id) as mapped_requirement_id
       FROM learning_resources lr
       LEFT JOIN learning_resource_requirement_map lrrm ON lrrm.resource_id = lr.id AND lrrm.requirement_id = ANY($1)
       LEFT JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(lr.requirement_name)) AND r.id = ANY($1)
       WHERE lrrm.requirement_id IS NOT NULL OR r.id IS NOT NULL
       ORDER BY lr.title ASC`,
      [reqIds]
    ) : { rows: [] };

    // Fetch candidate's saved progress for this target
    const progressRes = await pool.query(
      `SELECT resource_id, status, is_bookmarked, last_accessed_at, completed_at
       FROM target_learning_progress
       WHERE target_id = $1 AND candidate_id = $2`,
      [id, candidateId]
    );

    const progressMap = new Map();
    for (const p of progressRes.rows) {
      progressMap.set(p.resource_id, p);
    }

    let totalResources = 0;
    let completedResources = 0;

    const requirementsWithResources = requirements.map(reqItem => {
      const matchedResources = resourcesRes.rows
        .filter(r => r.mapped_requirement_id === reqItem.id || r.requirement_name?.toLowerCase() === reqItem.name?.toLowerCase())
        .map(r => {
          totalResources++;
          const p = progressMap.get(r.id);
          const isCompleted = p?.status === 'COMPLETED';
          if (isCompleted) completedResources++;

          return {
            id: r.id,
            requirementName: reqItem.name,
            title: r.title,
            description: r.description,
            source: r.source,
            resourceType: r.resource_type,
            language: r.language,
            estimatedDurationMins: r.estimated_duration_mins,
            url: r.url,
            status: p?.status || 'NOT_STARTED',
            isBookmarked: Boolean(p?.is_bookmarked),
            lastAccessedAt: p?.last_accessed_at || null,
            completedAt: p?.completed_at || null,
          };
        });

      return {
        id: reqItem.id,
        name: reqItem.name,
        description: reqItem.description,
        importance: reqItem.importance,
        weight: reqItem.weight,
        resources: matchedResources,
      };
    });

    const learningStatus = totalResources === 0
      ? 'NOT_STARTED'
      : (completedResources === totalResources ? 'COMPLETED' : (completedResources > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'));

    return res.json({
      target,
      requirements: requirementsWithResources,
      summary: {
        totalResources,
        completedResources,
        learningStatus,
        summaryLabel: `${completedResources} of ${totalResources} resources completed`,
      },
    });
  } catch (err) {
    console.error('Get target learn error:', err);
    return res.status(500).json({ error: 'Failed to fetch learning curriculum' });
  }
});

// POST /api/candidate-portal/targets/:id/learn/progress
router.post('/targets/:id/learn/progress', authenticate, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.candidateId;
    const { id } = req.params;
    const { resourceId, action } = req.body;

    if (!resourceId) {
      return res.status(400).json({ error: 'resourceId is required' });
    }

    // Validate ownership
    const targetRes = await pool.query(
      `SELECT id FROM targets WHERE id = $1 AND candidate_id = $2`,
      [id, candidateId]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }

    // Check resource exists
    const resourceRes = await pool.query(
      `SELECT id, requirement_name FROM learning_resources WHERE id = $1`,
      [resourceId]
    );

    if (resourceRes.rowCount === 0) {
      return res.status(404).json({ error: 'Learning resource not found' });
    }

    let query = '';
    let params = [];

    if (action === 'COMPLETE') {
      query = `
        INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status, last_accessed_at, completed_at)
        VALUES ($1, $2, $3, 'COMPLETED', NOW(), NOW())
        ON CONFLICT (target_id, resource_id)
        DO UPDATE SET status = 'COMPLETED', completed_at = NOW(), last_accessed_at = NOW()
        RETURNING *`;
      params = [id, candidateId, resourceId];
    } else if (action === 'START') {
      query = `
        INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status, last_accessed_at)
        VALUES ($1, $2, $3, 'IN_PROGRESS', NOW())
        ON CONFLICT (target_id, resource_id)
        DO UPDATE SET status = CASE WHEN target_learning_progress.status = 'COMPLETED' THEN 'COMPLETED' ELSE 'IN_PROGRESS' END, last_accessed_at = NOW()
        RETURNING *`;
      params = [id, candidateId, resourceId];
    } else if (action === 'RESET') {
      query = `
        INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status, last_accessed_at, completed_at)
        VALUES ($1, $2, $3, 'NOT_STARTED', NOW(), NULL)
        ON CONFLICT (target_id, resource_id)
        DO UPDATE SET status = 'NOT_STARTED', completed_at = NULL, last_accessed_at = NOW()
        RETURNING *`;
      params = [id, candidateId, resourceId];
    } else if (action === 'BOOKMARK') {
      query = `
        INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, is_bookmarked, last_accessed_at)
        VALUES ($1, $2, $3, TRUE, NOW())
        ON CONFLICT (target_id, resource_id)
        DO UPDATE SET is_bookmarked = NOT target_learning_progress.is_bookmarked, last_accessed_at = NOW()
        RETURNING *`;
      params = [id, candidateId, resourceId];
    } else {
      return res.status(400).json({ error: 'Invalid action. Supported: START, COMPLETE, RESET, BOOKMARK' });
    }

    const updated = await pool.query(query, params);

    return res.json({
      success: true,
      progress: updated.rows[0],
    });
  } catch (err) {
    console.error('Update learning progress error:', err);
    return res.status(500).json({ error: 'Failed to update learning progress' });
  }
});

// ============================================================
// PRACTICE ENGINE: REQUIREMENT-LINKED SANDBOX (PRIVATE ATTEMPTS)
// ============================================================
router.get('/targets/:id/practice', authenticate, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.candidateId;
    const { id } = req.params;

    // Validate ownership
    const targetRes = await pool.query(
      `SELECT t.id, t.company_id, t.vacancy_id, cr.title AS vacancy_title, c.name AS company_name
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [id, candidateId]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }

    const target = targetRes.rows[0];

    // Fetch requirements for target
    const reqRes = await pool.query(
      `SELECT id, name, description, requirement_type, importance, weight
       FROM requirements
       WHERE role_id = $1
       ORDER BY created_at ASC`,
      [target.vacancy_id]
    );

    const requirements = reqRes.rows;
    const reqIds = requirements.map(r => r.id);
    const reqNames = requirements.map(r => r.name);

    // Fetch question counts per requirement via versioned mapping table with fallback
    const qCountRes = reqIds.length > 0 ? await pool.query(
      `SELECT COALESCE(pqrm.requirement_id, r.id) as requirement_id, COUNT(DISTINCT pq.id) as question_count
       FROM practice_questions pq
       LEFT JOIN practice_question_requirement_map pqrm ON pqrm.question_id = pq.id AND pqrm.requirement_id = ANY($1)
       LEFT JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(pq.requirement_name)) AND r.id = ANY($1)
       WHERE pqrm.requirement_id IS NOT NULL OR r.id IS NOT NULL
       GROUP BY COALESCE(pqrm.requirement_id, r.id)`,
      [reqIds]
    ) : { rows: [] };

    const qCountMap = new Map();
    for (const r of qCountRes.rows) {
      qCountMap.set(r.requirement_id, parseInt(r.question_count, 10));
    }

    // Fetch candidate's past practice attempts for this target
    const attemptsRes = await pool.query(
      `SELECT id, requirement_name, status, score, max_score, topics_to_revisit, started_at, submitted_at
       FROM practice_attempts
       WHERE target_id = $1 AND candidate_id = $2
       ORDER BY created_at DESC`,
      [id, candidateId]
    );

    const attempts = attemptsRes.rows;
    const completedSetNames = new Set(
      attempts.filter(a => a.status === 'COMPLETED').map(a => a.requirement_name.toLowerCase())
    );

    const requirementSets = requirements.map(r => {
      const qCount = qCountMap.get(r.id) || 0;
      const reqAttempts = attempts.filter(a => a.requirement_name.toLowerCase() === r.name.toLowerCase());
      const bestScore = reqAttempts.reduce((max, a) => Math.max(max, Number(a.score) || 0), 0);
      const isCompleted = completedSetNames.has(r.name.toLowerCase());

      return {
        requirementId: r.id,
        requirementName: r.name,
        importance: r.importance,
        availableQuestions: qCount,
        attemptsCount: reqAttempts.length,
        isCompleted,
        bestScore,
        lastAttempt: reqAttempts[0] || null,
      };
    });

    return res.json({
      target,
      requirementSets,
      attemptsHistory: attempts,
      summary: {
        totalRequirements: requirements.length,
        completedSets: completedSetNames.size,
        totalAttempts: attempts.length,
        practiceStatus: completedSetNames.size === 0 ? 'NOT_STARTED' : (completedSetNames.size >= requirements.length ? 'COMPLETED' : 'IN_PROGRESS'),
        summaryLabel: `${completedSetNames.size} of ${requirements.length} practice sets completed`,
      },
    });
  } catch (err) {
    console.error('Get target practice error:', err);
    return res.status(500).json({ error: 'Failed to fetch practice sets' });
  }
});

// POST /api/candidate-portal/targets/:id/practice/start
router.post('/targets/:id/practice/start', authenticate, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.candidateId;
    const { id } = req.params;
    const { requirementName, requirementId } = req.body;

    if (!requirementName && !requirementId) {
      return res.status(400).json({ error: 'requirementName or requirementId is required' });
    }

    // Validate ownership
    const targetRes = await pool.query(
      `SELECT id FROM targets WHERE id = $1 AND candidate_id = $2`,
      [id, candidateId]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }

    // Fetch practice questions for this requirement via versioned mapping or name fallback
    // CRITICAL SECURITY: Never return correct_option or explanation (decoupled answer keys)
    const questionsRes = await pool.query(
      `SELECT DISTINCT pq.id, pq.requirement_name, pq.title, pq.prompt, pq.question_type, pq.options, pq.topic_area, pq.difficulty
       FROM practice_questions pq
       LEFT JOIN practice_question_requirement_map pqrm ON pqrm.question_id = pq.id
       WHERE ((pqrm.requirement_id = $1) OR (LOWER(TRIM(pq.requirement_name)) = LOWER(TRIM($2))))
         AND (pq.status IS NULL OR pq.status = 'PUBLISHED')
       ORDER BY pq.title ASC`,
      [requirementId || null, requirementName || '']
    );

    if (questionsRes.rowCount === 0) {
      return res.status(404).json({ error: `No practice questions available for ${requirementName || requirementId}` });
    }

    const deliveredIds = questionsRes.rows.map(q => q.id);

    // Create a new practice attempt with recorded delivered_question_ids and requirement_id
    const attemptRes = await pool.query(
      `INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, requirement_id, status, max_score, delivered_question_ids)
       VALUES ($1, $2, $3, $4, 'IN_PROGRESS', $5, $6)
       RETURNING id, requirement_name, requirement_id, started_at`,
      [id, candidateId, requirementName || questionsRes.rows[0].requirement_name, requirementId || null, questionsRes.rowCount, JSON.stringify(deliveredIds)]
    );

    return res.json({
      attemptId: attemptRes.rows[0].id,
      requirementName: attemptRes.rows[0].requirement_name,
      requirementId: attemptRes.rows[0].requirement_id,
      startedAt: attemptRes.rows[0].started_at,
      questions: questionsRes.rows,
    });
  } catch (err) {
    console.error('Start practice attempt error:', err);
    return res.status(500).json({ error: 'Failed to start practice session' });
  }
});

// POST /api/candidate-portal/targets/:id/practice/submit
router.post('/targets/:id/practice/submit', authenticate, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.candidateId;
    const { id } = req.params;
    const { attemptId, answers } = req.body; // answers is { [questionId]: chosenKey } or array of { questionId, chosenOption }

    if (!attemptId || !answers) {
      return res.status(400).json({ error: 'attemptId and answers are required' });
    }

    // Validate ownership of attempt
    const attemptRes = await pool.query(
      `SELECT id, target_id, requirement_name, status, score, max_score, topics_to_revisit, delivered_question_ids
       FROM practice_attempts
       WHERE id = $1 AND target_id = $2 AND candidate_id = $3`,
      [attemptId, id, candidateId]
    );

    if (attemptRes.rowCount === 0) {
      return res.status(404).json({ error: 'Practice attempt not found or access denied.' });
    }

    const attempt = attemptRes.rows[0];

    // Idempotent submission: if already completed, return existing result without re-scoring
    if (attempt.status === 'COMPLETED') {
      return res.json({
        success: true,
        attemptId,
        requirementName: attempt.requirement_name,
        score: Number(attempt.score),
        maxScore: Number(attempt.max_score),
        topicsToRevisit: attempt.topics_to_revisit || [],
        message: 'Practice attempt already submitted. Returning cached evaluation.',
      });
    }

    // Support both dictionary and array submission with duplicate checks
    let answerMap = {};
    if (Array.isArray(answers)) {
      const seen = new Set();
      for (const item of answers) {
        if (!item || !item.questionId) {
          return res.status(400).json({ error: 'Invalid answer item: missing questionId.' });
        }
        if (seen.has(item.questionId)) {
          return res.status(400).json({ error: `Duplicate answer for question ${item.questionId} rejected.` });
        }
        seen.add(item.questionId);
        answerMap[item.questionId] = item.chosenOption || item.answer;
      }
    } else if (typeof answers === 'object' && answers !== null) {
      answerMap = answers;
    } else {
      return res.status(400).json({ error: 'answers must be an object or array.' });
    }

    // Validate submitted questions belong to delivered_question_ids
    const deliveredSet = new Set(Array.isArray(attempt.delivered_question_ids) ? attempt.delivered_question_ids : []);
    const submittedIds = Object.keys(answerMap);

    if (submittedIds.length === 0) {
      return res.status(400).json({ error: 'At least one question must be answered.' });
    }

    for (const qId of submittedIds) {
      if (deliveredSet.size > 0 && !deliveredSet.has(qId)) {
        return res.status(400).json({ error: `Question ${qId} was not part of this practice attempt.` });
      }
    }

    // Query decoupled answer keys from practice_question_answers table
    const answersRes = await pool.query(
      `SELECT pqa.question_id, pqa.correct_option, pqa.explanation,
              pq.title, pq.prompt, pq.options, pq.topic_area
       FROM practice_question_answers pqa
       JOIN practice_questions pq ON pq.id = pqa.question_id
       WHERE pqa.question_id = ANY($1)`,
      [Array.from(deliveredSet.size > 0 ? deliveredSet : new Set(submittedIds))]
    );

    let earnedScore = 0;
    const totalMax = answersRes.rowCount;
    const topicsToRevisit = [];
    const questionResults = [];

    for (const q of answersRes.rows) {
      const chosenKey = (answerMap[q.question_id] || '').trim().toUpperCase();
      const isCorrect = chosenKey === q.correct_option;

      if (isCorrect) {
        earnedScore += 1;
      } else {
        if (q.topic_area && !topicsToRevisit.includes(q.topic_area)) {
          topicsToRevisit.push(q.topic_area);
        }
      }

      questionResults.push({
        questionId: q.question_id,
        title: q.title,
        prompt: q.prompt,
        options: q.options,
        chosenKey,
        correctKey: q.correct_option,
        isCorrect,
        explanation: q.explanation,
        topicArea: q.topic_area,
      });
    }

    // Persist attempt results with explanations unlocked
    await pool.query(
      `UPDATE practice_attempts
       SET answers = $1, score = $2, max_score = $3, explanations_released = TRUE,
           status = 'COMPLETED', topics_to_revisit = $4, submitted_at = NOW()
       WHERE id = $5`,
      [JSON.stringify(answerMap), earnedScore, totalMax, JSON.stringify(topicsToRevisit), attemptId]
    );

    return res.json({
      success: true,
      attemptId,
      requirementName: attempt.requirement_name,
      score: earnedScore,
      maxScore: totalMax,
      percentage: totalMax > 0 ? Math.round((earnedScore / totalMax) * 100) : 0,
      topicsToRevisit,
      results: questionResults,
      message: 'Practice attempt completed. Explanations and topic recommendations unlocked.',
    });
  } catch (err) {
    console.error('Submit practice attempt error:', err);
    return res.status(500).json({ error: 'Failed to submit practice attempt' });
  }
});

// GET /api/candidate-portal/targets/:id/practice/attempts/:attemptId
router.get('/targets/:id/practice/attempts/:attemptId', authenticate, requireCandidate, async (req, res) => {
  try {
    const candidateId = req.candidateId;
    const { id, attemptId } = req.params;

    const attemptRes = await pool.query(
      `SELECT pa.id, pa.target_id, pa.requirement_name, pa.status, pa.answers, pa.score, pa.max_score,
              pa.explanations_released, pa.topics_to_revisit, pa.started_at, pa.submitted_at, pa.delivered_question_ids
       FROM practice_attempts pa
       WHERE pa.id = $1 AND pa.target_id = $2 AND pa.candidate_id = $3`,
      [attemptId, id, candidateId]
    );

    if (attemptRes.rowCount === 0) {
      return res.status(404).json({ error: 'Practice attempt not found or access denied.' });
    }

    const attempt = attemptRes.rows[0];

    // If submitted, attach explanations from practice_question_answers
    let questionResults = [];
    if (attempt.explanations_released) {
      const deliveredIds = Array.isArray(attempt.delivered_question_ids) ? attempt.delivered_question_ids : [];
      const qRes = await pool.query(
        `SELECT pqa.question_id, pqa.correct_option, pqa.explanation,
                pq.title, pq.prompt, pq.options, pq.topic_area
         FROM practice_question_answers pqa
         JOIN practice_questions pq ON pq.id = pqa.question_id
         WHERE pqa.question_id = ANY($1)`,
        [deliveredIds.length > 0 ? deliveredIds : [attempt.id]]
      );

      const answersObj = attempt.answers || {};
      questionResults = qRes.rows.map(q => {
        const chosenKey = (answersObj[q.question_id] || '').trim().toUpperCase();
        return {
          questionId: q.question_id,
          title: q.title,
          prompt: q.prompt,
          options: q.options,
          chosenKey,
          correctKey: q.correct_option,
          isCorrect: chosenKey === q.correct_option,
          explanation: q.explanation,
          topicArea: q.topic_area,
        };
      });
    }

    return res.json({
      attempt,
      results: questionResults,
    });
  } catch (err) {
    console.error('Get practice attempt details error:', err);
    return res.status(500).json({ error: 'Failed to fetch practice attempt details' });
  }
});

// ============================================================
// ASSESSMENT ENGINE: TARGET ASSESSMENT WORKSPACE
// ============================================================

function generateQuestionsForRequirements(requirements) {
  return requirements.map((req) => {
    return {
      id: `q_${req.id}`,
      requirementId: req.id,
      requirementName: req.name,
      importance: req.importance || 'REQUIRED',
      title: `Capability Evaluation: ${req.name}`,
      prompt: `In the context of production-grade engineering for this role, explain how you design and implement solutions satisfying "${req.name}". Address resilience, data integrity, and failure recovery.`,
      mcqQuestion: `Which principle is most critical when verifying and implementing "${req.name}" under high throughput?`,
      options: [
        { key: 'A', text: 'Bypassing strict input schemas to optimize raw throughput latency' },
        { key: 'B', text: 'Decoupled asynchronous processing with idempotent handlers and audit logging' },
        { key: 'C', text: 'In-memory caching without invalidation triggers or database synchronization' },
        { key: 'D', text: 'Relying exclusively on client-side state verification without backend enforcement' },
      ],
      correctOption: 'B',
      maxScore: Math.round(100 / Math.max(requirements.length, 1)),
    };
  });
}

// GET /api/candidate-portal/targets/:id/assessment
router.get('/targets/:id/assessment', authenticate, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });
    const candidateId = candRes.rows[0].id;

    // Fetch target
    const targetRes = await pool.query(
      `SELECT t.id, t.status AS target_status, t.targeted_at,
              cr.id AS vacancy_id, cr.title AS vacancy_title,
              c.id AS company_id, c.name AS company_name
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [id, candidateId]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target workspace not found or access denied.' });
    }
    const target = targetRes.rows[0];

    // Fetch requirements
    const reqRes = await pool.query(
      `SELECT id, name, description, requirement_type, importance, weight
       FROM requirements
       WHERE role_id = $1
       ORDER BY created_at ASC`,
      [target.vacancy_id]
    );
    const requirements = reqRes.rows;

    // Fetch active or latest attempt
    const attemptRes = await pool.query(
      `SELECT id, status, duration_minutes, started_at, expires_at, submitted_at, score, max_score, answers
       FROM assessment_attempts
       WHERE target_id = $1 AND candidate_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [id, candidateId]
    );
    const attempt = attemptRes.rowCount > 0 ? attemptRes.rows[0] : null;

    let requirementScores = [];
    if (attempt && attempt.id) {
      const scoreRes = await pool.query(
        `SELECT ars.requirement_id, ars.score, ars.max_score, ars.assessment_notes, r.name as requirement_name
         FROM assessment_requirement_scores ars
         JOIN requirements r ON r.id = ars.requirement_id
         WHERE ars.attempt_id = $1`,
        [attempt.id]
      );
      requirementScores = scoreRes.rows;
    }

    const rawQuestions = generateQuestionsForRequirements(requirements);
    const sanitizedQuestions = rawQuestions.map(({ correctOption, ...q }) => q);

    return res.json({
      target,
      isConfigured: requirements.length > 0,
      attempt,
      requirements,
      requirementScores,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error('Get target assessment error:', err);
    return res.status(500).json({ error: 'Failed to fetch assessment workspace' });
  }
});

// POST /api/candidate-portal/targets/:id/assessment/start
router.post('/targets/:id/assessment/start', authenticate, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });
    const candidateId = candRes.rows[0].id;

    const targetRes = await pool.query(
      `SELECT t.id, t.status, t.vacancy_id, t.company_id, cr.title AS vacancy_title, c.name AS company_name
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [id, candidateId]
    );
    if (targetRes.rowCount === 0) return res.status(404).json({ error: 'Target not found' });
    const target = targetRes.rows[0];

    // Enforce target assignment eligibility
    if (['WITHDRAWN', 'DECIDED', 'REJECTED'].includes(target.status)) {
      return res.status(403).json({ error: `Cannot start assessment: Target is ${target.status}.` });
    }

    // Check for existing active in-progress attempt
    const activeRes = await pool.query(
      `SELECT id, status, duration_minutes, started_at, expires_at, answers
       FROM assessment_attempts
       WHERE target_id = $1 AND candidate_id = $2 AND status = 'IN_PROGRESS' AND expires_at > NOW()
       LIMIT 1`,
      [id, candidateId]
    );

    if (activeRes.rowCount > 0) {
      return res.json({ attempt: activeRes.rows[0], resumed: true });
    }

    // Fresh 45-minute attempt
    const durationMinutes = 45;
    const insertRes = await pool.query(
      `INSERT INTO assessment_attempts
        (target_id, candidate_id, role_id, company_id, status, duration_minutes, started_at, expires_at)
       VALUES ($1, $2, $3, $4, 'IN_PROGRESS', $5, NOW(), NOW() + ($5 || ' minutes')::interval)
       RETURNING id, status, duration_minutes, started_at, expires_at, answers`,
      [id, candidateId, target.vacancy_id, target.company_id, durationMinutes]
    );

    return res.status(201).json({ attempt: insertRes.rows[0], resumed: false });
  } catch (err) {
    console.error('Start assessment error:', err);
    return res.status(500).json({ error: 'Failed to start assessment session' });
  }
});

// POST /api/candidate-portal/targets/:id/assessment/save-draft
router.post('/targets/:id/assessment/save-draft', authenticate, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const { attemptId, answers } = req.body;
    if (!attemptId) return res.status(400).json({ error: 'Attempt ID is required' });

    const candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });
    const candidateId = candRes.rows[0].id;

    // Server deadline enforcement: cannot extend deadline or save draft if attempt has expired
    const updateRes = await pool.query(
      `UPDATE assessment_attempts
       SET answers = $1, updated_at = NOW()
       WHERE id = $2 AND target_id = $3 AND candidate_id = $4 AND status = 'IN_PROGRESS'
         AND (expires_at IS NULL OR expires_at > NOW())
       RETURNING id`,
      [JSON.stringify(answers || {}), attemptId, id, candidateId]
    );

    if (updateRes.rowCount === 0) {
      return res.status(400).json({ error: 'Cannot save draft. Assessment session has expired or ended.' });
    }

    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Save draft error:', err);
    return res.status(500).json({ error: 'Failed to save draft answers' });
  }
});

// POST /api/candidate-portal/targets/:id/assessment/submit
router.post('/targets/:id/assessment/submit', authenticate, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const { attemptId, answers } = req.body;
    if (!attemptId) return res.status(400).json({ error: 'Attempt ID is required' });

    const candRes = await pool.query('SELECT id, first_name, last_name, email FROM candidates WHERE email = $1', [req.user.email]);
    if (candRes.rowCount === 0) return res.status(404).json({ error: 'Candidate profile not found' });
    const candidate = candRes.rows[0];

    const targetRes = await pool.query(
      `SELECT t.id, t.vacancy_id, t.company_id, cr.title AS vacancy_title, c.name AS company_name, c.official_email
       FROM targets t
       JOIN company_roles cr ON cr.id = t.vacancy_id
       JOIN companies c ON c.id = t.company_id
       WHERE t.id = $1 AND t.candidate_id = $2`,
      [id, candidate.id]
    );
    if (targetRes.rowCount === 0) return res.status(404).json({ error: 'Target not found' });
    const target = targetRes.rows[0];

    const attemptRes = await pool.query(
      `SELECT id, started_at, expires_at, status, score, grading_status
       FROM assessment_attempts
       WHERE id = $1 AND target_id = $2 AND candidate_id = $3`,
      [attemptId, id, candidate.id]
    );
    if (attemptRes.rowCount === 0) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attemptRes.rows[0];

    // Idempotent submission: if already submitted, return the existing recorded submission without re-evaluating
    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      return res.json({
        success: true,
        attemptId: attempt.id,
        score: attempt.score,
        status: attempt.status,
        gradingStatus: attempt.grading_status,
        message: 'Assessment already submitted. Returning recorded evaluation.',
      });
    }

    // Server deadline enforcement: reject answers submitted after deadline (+ 60s network grace period)
    if (attempt.expires_at && new Date() > new Date(new Date(attempt.expires_at).getTime() + 60000)) {
      return res.status(400).json({ error: 'Assessment deadline has expired. Submissions are no longer accepted.' });
    }

    const reqRes = await pool.query(
      `SELECT id, name, importance, weight FROM requirements WHERE role_id = $1 ORDER BY created_at ASC`,
      [target.vacancy_id]
    );
    const requirements = reqRes.rows;
    const questions = generateQuestionsForRequirements(requirements);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let totalEarnedScore = 0;
      const finalAnswers = answers || {};

      for (const q of questions) {
        const candidateAnswer = finalAnswers[q.id] || {};
        const chosenMcq = candidateAnswer.mcq;
        const textExplanation = candidateAnswer.text || '';

        // Objective scoring only: 50% max score allocated to objective MCQ
        const objectiveMax = q.maxScore * 0.5;
        const scenarioMax = q.maxScore * 0.5;

        let qObjectiveEarned = 0;
        if (chosenMcq && chosenMcq === q.correctOption) {
          qObjectiveEarned = objectiveMax;
        }

        totalEarnedScore += qObjectiveEarned;

        // Predefined rubric definition (independent of candidate submission)
        const rubricDefinition = {
          scenarioMax,
          criteria: [
            { name: 'Technical Accuracy & Problem Formulation', maxPoints: Math.round(scenarioMax * 0.5 * 10) / 10 },
            { name: 'Implementation Feasibility & Architecture', maxPoints: Math.round(scenarioMax * 0.5 * 10) / 10 },
          ],
        };

        const candidateSubmission = {
          textExplanation,
          chosenMcq,
          submittedAt: new Date().toISOString(),
        };

        // Store objective component separately — never modify after submission
        await client.query(
          `INSERT INTO assessment_requirement_scores
             (attempt_id, requirement_id,
              score, max_score,
              objective_score, objective_max_score,
              scenario_score, scenario_max_score,
              required_scenario_evaluation,
              assessment_notes, scoring_source, rubric_criteria, candidate_answers, evaluation_status)
           VALUES ($1, $2, $3, $4, $5, $6, 0, $7, TRUE, $8, 'OBJECTIVE_MCQ', $9, $10, 'PENDING_REVIEW')`,
          [
            attemptId,
            q.requirementId,
            Math.round(qObjectiveEarned * 10) / 10,  // score = objective only at this stage
            q.maxScore,
            Math.round(qObjectiveEarned * 10) / 10,  // objective_score (immutable after submit)
            objectiveMax,                             // objective_max_score
            scenarioMax,                              // scenario_max_score (from rubric)
            `MCQ: ${chosenMcq === q.correctOption ? 'Correct' : 'Incorrect'}; Scenario evaluation pending recruiter review.`,
            JSON.stringify(rubricDefinition),
            JSON.stringify(candidateSubmission),
          ]
        );
      }

      const objectiveTotal = Math.min(100, Math.round(totalEarnedScore));

      // Freeze immutable version snapshot of requirements and criteria
      const versionSnapshot = {
        requirements: requirements.map(r => ({ id: r.id, name: r.name, importance: r.importance, weight: r.weight })),
        capturedAt: new Date().toISOString(),
      };

      await client.query(
        `UPDATE assessment_attempts
         SET status = 'SUBMITTED', submitted_at = NOW(), score = $1, objective_score = $1, scenario_score = 0,
             grading_status = 'PENDING_REVIEW', answers = $2, version_snapshot = $3, updated_at = NOW()
         WHERE id = $4`,
        [objectiveTotal, JSON.stringify(finalAnswers), JSON.stringify(versionSnapshot), attemptId]
      );

      // Recompute Target Coverage in same transaction
      await recomputeTargetCoverage(client, id);

      await client.query('COMMIT');

      // Send confirmation email (async outside transaction)
      sendEmail({
        to: candidate.email,
        toName: `${candidate.first_name} ${candidate.last_name}`,
        subject: `Assessment Completed: ${target.vacancy_title} (${target.company_name})`,
        html: `<p>Hi ${candidate.first_name},</p><p>You have successfully submitted your assessment for <strong>${target.vacancy_title}</strong> at <strong>${target.company_name}</strong>.</p><p>Objective score recorded: <strong>${objectiveTotal} pts</strong>. Written scenarios have been queued for recruiter rubric review.</p>`,
        templateName: 'assessment_submitted',
      }).catch(err => console.warn('Assessment completion email note:', err.message));

      return res.json({
        success: true,
        objectiveScore: objectiveTotal,
        gradingStatus: 'PENDING_REVIEW',
        message: 'Objective portion scored. Scenario responses queued for recruiter rubric evaluation.',
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// POST /api/candidate-portal/targets/:id/assessment/attempts/:attemptId/evaluate
// Recruiter rubric evaluation for scenario/free-text responses
router.post('/targets/:id/assessment/attempts/:attemptId/evaluate', authenticate, async (req, res) => {
  const { id, attemptId } = req.params;
  const { evaluations } = req.body; // Array of { requirementId, scenarioScore, feedback }

  if (!Array.isArray(evaluations)) {
    return res.status(400).json({ error: 'Evaluations array is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify target and attempt belong to recruiter's authorized company
    const attemptRes = await client.query(
      `SELECT aa.id, aa.target_id, aa.company_id, aa.objective_score, aa.status
       FROM assessment_attempts aa
       WHERE aa.id = $1 AND aa.target_id = $2`,
      [attemptId, id]
    );
    if (attemptRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment attempt not found' });
    }
    const attempt = attemptRes.rows[0];

    // Check recruiter authorization
    if (req.companyMembership?.company_id !== attempt.company_id && !['SUPER_ADMIN', 'GENUAI_ADMIN'].includes((req.user.role || '').toUpperCase())) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized to evaluate assessments for this company' });
    }

    let totalScenarioEarned = 0;

    for (const ev of evaluations) {
      const scoreNum = Math.max(0, Number(ev.scenarioScore) || 0);
      totalScenarioEarned += scoreNum;

      await client.query(
        `UPDATE assessment_requirement_scores
         SET score = score + $1, evaluation_status = 'EVALUATED', assessment_notes = assessment_notes || ' | ' || $2
         WHERE attempt_id = $3 AND requirement_id = $4`,
        [scoreNum, ev.feedback || 'Recruiter rubric applied', attemptId, ev.requirementId]
      );
    }

    const finalScore = Math.min(100, Math.round((Number(attempt.objective_score) || 0) + totalScenarioEarned));

    await client.query(
      `UPDATE assessment_attempts
       SET scenario_score = $1, score = $2, grading_status = 'FULLY_GRADED', evaluator_id = $3, evaluated_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [totalScenarioEarned, finalScore, req.user.id, attemptId]
    );

    // Recompute target coverage with fully evaluated results
    await recomputeTargetCoverage(client, id);

    await client.query('COMMIT');

    return res.json({
      success: true,
      finalScore,
      gradingStatus: 'FULLY_GRADED',
      message: 'Scenario evaluation saved and requirement coverage updated.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Evaluate assessment error:', err);
    return res.status(500).json({ error: 'Failed to evaluate assessment scenarios' });
  } finally {
    client.release();
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

// POST /api/candidate-portal/submit-onboarding
// Mark candidate onboarding as completed in DB (source of truth for gating)
router.post('/submit-onboarding', authenticate, requireCandidate, async (req, res) => {
  try {
    // Ensure candidate row exists
    await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone, location)
       VALUES ($1, $2, $3, '—', 'Global')
       ON CONFLICT (email) DO NOTHING`,
      [req.user.first_name, req.user.last_name, req.user.email]
    );
    await pool.query(
      `UPDATE candidates SET onboarding_submitted = TRUE, updated_at = NOW() WHERE LOWER(email) = LOWER($1)`,
      [req.user.email]
    );
    return res.json({ success: true, onboardingSubmitted: true });
  } catch (err) {
    console.error('Candidate submit-onboarding error:', err);
    return res.status(500).json({ error: 'Failed to submit onboarding' });
  }
});

module.exports = router;
