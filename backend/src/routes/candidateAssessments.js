const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { recomputeCoverage } = require('./evidence');

router.use(authenticate);

// POST /api/candidate-assessments/:appId/submit
router.post('/:appId/submit', async (req, res) => {
  const { appId } = req.params;
  const { assessment_group_id, assessment_version_id, answers, raw_score, overall_score } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT a.id, a.vacancy_id, v.company_id, vv.id AS vacancy_version_id
       FROM applications a
       JOIN candidates c ON c.id = a.candidate_id
       JOIN vacancies v ON v.id = a.vacancy_id
       LEFT JOIN vacancy_versions vv ON vv.vacancy_id = v.id AND vv.status = 'active'
       WHERE a.id = $1 AND c.user_id = $2`,
      [appId, req.user.id]
    );
    if (appRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your application.' });
    }
    const { company_id, vacancy_version_id } = appRes.rows[0];

    const result = await client.query(
      `INSERT INTO assessment_results
         (application_id, assessment_group_id, assessment_version_id, answers, raw_score, overall_score, status, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,'Completed',NOW())
       RETURNING *`,
      [appId, assessment_group_id, assessment_version_id, JSON.stringify(answers || {}), raw_score, overall_score]
    );

    await recomputeCoverage(client, appId, company_id, vacancy_version_id);

    await client.query('COMMIT');
    res.json({ result: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
