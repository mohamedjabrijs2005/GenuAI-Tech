/**
 * Shared candidate notification helper.
 * Persists in-app notifications into `candidate_notifications`.
 */
async function createCandidateNotification(db, { candidateId, title, message, type = 'INFO', link = null }) {
  if (!candidateId || !title || !message) return null;
  const res = await db.query(
    `INSERT INTO candidate_notifications (candidate_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [candidateId, title, message, type, link]
  );
  return res.rows[0] || null;
}

module.exports = { createCandidateNotification };
