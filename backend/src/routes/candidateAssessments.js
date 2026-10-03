const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// POST /api/candidate-assessments/:appId/submit
router.post('/:appId/submit', async (req, res) => {
  const { appId } = req.params;
  const { assessment_group_id, assessment_version_id, answers, raw_score, overall_score } = req.body;
  try {
    const appCheck = await pool.query(
      `SELECT id FROM applications WHERE id=$1 AND candidate_id=(SELECT id FROM candidates WHERE user_id=$2)`,
      [appId, req.user.id]
    );
    if (appCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Not your application.' });
    }

    const result = await pool.query(
      `INSERT INTO assessment_results
         (application_id, assessment_group_id, assessment_version_id, answers, raw_score, overall_score, status, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,'Completed',NOW())
       RETURNING *`,
      [appId, assessment_group_id, assessment_version_id, JSON.stringify(answers || {}), raw_score, overall_score]
    );

    await pool.query('SELECT recompute_evidence_coverage($1)', [appId]).catch(() => {
      // fallback if the helper isn't a stored function — call your existing recompute route logic here instead
    });

    res.json({ result: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
