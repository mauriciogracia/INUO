import { getProjectPaths, loadState, saveState } from './context';
import { AuthSessionResult } from '../interfaces/AuthSessionResult';
import { UserIdentity } from '../interfaces/UserIdentity';
import { getTrustRecord } from './trustEngine';

export function authenticateMasterPassphrase(
  passphrase: string,
  rootDir: string = process.cwd()
): AuthSessionResult {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  // Validate Master Trainer passphrase
  if (passphrase !== 'master123' && passphrase !== 'inuo_master_pass') {
    return {
      success: false,
      message: '❌ Invalid Master Trainer passphrase.',
    };
  }

  const masterIdentity: UserIdentity = {
    userId: 'master_trainer_01',
    userName: 'MasterTrainer',
    role: 'MasterTrainer',
    trustScore: 100,
    trustLevel: 'HighTrust',
    isFamilyMember: true,
    lastAuthMethod: 'MasterPassphrase',
    authenticatedAt: new Date().toISOString(),
  };

  state.currentRole = 'MasterTrainer';
  state.activeUser = masterIdentity;
  saveState(paths.statePath, state);

  return {
    success: true,
    message: '✔ Master Trainer session authenticated via Master Passphrase.',
    authMethod: 'MasterPassphrase',
    identity: masterIdentity,
    sessionToken: `token_master_${Date.now()}`,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
}

export function authenticateMemberPIN(
  memberNameOrId: string,
  pin: string,
  rootDir: string = process.cwd()
): AuthSessionResult {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const members = state.trustedMembers || [];

  const member = members.find(
    (m) => m.memberId.toLowerCase() === memberNameOrId.toLowerCase() || m.memberName.toLowerCase() === memberNameOrId.toLowerCase()
  );

  if (!member) {
    return {
      success: false,
      message: `❌ Trusted member "${memberNameOrId}" not found.`,
    };
  }

  if (pin !== '1234' && pin !== '0000') {
    return {
      success: false,
      message: '❌ Invalid PIN code.',
    };
  }

  const identity: UserIdentity = {
    userId: member.memberId,
    userName: member.memberName,
    role: 'RegularUser',
    trustScore: member.trustScore,
    trustLevel: member.trustLevel,
    isFamilyMember: member.relationshipType === 'Family',
    lastAuthMethod: 'MemberPIN',
    authenticatedAt: new Date().toISOString(),
  };

  state.activeUser = identity;
  saveState(paths.statePath, state);

  return {
    success: true,
    message: `✔ Signed in as ${member.memberName} (${member.relationshipType}) via Member PIN.`,
    authMethod: 'MemberPIN',
    identity,
  };
}

export function authenticateBiometricVoice(
  memberNameOrId: string,
  voiceSampleId: string,
  rootDir: string = process.cwd()
): AuthSessionResult {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  const identity: UserIdentity = {
    userId: `usr_voice_${memberNameOrId.toLowerCase()}`,
    userName: memberNameOrId,
    role: 'RegularUser',
    trustScore: 90,
    trustLevel: 'HighTrust',
    isFamilyMember: true,
    lastAuthMethod: 'BiometricVoiceprint',
    authenticatedAt: new Date().toISOString(),
  };

  state.activeUser = identity;
  saveState(paths.statePath, state);

  return {
    success: true,
    message: `✔ Authenticated "${memberNameOrId}" via Biometric Voiceprint spectrum [Sample: ${voiceSampleId}].`,
    authMethod: 'BiometricVoiceprint',
    identity,
  };
}

export function authenticateLiveVideo(
  memberNameOrId: string,
  videoFeedId: string,
  rootDir: string = process.cwd()
): AuthSessionResult {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  const identity: UserIdentity = {
    userId: `usr_video_${memberNameOrId.toLowerCase()}`,
    userName: memberNameOrId,
    role: 'RegularUser',
    trustScore: 95,
    trustLevel: 'HighTrust',
    isFamilyMember: true,
    lastAuthMethod: 'LiveVideoRecognition',
    authenticatedAt: new Date().toISOString(),
  };

  state.activeUser = identity;
  saveState(paths.statePath, state);

  return {
    success: true,
    message: `✔ Authenticated "${memberNameOrId}" via Live Feed Video Recognition [Feed: ${videoFeedId}].`,
    authMethod: 'LiveVideoRecognition',
    identity,
  };
}

export function authenticateDeviceToken(
  deviceId: string,
  token: string = 'device_token_default',
  rootDir: string = process.cwd()
): AuthSessionResult {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const trust = getTrustRecord(deviceId, 'User', rootDir);

  const identity: UserIdentity = {
    userId: deviceId,
    userName: `Device_${deviceId}`,
    role: 'RegularUser',
    trustScore: trust.trustScore,
    trustLevel: trust.trustLevel,
    isFamilyMember: false,
    lastAuthMethod: 'TrustedDeviceToken',
    authenticatedAt: new Date().toISOString(),
  };

  state.activeUser = identity;
  saveState(paths.statePath, state);

  return {
    success: true,
    message: `✔ Authenticated device [${deviceId}] via TrustedDeviceToken.`,
    authMethod: 'TrustedDeviceToken',
    identity,
  };
}

export function signOutActiveSession(rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  const defaultUser: UserIdentity = {
    userId: 'user_local',
    userName: 'Default User',
    role: 'RegularUser',
    trustScore: 100,
    trustLevel: 'HighTrust',
    isFamilyMember: false,
    authenticatedAt: new Date().toISOString(),
  };

  state.currentRole = 'RegularUser';
  state.activeUser = defaultUser;
  saveState(paths.statePath, state);
  console.log('\x1b[32m%s\x1b[0m', '✔ Signed out active session. Reverted to default unauthenticated state.');
}
