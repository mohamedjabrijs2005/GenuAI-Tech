const pool = require('../database/pool');
const { computeTargetSkillProof } = require('./skillProofService');
const { logAudit } = require('./auditService');
const { trackEvent } = require('./analyticsService');

async function recomputeCandidateTargets(db, candidateId) {
  const targetsRes = await db.query(
    `SELECT id FROM targets WHERE candidate_id = $1 AND status NOT IN ('WITHDRAWN', 'CLOSED')`,
    [candidateId]
  );
  for (const row of targetsRes.rows) {
    try {
      await computeTargetSkillProof(db, row.id);
    } catch (err) {
      console.warn(`Proof recompute warning for target ${row.id}:`, err.message);
    }
  }
}

async function listClaims(candidateId) {
  const res = await pool.query(
    `SELECT id, skill_name, claim_text, source, confidence,
            confirmed_by_candidate, confirmed_at, withdrawn_at, created_at, updated_at
     FROM skill_claims
     WHERE candidate_id = $1 AND withdrawn_at IS NULL
     ORDER BY created_at DESC`,
    [candidateId]
  );
  return res.rows;
}

async function createClaims(candidateId, user, claims) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const c of claims) {
      const skillName = String(c.skillName || '').trim();
      if (!skillName || skillName.length > 255) continue;
      const source = ['resume', 'profile', 'manual'].includes(c.source) ? c.source : 'manual';
      const ins = await client.query(
        `INSERT INTO skill_claims (candidate_id, skill_name, claim_text, source)
         VALUES ($1, $2, $3, $4)
         RETURNING id, skill_name, claim_text, source, confirmed_by_candidate, created_at`,
        [candidateId, skillName, c.claimText || null, source]
      );
      inserted.push(ins.rows[0]);
    }
    if (inserted.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('No valid claims provided');
      err.statusCode = 400;
      throw err;
    }

    await logAudit(client, {
      user,
      actorRole: 'CANDIDATE',
      action: 'CANDIDATE_SKILL_CLAIMS_CREATED',
      entityType: 'Candidate',
      entityId: candidateId,
      details: { count: inserted.length, skills: inserted.map((i) => i.skill_name) },
    });

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function confirmClaim(claimId, candidateId, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const upd = await client.query(
      `UPDATE skill_claims
       SET confirmed_by_candidate = TRUE, confirmed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND candidate_id = $2 AND withdrawn_at IS NULL
       RETURNING id, skill_name, source, confirmed_by_candidate, confirmed_at`,
      [claimId, candidateId]
    );
    if (upd.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await recomputeCandidateTargets(client, candidateId);
    await logAudit(client, {
      user,
      actorRole: 'CANDIDATE',
      action: 'CANDIDATE_SKILL_CLAIM_CONFIRMED',
      entityType: 'SkillClaim',
      entityId: claimId,
      newStatus: 'CONFIRMED',
      details: { candidateId, skillName: upd.rows[0].skill_name },
    });

    await client.query('COMMIT');
    await trackEvent('skill_claim_confirmed', {
      userId: user?.id || null,
      properties: { claimId, candidateId, skillName: upd.rows[0].skill_name },
    });
    return upd.rows[0];
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function withdrawClaim(claimId, candidateId, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const upd = await client.query(
      `UPDATE skill_claims SET withdrawn_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND candidate_id = $2 AND withdrawn_at IS NULL
       RETURNING id, skill_name`,
      [claimId, candidateId]
    );
    if (upd.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await recomputeCandidateTargets(client, candidateId);
    await logAudit(client, {
      user,
      actorRole: 'CANDIDATE',
      action: 'CANDIDATE_SKILL_CLAIM_WITHDRAWN',
      entityType: 'SkillClaim',
      entityId: claimId,
      newStatus: 'WITHDRAWN',
      details: { candidateId, skillName: upd.rows[0].skill_name },
    });

    await client.query('COMMIT');
    return true;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function getTargetProof(targetId, candidateId) {
  const own = await pool.query(
    `SELECT id, vacancy_id FROM targets WHERE id = $1 AND candidate_id = $2`,
    [targetId, candidateId]
  );
  if (own.rowCount === 0) {
    return null;
  }
  const proof = await computeTargetSkillProof(pool, own.rows[0].id);
  return { targetId: own.rows[0].id, skills: proof.skills };
}

module.exports = {
  listClaims,
  createClaims,
  confirmClaim,
  withdrawClaim,
  getTargetProof,
};
