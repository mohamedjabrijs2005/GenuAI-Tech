const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { computeTargetSkillProof } = require('../services/skillProofService');

const router = express.Router();

// Candidate-role gate (same pattern as candidateInterest.js)
function requireCandidate(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  if (role !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Only candidates can manage skill claims.' });
  }
  next();
}
router.use(authenticate, requireCandidate);

function requireCandidateId(req, res, next) {
  if (!req.user?.candidate_id) {
    return res.status(403).json({ error: 'Candidate profile not found for this user.' });
  }
  req.candidateId = req.user.candidate_id;
  next();
}
router.use(requireCandidateId);

/**
 * GET /api/candidate/skill-claims
 * All skill claims for the authenticated candidate.
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, skill_name, claim_text, source, confidence,
              confirmed_by_candidate, confirmed_at, withdrawn_at, created_at, updated_at
       FROM skill_claims
       WHERE candidate_id = $1 AND withdrawn_at IS NULL
       ORDER BY created_at DESC`,
      [req.candidateId]
    );
    return res.json({ claims: result.rows });
  } catch (err) {
    console.error('List skill claims error:', err);
    return res.status(500).json({ error: 'Failed to fetch skill claims' });
  }
});

/**
 * POST /api/candidate/skill-claims
 * Create one or more skill claims. body: { claims: [{ skillName, claimText?, source? }] }
 * Claims start UNCONFIRMED — candidate must explicitly confirm (consent requirement).
 */
router.post('/', async (req, res) => {
  try {
    const claims = Array.isArray(req.body.claims) ? req.body.claims : [];
    if (claims.length === 0) {
      return res.status(400).json({ error: 'Provide claims: [{ skillName, claimText?, source? }]' });
    }
    if (claims.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 claims per request' });
    }

    const inserted = [];
    for (const c of claims) {
      const skillName = String(c.skillName || '').trim();
      if (!skillName || skillName.length > 255) continue;
      const source = ['resume', 'profile', 'manual'].includes(c.source) ? c.source : 'manual';
      const ins = await pool.query(
        `INSERT INTO skill_claims (candidate_id, skill_name, claim_text, source)
         VALUES ($1, $2, $3, $4)
         RETURNING id, skill_name, claim_text, source, confirmed_by_candidate, created_at`,
        [req.candidateId, skillName, c.claimText || null, source]
      );
      inserted.push(ins.rows[0]);
    }

    if (inserted.length === 0) {
      return res.status(400).json({ error: 'No valid claims provided' });
    }
    return res.status(201).json({ claims: inserted, message: 'Claims saved. Confirm each claim to use it for matching.' });
  } catch (err) {
    console.error('Create skill claims error:', err);
    return res.status(500).json({ error: 'Failed to create skill claims' });
  }
});

/**
 * PATCH /api/candidate/skill-claims/:claimId/confirm
 * Explicit candidate consent/confirmation of one claim.
 */
router.patch('/:claimId/confirm', async (req, res) => {
  try {
    const { claimId } = req.params;
    const upd = await pool.query(
      `UPDATE skill_claims
       SET confirmed_by_candidate = TRUE, confirmed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND candidate_id = $2 AND withdrawn_at IS NULL
       RETURNING id, skill_name, source, confirmed_by_candidate, confirmed_at`,
      [claimId, req.candidateId]
    );
    if (upd.rowCount === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    return res.json({ claim: upd.rows[0], message: 'Claim confirmed' });
  } catch (err) {
    console.error('Confirm skill claim error:', err);
    return res.status(500).json({ error: 'Failed to confirm claim' });
  }
});

/**
 * DELETE /api/candidate/skill-claims/:claimId  (soft withdraw)
 */
router.delete('/:claimId', async (req, res) => {
  try {
    const upd = await pool.query(
      `UPDATE skill_claims SET withdrawn_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND candidate_id = $2 AND withdrawn_at IS NULL
       RETURNING id`,
      [req.params.claimId, req.candidateId]
    );
    if (upd.rowCount === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    return res.json({ message: 'Claim withdrawn' });
  } catch (err) {
    console.error('Withdraw skill claim error:', err);
    return res.status(500).json({ error: 'Failed to withdraw claim' });
  }
});

/**
 * GET /api/candidate/targets/:targetId/proof
 * Candidate-facing proof matrix for one of their own targets.
 */
router.get('/targets/:targetId/proof', async (req, res) => {
  try {
    const own = await pool.query(
      `SELECT id, vacancy_id FROM targets WHERE id = $1 AND candidate_id = $2`,
      [req.params.targetId, req.candidateId]
    );
    if (own.rowCount === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    const proof = await computeTargetSkillProof(pool, own.rows[0].id);
    return res.json({ targetId: own.rows[0].id, skills: proof.skills });
  } catch (err) {
    console.error('Candidate proof error:', err);
    return res.status(500).json({ error: 'Failed to compute proof levels' });
  }
});

module.exports = { router };
