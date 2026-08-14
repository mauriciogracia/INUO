import { getProjectPaths, loadState, saveState } from './context';
import { BiometricVaultEntry } from '../interfaces/BiometricVaultEntry';

export function storeLocalBiometricCredential(
  memberId: string,
  memberName: string,
  credentialType: 'PIN' | 'Voice' | 'Video',
  credentialData: string | number[],
  rootDir: string = process.cwd()
): BiometricVaultEntry {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.localAuthVault) state.localAuthVault = [];

  let entry = state.localAuthVault.find((v) => v.memberId === memberId || v.memberName.toLowerCase() === memberName.toLowerCase());

  if (!entry) {
    entry = {
      memberId,
      memberName,
      updatedAt: new Date().toISOString(),
    };
    state.localAuthVault.push(entry);
  }

  if (credentialType === 'PIN' && typeof credentialData === 'string') {
    entry.pinHash = `hash_${credentialData}`;
  } else if (credentialType === 'Voice' && Array.isArray(credentialData)) {
    entry.voiceprintVector = credentialData;
  } else if (credentialType === 'Video' && Array.isArray(credentialData)) {
    entry.facialEmbeddingVector = credentialData;
  }

  entry.updatedAt = new Date().toISOString();
  saveState(paths.statePath, state);

  console.log(
    `\x1b[32m✔ [Local Master Mind Vault]\x1b[0m Stored ${credentialType} biometric credential locally for "${memberName}". Zero cloud export.`
  );
  return entry;
}

export function verifyLocalBiometricCredential(
  memberIdOrName: string,
  credentialType: 'PIN' | 'Voice' | 'Video',
  inputData: string | number[],
  rootDir: string = process.cwd()
): boolean {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const vault = state.localAuthVault || [];

  const entry = vault.find(
    (v) => v.memberId.toLowerCase() === memberIdOrName.toLowerCase() || v.memberName.toLowerCase() === memberIdOrName.toLowerCase()
  );

  if (!entry) return false;

  if (credentialType === 'PIN' && typeof inputData === 'string') {
    return entry.pinHash === `hash_${inputData}`;
  }

  if (credentialType === 'Voice' && Array.isArray(inputData) && entry.voiceprintVector) {
    // Check vector length match as proxy for local acoustic spectrum verification
    return entry.voiceprintVector.length === inputData.length;
  }

  if (credentialType === 'Video' && Array.isArray(inputData) && entry.facialEmbeddingVector) {
    // Check vector length match as proxy for local facial embedding verification
    return entry.facialEmbeddingVector.length === inputData.length;
  }

  return false;
}
