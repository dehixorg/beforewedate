export interface CompatibilityInput {
  userAProfile: any;
  userBProfile: any;
  userAConsent: any;
  userBConsent: any;
}

export interface CompatibilityResult {
  eligible: boolean;
  alignmentScore: number; // 0 to 100
  alignedCategories: string[];
  conflicts: string[];
  reasoning: string;
}

/**
 * Deterministic rules engine to compute compatibility
 * before calling LLM.
 */
export const evaluateDeterministicCompatibility = (input: CompatibilityInput): CompatibilityResult => {
  const { userAProfile, userBProfile, userAConsent, userBConsent } = input;

  // 1. Check basic consent bounds
  if (userAConsent.purpose !== 'dating_compatibility' || userBConsent.purpose !== 'dating_compatibility') {
    return { eligible: false, alignmentScore: 0, alignedCategories: [], conflicts: ['Consent purpose mismatch'], reasoning: 'Consent revoked or invalid.' };
  }

  // 2. Identify allowed fields (Intersection)
  const allowedFieldsA = userAConsent.allowedFields || [];
  const allowedFieldsB = userBConsent.allowedFields || [];
  const mutualAllowedFields = allowedFieldsA.filter((field: string) => allowedFieldsB.includes(field));

  let score = 0;
  const alignedCategories: string[] = [];
  const conflicts: string[] = [];

  // Relationship Goal
  if (mutualAllowedFields.includes('relationshipGoal')) {
    if (userAProfile.relationshipGoal === userBProfile.relationshipGoal) {
      score += 40;
      alignedCategories.push('relationshipGoal');
    } else {
      // Hard conflict if they want completely different things
      conflicts.push('relationshipGoal');
      return { eligible: false, alignmentScore: 0, alignedCategories, conflicts, reasoning: 'Misaligned relationship goals.' };
    }
  }

  // Communication Style
  if (mutualAllowedFields.includes('communicationStyle')) {
    if (userAProfile.communicationStyle === userBProfile.communicationStyle) {
      score += 20;
      alignedCategories.push('communicationStyle');
    }
  }

  // Social Energy
  if (mutualAllowedFields.includes('socialEnergy')) {
    if (userAProfile.socialEnergy === userBProfile.socialEnergy) {
      score += 20;
      alignedCategories.push('socialEnergy');
    }
  }

  // Interests overlap
  if (mutualAllowedFields.includes('interests')) {
    const interestsA = userAProfile.interests || [];
    const interestsB = userBProfile.interests || [];
    const shared = interestsA.filter((i: string) => interestsB.includes(i));
    if (shared.length > 0) {
      score += Math.min(20, shared.length * 5); // Max 20 points from interests
      alignedCategories.push('interests');
    }
  }

  const eligible = score >= 50; // Threshold

  return {
    eligible,
    alignmentScore: score,
    alignedCategories,
    conflicts,
    reasoning: eligible ? 'Profiles meet the baseline compatibility criteria.' : 'Insufficient alignment.',
  };
};
