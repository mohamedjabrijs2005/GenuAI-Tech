const skillClaimService = require('../services/skillClaimService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

async function listClaims(req, res) {
  try {
    const claims = await skillClaimService.listClaims(req.candidateId);
    return sendSuccess(res, { claims });
  } catch (err) {
    console.error('List skill claims error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to fetch skill claims' });
  }
}

async function createClaims(req, res) {
  try {
    const claims = await skillClaimService.createClaims(req.candidateId, req.user, req.body.claims);
    return sendSuccess(res, {
      claims,
      message: 'Claims saved. Confirm each claim to use it for matching.',
    }, 201);
  } catch (err) {
    console.error('Create skill claims error:', err);
    return sendError(res, { statusCode: err.statusCode || 500, error: err.message || 'Failed to create skill claims', code: 'SKILL_CLAIM_ERROR' });
  }
}

async function confirmClaim(req, res) {
  try {
    const claim = await skillClaimService.confirmClaim(req.params.claimId, req.candidateId, req.user);
    if (!claim) {
      return sendError(res, { statusCode: 404, error: 'Claim not found', code: 'NOT_FOUND' });
    }
    return sendSuccess(res, { claim, message: 'Claim confirmed' });
  } catch (err) {
    console.error('Confirm skill claim error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to confirm claim' });
  }
}

async function withdrawClaim(req, res) {
  try {
    const ok = await skillClaimService.withdrawClaim(req.params.claimId, req.candidateId, req.user);
    if (!ok) {
      return sendError(res, { statusCode: 404, error: 'Claim not found', code: 'NOT_FOUND' });
    }
    return sendSuccess(res, { message: 'Claim withdrawn' });
  } catch (err) {
    console.error('Withdraw skill claim error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to withdraw claim' });
  }
}

async function getTargetProof(req, res) {
  try {
    const proof = await skillClaimService.getTargetProof(req.params.targetId, req.candidateId);
    if (!proof) {
      return sendError(res, { statusCode: 404, error: 'Target not found', code: 'NOT_FOUND' });
    }
    return sendSuccess(res, proof);
  } catch (err) {
    console.error('Candidate proof error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to compute proof levels' });
  }
}

module.exports = {
  listClaims,
  createClaims,
  confirmClaim,
  withdrawClaim,
  getTargetProof,
};
