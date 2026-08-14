import { getProjectPaths, loadState, saveState } from './context';
import { TrustedMemberConfig } from '../interfaces/TrustedMemberConfig';
import { RelationshipType } from '../types/RelationshipType';
import { getTrustRecord } from './trustEngine';

export function addTrustedMember(
  memberName: string,
  relationshipType: RelationshipType = 'Family',
  trustedDeviceIds: string[] = [],
  rootDir: string = process.cwd()
): TrustedMemberConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.trustedMembers) state.trustedMembers = [];

  const memberId = `member_${memberName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  const trust = getTrustRecord(memberId, 'User', rootDir);

  const member: TrustedMemberConfig = {
    memberId,
    memberName,
    relationshipType,
    trustedDeviceIds,
    trustScore: trust.trustScore,
    trustLevel: trust.trustLevel,
    addedAt: new Date().toISOString(),
  };

  state.trustedMembers.push(member);
  saveState(paths.statePath, state);
  return member;
}

export function bindDeviceToMember(
  memberIdOrName: string,
  deviceId: string,
  rootDir: string = process.cwd()
): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const members = state.trustedMembers || [];

  const member = members.find(
    (m) => m.memberId.toLowerCase() === memberIdOrName.toLowerCase() || m.memberName.toLowerCase() === memberIdOrName.toLowerCase()
  );

  if (!member) {
    console.log('\x1b[31m%s\x1b[0m', `Trusted Member "${memberIdOrName}" not found.`);
    return;
  }

  if (!member.trustedDeviceIds.includes(deviceId)) {
    member.trustedDeviceIds.push(deviceId);
    saveState(paths.statePath, state);
    console.log('\x1b[32m%s\x1b[0m', `✔ Bound device [${deviceId}] to Trusted Member "${member.memberName}" (${member.relationshipType}).`);
  }
}

export function isTrustedFamilyOrFriend(
  userIdOrDeviceId: string,
  rootDir: string = process.cwd()
): boolean {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const members = state.trustedMembers || [];

  return members.some((m) => {
    if (m.relationshipType === 'Family' || m.relationshipType === 'TrustedFriend' || m.relationshipType === 'MasterTrainer') {
      if (m.memberId === userIdOrDeviceId || m.memberName.toLowerCase() === userIdOrDeviceId.toLowerCase()) return true;
      if (m.trustedDeviceIds.includes(userIdOrDeviceId)) return true;
    }
    return false;
  });
}
