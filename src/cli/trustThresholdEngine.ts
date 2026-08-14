import { getProjectPaths, loadState, saveState } from './context';
import { TrustThresholdGate } from '../interfaces/TrustThresholdGate';
import { getTrustRecord } from './trustEngine';

export function createThresholdGate(
  assetName: string,
  requiredTrustScore: number = 150,
  protectedData: string = '',
  rootDir: string = process.cwd()
): TrustThresholdGate {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.thresholdGates) state.thresholdGates = [];

  const gateId = `gate_${assetName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  const gate: TrustThresholdGate = {
    gateId,
    assetName,
    requiredTrustScore,
    protectedData,
    createdByRole: state.currentRole || 'RegularUser',
    updatedAt: new Date().toISOString(),
  };

  state.thresholdGates.push(gate);
  saveState(paths.statePath, state);
  return gate;
}

export function evaluateThresholdAccess(
  assetNameOrId: string,
  coSigningMemberIds: string[],
  rootDir: string = process.cwd()
): { granted: boolean; combinedScore: number; requiredScore: number; reason: string; protectedData?: string } {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const gates = state.thresholdGates || [];

  const gate = gates.find(
    (g) => g.gateId.toLowerCase() === assetNameOrId.toLowerCase() || g.assetName.toLowerCase() === assetNameOrId.toLowerCase()
  );

  if (!gate) {
    return {
      granted: false,
      combinedScore: 0,
      requiredScore: 0,
      reason: `❌ Protected asset "${assetNameOrId}" not found in threshold gates registry.`,
    };
  }

  // Calculate combined sum of trust scores across all co-signing members
  let combinedScore = 0;
  let hasBlacklistedMember = false;

  const members = state.trustedMembers || [];

  for (const memberIdOrName of coSigningMemberIds) {
    const member = members.find(
      (m) => m.memberId.toLowerCase() === memberIdOrName.toLowerCase() || m.memberName.toLowerCase() === memberIdOrName.toLowerCase()
    );

    const targetId = member ? member.memberId : memberIdOrName;
    const trust = getTrustRecord(targetId, 'User', rootDir);

    if (trust.isBlacklisted || trust.trustScore < 30) {
      hasBlacklistedMember = true;
      break;
    }

    combinedScore += trust.trustScore;
  }

  if (hasBlacklistedMember) {
    return {
      granted: false,
      combinedScore,
      requiredScore: gate.requiredTrustScore,
      reason: `❌ [Threshold Gate Block] One of the co-signing members is blacklisted or untrusted. Access DENIED.`,
    };
  }

  if (combinedScore >= gate.requiredTrustScore) {
    return {
      granted: true,
      combinedScore,
      requiredScore: gate.requiredTrustScore,
      protectedData: gate.protectedData,
      reason: `✔ [Threshold Gate Unlocked] Combined trust score ${combinedScore} meets or exceeds required threshold ${gate.requiredTrustScore} (${coSigningMemberIds.length} co-signing member(s)).`,
    };
  }

  return {
    granted: false,
    combinedScore,
    requiredScore: gate.requiredTrustScore,
    reason: `❌ [Threshold Gate Denied] Combined trust score ${combinedScore} is below required threshold ${gate.requiredTrustScore}. Add more co-signing trusted members.`,
  };
}
