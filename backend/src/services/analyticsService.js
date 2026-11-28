const pool = require('../database/pool');

const CORE_EVENTS = new Set([
  'vacancy_created',
  'checklist_approved',
  'candidate_applied',
  'skill_claim_confirmed',
  'shortlist_viewed',
  'assessment_invited',
  'interview_stage_updated',
  'hr_override_used',
  'hiring_outcome_recorded',
]);

/**
 * Non-blocking analytics event recorder for the core pilot funnel.
 * Never throws into request handlers.
 */
async function trackEvent(eventName, {
  userId = null,
  companyId = null,
  vacancyId = null,
  targetId = null,
  properties = {},
} = {}, dbOrPool = null) {
  try {
    if (!CORE_EVENTS.has(eventName)) return;
    const db = dbOrPool || pool;
    await db.query(
      `INSERT INTO analytics_events (event_name, user_id, company_id, vacancy_id, target_id, properties)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventName, userId, companyId, vacancyId, targetId, JSON.stringify(properties || {})]
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[analytics] failed to record ${eventName}:`, err.message);
    }
  }
}

async function getPilotFunnelSummary(companyId = null) {
  const where = companyId ? 'WHERE company_id = $1' : '';
  const params = companyId ? [companyId] : [];
  const res = await pool.query(
    `SELECT event_name, COUNT(*)::int AS count, MAX(created_at) AS last_seen
     FROM analytics_events
     ${where}
     GROUP BY event_name`,
    params
  );
  const summary = {};
  for (const name of CORE_EVENTS) summary[name] = { count: 0, lastSeen: null };
  for (const row of res.rows) {
    summary[row.event_name] = { count: row.count, lastSeen: row.last_seen };
  }
  return summary;
}

module.exports = {
  CORE_EVENTS,
  trackEvent,
  getPilotFunnelSummary,
};
