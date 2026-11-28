export interface SkillProofItem {
  requirementId?: string;
  requirement_id?: string;
  skillName?: string;
  skill_name?: string;
  importance?: string;
  proofLevel?: string;
  proof_level?: string;
  status?: string;
  trainable?: boolean;
  reason?: string;
  evidenceId?: string | null;
  assessmentResultId?: string | null;
}

export function findSkillProofForRequirement(
  proofs: SkillProofItem[],
  requirement: { id?: string; name?: string }
): SkillProofItem | undefined {
  const requirementId = String(requirement.id || '');
  const skillName = String(requirement.name || '').trim().toLowerCase();
  return proofs.find((proof) => {
    const proofRequirementId = String(proof.requirementId || proof.requirement_id || '');
    const proofSkillName = String(proof.skillName || proof.skill_name || '').trim().toLowerCase();
    return (requirementId && proofRequirementId === requirementId) || (skillName && proofSkillName === skillName);
  });
}

export function getProofNextAction(proof?: SkillProofItem) {
  const level = String(proof?.proofLevel || proof?.proof_level || 'not_assessed').toLowerCase();
  const status = String(proof?.status || '').toLowerCase();
  if (level === 'verified') return 'Proof verified';
  if (level === 'assessed' && status === 'meets') return 'Assessment passed';
  if (level === 'assessed') return 'Review assessment and add supporting evidence';
  if (level === 'claimed') return 'Submit evidence or complete an assessment';
  if (status === 'trainable' || proof?.trainable) return 'Build adjacent proof, then submit evidence';
  return 'Confirm your skill claim and submit evidence';
}
