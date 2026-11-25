const skillClaimService = require('../services/skillClaimService');

async function listClaims(req, res) {
  try {
    const claims = await skillClaimService.listClaims(req.candidateId);
    return res.json({ claims });
  } catch (err) {
    console.error('List skill claims error:', err);
    return res.status(500).json({ error: 'Failed to fetch skill claims' });
  }
}

async function createClaims(req, res) {
  try {
    const claims = await skillClaimService.createClaims(req.candidateId, req.user, req.body.claims);
    return res.status(201).json({
      claims,
      message: 'Claims saved. Confirm each claim to use it for matching.',
    });
  } catch (err) {
    console.error('Create skill claims error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create skill claims' });
  }
}

async function confirmClaim(req, res) {
  try {
    const claim = await skillClaimService.confirmClaim(req.params.claimId, req.candidateId, req.user);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    return res.json({ claim, message: 'Claim confirmed' });
  } catch (err) {
    console.error('Confirm skill claim error:', err);
    return res.status(500).json({ error: 'Failed to confirm claim' });
  }
}

async function withdrawClaim(req, res) {
  try {
    const ok = await skillClaimService.withdrawClaim(req.params.claimId, req.candidateId, req.user);
    if (!ok) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    return res.json({ message: 'Claim withdrawn' });
  } catch (err) {
    console.error('Withdraw skill claim error:', err);
    return res.status(500).json({ error: 'Failed to withdraw claim' });
  }
}

async function getTargetProof(req, res) {
  try {
    const proof = await skillClaimService.getTargetProof(req.params.targetId, req.candidateId);
    if (!proof) {
      return res.status(404).json({ error: 'Target not found' });
    }
    return res.json(proof);
  } catch (err) {
    console.error('Candidate proof error:', err);
    return res.status(500).json({ error: 'Failed to compute proof levels' });
  }
}

module.exports = {
  listClaims,
  createClaims,
  confirmClaim,
  withdrawClaim,
  getTargetProof,
};
