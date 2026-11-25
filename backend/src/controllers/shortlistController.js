const shortlistService = require('../services/shortlistService');

async function getShortlist(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const data = await shortlistService.getExplainableShortlist(req.params.vacancyId, companyId);
    if (!data) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }
    return res.json(data);
  } catch (err) {
    console.error('Shortlist endpoint error:', err);
    return res.status(500).json({ error: 'Failed to compute explainable shortlist' });
  }
}

async function overrideRank(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId, targetId } = req.params;
    const override = await shortlistService.overrideShortlistRank(
      vacancyId,
      targetId,
      companyId,
      req.user,
      req.body
    );
    return res.status(200).json({
      override,
      message: 'Shortlist ranking override recorded',
    });
  } catch (err) {
    console.error('Shortlist override error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to override shortlist ranking' });
  }
}

async function recordHiringOutcome(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId, targetId } = req.params;
    const outcome = await shortlistService.recordHiringOutcome(
      vacancyId,
      targetId,
      companyId,
      req.user,
      req.body
    );
    return res.status(201).json({ outcome, message: 'Hiring outcome recorded' });
  } catch (err) {
    console.error('Hiring outcome error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to record hiring outcome' });
  }
}

module.exports = {
  getShortlist,
  overrideRank,
  recordHiringOutcome,
};
