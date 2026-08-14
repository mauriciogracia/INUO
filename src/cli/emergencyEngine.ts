import { getProjectPaths, loadState, saveState } from './context';
import { EmergencyContext } from '../interfaces/EmergencyContext';
import { penalizeTrust } from './trustEngine';
import { isTrustedFamilyOrFriend } from './trustedMemberEngine';


export function triggerEmergencyIncapacitation(

  ownerUserId: string,
  location: string = 'Vulnerable_Area',
  familyMemberUserIds: string[] = [],
  rootDir: string = process.cwd()
): EmergencyContext {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  const emergency: EmergencyContext = {
    status: 'OwnerIncapacitated',
    incapacitatedUser: ownerUserId,
    authorizedFamilyUserIds: familyMemberUserIds,
    emergencyLocation: location,
    activatedAt: new Date().toISOString(),
  };

  state.emergencyContext = emergency;
  saveState(paths.statePath, state);

  console.log('\x1b[31m%s\x1b[0m', `🚨 [EMERGENCY ACTIVATED] Owner Incapacitation Detected! Location: ${location}`);
  console.log(`  Family Fallback Active for ${familyMemberUserIds.length} pre-registered family member(s). Strangers BLOCKED.`);

  return emergency;
}

export function authorizeEmergencyCommand(
  callerUserId: string,
  isFamilyMember: boolean = false,
  commandText: string = '',
  rootDir: string = process.cwd()
): { allowed: boolean; reason: string } {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const emergency = state.emergencyContext;

  if (!emergency || emergency.status === 'Normal') {
    return { allowed: true, reason: 'System operating under normal state.' };
  }

  // Under OwnerIncapacitated emergency state
  const isAuthorizedFamily = isFamilyMember || emergency.authorizedFamilyUserIds.includes(callerUserId) || isTrustedFamilyOrFriend(callerUserId, rootDir);

  if (isAuthorizedFamily) {
    return {
      allowed: true,
      reason: `Emergency command allowed for authorized family member/friend [ID/Device: ${callerUserId}].`,
    };
  }


  // Caller is an unverified stranger during an emergency -> BLOCK AND DISCONNECT
  penalizeTrust(callerUserId, 'User', 100, `Stranger attempted instruction during vehicle owner incapacitation`, rootDir);

  return {
    allowed: false,
    reason: `❌ [Emergency Defense Block] Caller [ID: ${callerUserId}] is an unverified stranger. Control denied during owner incapacitation emergency.`,
  };
}
