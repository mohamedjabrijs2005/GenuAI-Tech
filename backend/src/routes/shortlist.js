const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');
const { computeTargetSkillProof, computeOverallFit } = require('../services/skillProofService');
const { recomputeTargetCoverage } = require('./evidenceService');

const router = express.Router();

/**
 * GET /api/company/vacancies/:vacancyId/shortlist
 *
 * Explainable shortlist for ONE vacancy (new GenuAI core).
 * Returns the approved skill checklist plus per-candidate proof matrix:
 *   - per-skill proof level (claimed | assessed | verified | not_assessed)
 *   - status (meets | partial | missing | trainable)
 *   - plain-language reason + evidence/assessment reference
 *   - interview focus for partial/trainable gaps
 *   - fit category: strong | promising | partial | not_ready  (never a universal score)
 *
 * Only candidates with active targets on this vacancy are included.
 */
router.get('/:vacancyId/shortlist', authenticate, requireCompany, async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vacancyId)) {
      return res.status(400).json({ error: 'Invalid vacancy id' });
    }

    // Ownership + vacancy context
    const vacRes = await pool.query(
      `SELECT cr.id, cr.title, cr.company_id, cr.status
       FROM company_roles cr
       WHERE cr.id = $1 AND cr.company_id = $2`,
      [vacancyId, companyId]
    );
    if (vacRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }
    const vacancy = vacRes.rows[0];

    // Checklist = approved vacancy requirements
    const reqsRes = await pool.query(
      `SELECT id, name, importance, requirement_type
       FROM requirements WHERE role_id = $1 ORDER BY created_at ASC`,
      [vacancyId]
    );
    const checklist = reqsRes.rows.map((r) => ({
      requirementId: r.id,
      skill: r.name,
      type: (String(r.importance).toUpperCase().includes('PREFERRED') || String(r.importance).toUpperCase().includes('GOOD'))
        ? 'good_to_have' : 'must_have',
    }));

    // Candidates with active targets on this vacancy
    const targetsRes = await pool.query(
      `SELECT t.id, t.candidate_id, t.status, t.recruiter_decision,
              c.first_name, c.last_name
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND t.status NOT IN ('WITHDRAWN', 'CLOSED')
       ORDER BY t.created_at DESC`,
      [vacancyId, companyId]
    );

    const candidates = [];
    for (const t of targetsRes.rows) {
      let proof;
      try {
        proof = await computeTargetSkillProof(pool, t.id);
      } catch (err) {
        console.error(`Proof computation failed for target ${t.id}:`, err.message);
        continue;
      }
      // Keep the legacy coverage snapshot in sync
      try { await recomputeTargetCoverage(pool, t.id); } catch (_) { }

      const skills = proof.skills.map((s) => {
        const checklistItem = checklist.find((c) => c.requirementId === s.requirementId);
        return {
          skill: s.skillName,
          proofLevel: s.proofLevel,
          status: s.status,
          score: s.score,
          trainable: s.trainable,
          reason: s.reason,
          recommendedAction:
            s.status === 'partial' && s.proofLevel === 'claimed'
              ? `Send a short assessment for "${s.skillName}"`
              : s.status === 'trainable'
                ? `Discuss "${s.skillName}" as a trainable gap in the interview`
                : null,
          interviewFocus:
            s.status === 'partial' || s.status === 'trainable'
              ? `Validate "${s.skillName}" through a practical task in the interview`
              : null,
          type: checklistItem ? checklistItem.type : 'must_have',
        };
      });

      candidates.push({
        targetId: t.id,
        candidateId: t.candidateId || t.candidate_id,
        displayName: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Candidate',
        targetStatus: t.status,
        recruiterDecision: t.recruiter_decision || null,
        overallFit: computeOverallFit(proof.skills),
        skills,
        interviewFocus: skills
          .filter((s) => s.interviewFocus)
          .map((s) => s.interviewFocus),
      });
    }

    // Fit ordering: strong > promising > partial > not_ready
    const fitOrder = { strong: 0, promising: 1, partial: 2, not_ready: 3 };
    candidates.sort((a, b) => fitOrder[a.overallFit] - fitOrder[b.overallFit]);

    return res.json({
      vacancyId,
      vacancyTitle: vacancy.title,
      vacancyStatus: vacancy.status,
      checklist,
      candidates,
      count: candidates.length,
      note: 'Fit is measured only against this specific vacancy. No universal job-readiness score is used.',
    });
  } catch (err) {
    console.error('Shortlist endpoint error:', err);
    return res.status(500).json({ error: 'Failed to compute explainable shortlist' });
  }
});

/**
 * POST /api/company/vacancies/:vacancyId/candidates/:targetId/hiring-outcome
 * Structured HR hiring outcome record (rejected | offered | joined | on_hold).
 */
router.post('/:vacancyId/candidates/:targetId/hiring-outcome', authenticate, requireCompany, async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId, targetId } = req.params;
    const { decision, reasonCode, notes } = req.body;

    const valid = ['rejected', 'offered', 'joined', 'on_hold'];
    if (!decision || !valid.includes(String(decision).toLowerCase())) {
      return res.status(400).json({ error: `Invalid decision. Allowed: ${valid.join(', ')}` });
    }

    const tRes = await pool.query(
      `SELECT t.id, t.candidate_id, t.company_id FROM targets t
       WHERE t.id = $1 AND t.vacancy_id = $2 AND t.company_id = $3`,
      [targetId, vacancyId, companyId]
    );
    if (tRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target not found for this vacancy/company' });
    }
    const target = tRes.rows[0];

    const insRes = await pool.query(
      `INSERT INTO hiring_outcomes
         (target_id, vacancy_id, company_id, candidate_id, decision, reason_code, notes, decided_by, decided_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [targetId, vacancyId, companyId, target.candidate_id,
        String(decision).toLowerCase(), reasonCode || null, notes || null, req.user.id]
    );

    // Audit trail (matches existing audit_logs usage)
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'RECRUITER_HIRING_OUTCOME', 'target', $2, $3)`,
      [req.user.id, targetId, JSON.stringify({ decision, reasonCode })]
    );

    return res.status(201).json({ outcome: insRes.rows[0], message: 'Hiring outcome recorded' });
  } catch (err) {
    console.error('Hiring outcome error:', err);
    return res.status(500).json({ error: 'Failed to record hiring outcome' });
  }
});

module.exports = { router };
