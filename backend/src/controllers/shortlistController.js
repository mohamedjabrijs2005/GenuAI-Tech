const shortlistService = require('../services/shortlistService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

async function getShortlist(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const filters = {
      proofLevel: req.query.proofLevel || '',
      assessmentStatus: req.query.assessmentStatus || '',
      missingSkill: req.query.missingSkill || '',
      trainableOnly: req.query.trainableOnly === 'true',
    };
    const data = await shortlistService.getExplainableShortlist(req.params.vacancyId, companyId, filters);
    if (!data) {
      return sendError(res, { statusCode: 404, error: 'Vacancy not found or access denied', code: 'NOT_FOUND' });
    }
    return sendSuccess(res, data);
  } catch (err) {
    console.error('Shortlist endpoint error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to compute explainable shortlist' });
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
    return sendSuccess(res, {
      override,
      message: 'Shortlist ranking override recorded',
    });
  } catch (err) {
    console.error('Shortlist override error:', err);
    return sendError(res, { statusCode: err.statusCode || 500, error: err.message || 'Failed to override shortlist ranking', code: 'OVERRIDE_ERROR' });
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
    return sendSuccess(res, { outcome, message: 'Hiring outcome recorded' }, 201);
  } catch (err) {
    console.error('Hiring outcome error:', err);
    return sendError(res, { statusCode: err.statusCode || 500, error: err.message || 'Failed to record hiring outcome', code: 'OUTCOME_ERROR' });
  }
}

async function updateInterviewStage(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId, targetId } = req.params;
    const result = await shortlistService.updateInterviewStage(
      vacancyId,
      targetId,
      companyId,
      req.user,
      req.body
    );
    return sendSuccess(res, { ...result, message: 'Interview stage updated' });
  } catch (err) {
    console.error('Interview stage update error:', err);
    return sendError(res, { statusCode: err.statusCode || 500, error: err.message || 'Failed to update interview stage', code: 'INTERVIEW_STAGE_ERROR' });
  }
}

module.exports = {
  getShortlist,
  overrideRank,
  recordHiringOutcome,
  updateInterviewStage,
};
