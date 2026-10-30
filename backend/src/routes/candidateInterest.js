const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');

function requireCandidate(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  if (role !== 'CANDIDATE' && role !== 'APPLICANT' && role !== 'USER') {
    return res.status(403).json({ error: 'Forbidden: Requires Candidate account.' });
  }
  next();
}

const router = express.Router();
router.use(authenticate, requireCandidate);

// Helper to resolve or create candidate ID from authenticated user
async function getCandidateId(user) {
  let candRes = await pool.query('SELECT id FROM candidates WHERE email = $1', [user.email]);
  if (candRes.rowCount > 0) return candRes.rows[0].id;

  const newCand = await pool.query(
    `INSERT INTO candidates (first_name, last_name, email, phone, location)
     VALUES ($1, $2, $3, '—', 'Global')
     RETURNING id`,
    [user.first_name || 'Alex', user.last_name || 'Candidate', user.email]
  );
  return newCand.rows[0].id;
}

// ============================================================
// POST /vacancies/:vacancyId/interest
// Express interest in a PUBLISHED vacancy
// ============================================================
router.post('/vacancies/:vacancyId/interest', async (req, res) => {
  const { vacancyId } = req.params;

  // Validate UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vacancyId);
  if (!isUUID) {
    return res.status(404).json({ error: 'Vacancy not found or access denied' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch vacancy & company verification
    const vacRes = await client.query(
      `SELECT cr.id, cr.company_id, cr.title, cr.status, cr.closing_date, cr.application_deadline,
              c.name AS company_name, c.verification_status AS company_status, c.suspended_at
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1`,
      [vacancyId]
    );

    if (vacRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacRes.rows[0];

    // Rule: Candidate can express interest ONLY in PUBLISHED vacancies
    if (vacancy.status !== 'PUBLISHED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot express interest in vacancy with status '${vacancy.status}'. Only PUBLISHED vacancies accept candidate interest.`,
        status: vacancy.status,
      });
    }

    // Rule: Hiring company must be APPROVED/ACTIVE and non-suspended
    if (!['APPROVED', 'ACTIVE'].includes(vacancy.company_status) || vacancy.suspended_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cannot express interest: Hiring employer is not verified or is suspended.',
      });
    }

    // Rule: Deadline check
    const now = new Date();
    if (vacancy.closing_date && new Date(vacancy.closing_date) < now) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot express interest: Application deadline has passed.' });
    }
    if (vacancy.application_deadline && new Date(vacancy.application_deadline) < now) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot express interest: Application deadline has passed.' });
    }

    // 2. Resolve active vacancy version
    let verRes = await client.query(
      `SELECT id, version_number FROM vacancy_versions
       WHERE role_id = $1 AND (status = 'Published' OR status = 'Approved')
       ORDER BY version_number DESC LIMIT 1`,
      [vacancyId]
    );

    let vacancyVersionId = null;
    if (verRes.rowCount > 0) {
      vacancyVersionId = verRes.rows[0].id;
    } else {
      const newVer = await client.query(
        `INSERT INTO vacancy_versions (role_id, company_id, version_number, status, change_summary, published_at)
         VALUES ($1, $2, 1, 'Published', 'Initial Published Version', NOW())
         RETURNING id`,
        [vacancyId, vacancy.company_id]
      );
      vacancyVersionId = newVer.rows[0].id;
    }

    const candidateId = await getCandidateId(req.user);

    // 3. Rule: One interest record per candidate per vacancy version (prevent duplicates)
    const existingInterest = await client.query(
      `SELECT id, interest_status FROM candidate_interest
       WHERE candidate_id = $1 AND vacancy_id = $2
         AND (vacancy_version_id = $3 OR (vacancy_version_id IS NULL AND $3 IS NULL))`,
      [candidateId, vacancyId, vacancyVersionId]
    );

    if (existingInterest.rowCount > 0) {
      const current = existingInterest.rows[0];
      if (current.interest_status === 'EXPRESSED') {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Duplicate interest: You have already expressed interest in this vacancy version.',
          interestId: current.id,
        });
      } else {
        // Reactivate previously withdrawn interest
        const updateRes = await client.query(
          `UPDATE candidate_interest
           SET interest_status = 'EXPRESSED', updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [current.id]
        );
        await client.query('COMMIT');
        return res.status(200).json({
          success: true,
          message: 'Interest re-expressed successfully',
          interest: updateRes.rows[0],
        });
      }
    }

    // 4. Insert new interest record
    const insertRes = await client.query(
      `INSERT INTO candidate_interest
         (candidate_id, company_id, vacancy_id, role_id, vacancy_version_id, interest_status, created_at, updated_at)
       VALUES ($1, $2, $3, $3, $4, 'EXPRESSED', NOW(), NOW())
       RETURNING *`,
      [candidateId, vacancy.company_id, vacancyId, vacancyVersionId]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Interest expressed successfully',
      interest: insertRes.rows[0],
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Express interest error:', err);
    return res.status(500).json({ error: 'Failed to record interest in vacancy' });
  } finally {
    client.release();
  }
});

// ============================================================
// DELETE /vacancies/:vacancyId/interest
// Withdraw interest from a vacancy
// ============================================================
router.delete('/vacancies/:vacancyId/interest', async (req, res) => {
  const { vacancyId } = req.params;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vacancyId);
  if (!isUUID) {
    return res.status(404).json({ error: 'Vacancy not found' });
  }

  try {
    const candidateId = await getCandidateId(req.user);

    const result = await pool.query(
      `UPDATE candidate_interest
       SET interest_status = 'WITHDRAWN', updated_at = NOW()
       WHERE candidate_id = $1 AND vacancy_id = $2 AND interest_status = 'EXPRESSED'
       RETURNING id`,
      [candidateId, vacancyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Active interest record not found for this vacancy' });
    }

    return res.json({
      success: true,
      message: 'Interest withdrawn successfully',
      interest: {
        id: result.rows[0].id,
        interest_status: 'WITHDRAWN',
      },
    });
  } catch (err) {
    console.error('Withdraw interest error:', err);
    return res.status(500).json({ error: 'Failed to withdraw interest' });
  }
});

// ============================================================
// GET /interests
// List all active vacancy interests for candidate
// ============================================================
router.get('/interests', async (req, res) => {
  try {
    const candidateId = await getCandidateId(req.user);

    const result = await pool.query(
      `SELECT ci.id AS interest_id, ci.interest_status, ci.created_at AS interested_at,
              cr.id AS vacancy_id, cr.title AS vacancy_title, cr.experience_level,
              cr.location, cr.work_mode, cr.salary_range, cr.status AS vacancy_status,
              cr.id AS role_id,
              d.name AS department_name,
              c.id AS company_id, c.name AS company_name, c.verification_status AS company_status,
              vv.id AS vacancy_version_id, vv.version_number,
              t.id AS target_id, t.status AS target_status
       FROM candidate_interest ci
       JOIN company_roles cr ON cr.id = ci.vacancy_id
       JOIN companies c ON c.id = ci.company_id
       LEFT JOIN departments d ON d.id = cr.department_id
       LEFT JOIN vacancy_versions vv ON vv.id = ci.vacancy_version_id
       LEFT JOIN targets t ON t.vacancy_id = ci.vacancy_id AND t.candidate_id = ci.candidate_id
       WHERE ci.candidate_id = $1 AND ci.interest_status = 'EXPRESSED'
       ORDER BY ci.created_at DESC`,
      [candidateId]
    );

    return res.json({
      interests: result.rows,
      count: result.rowCount,
    });
  } catch (err) {
    console.error('List interests error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate interests' });
  }
});

module.exports = router;
