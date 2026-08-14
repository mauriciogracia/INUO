import { getProjectPaths, loadState } from './context';
import {
  authenticateMasterPassphrase,
  authenticateMemberPIN,
  authenticateBiometricVoice,
  authenticateLiveVideo,
  authenticateDeviceToken,
  signOutActiveSession,
} from './authEngine';

export function runAuthCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'status';

  if (sub === 'status') {
    const paths = getProjectPaths(rootDir);
    const state = loadState(paths.statePath);
    const active = state.activeUser;

    console.log('\x1b[36m%s\x1b[0m', '=== INUO Active Authentication Session Status ===\n');
    console.log(`User Name:      \x1b[1m${active?.userName || 'Default User'}\x1b[0m`);
    console.log(`User ID:        ${active?.userId || 'user_local'}`);
    console.log(`Role:           \x1b[33m${active?.role || 'RegularUser'}\x1b[0m`);
    console.log(`Trust Score:    \x1b[32m${active?.trustScore ?? 100}/100\x1b[0m (Level: ${active?.trustLevel || 'HighTrust'})`);
    console.log(`Auth Method:    ${active?.lastAuthMethod || 'Default'}`);
    console.log(`Family Member:  ${active?.isFamilyMember ? 'Yes' : 'No'}`);
    console.log(`Authenticated:  ${active?.authenticatedAt}`);
    return;
  }

  if (sub === 'signin' || sub === 'login') {
    let passphrase = '';
    let userName = '';
    let pin = '';
    let voice = '';
    let video = '';
    let device = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--passphrase' && args[i + 1]) passphrase = args[i + 1];
      if (args[i] === '--user' && args[i + 1]) userName = args[i + 1];
      if (args[i] === '--pin' && args[i + 1]) pin = args[i + 1];
      if (args[i] === '--voice' && args[i + 1]) voice = args[i + 1];
      if (args[i] === '--video' && args[i + 1]) video = args[i + 1];
      if (args[i] === '--device' && args[i + 1]) device = args[i + 1];
    }

    if (passphrase) {
      const res = authenticateMasterPassphrase(passphrase, rootDir);
      console.log(res.success ? `\x1b[32m${res.message}\x1b[0m` : `\x1b[31m${res.message}\x1b[0m`);
      return;
    }

    if (userName && pin) {
      const res = authenticateMemberPIN(userName, pin, rootDir);
      console.log(res.success ? `\x1b[32m${res.message}\x1b[0m` : `\x1b[31m${res.message}\x1b[0m`);
      return;
    }

    if (userName && voice) {
      const res = authenticateBiometricVoice(userName, voice, rootDir);
      console.log(res.success ? `\x1b[32m${res.message}\x1b[0m` : `\x1b[31m${res.message}\x1b[0m`);
      return;
    }

    if (userName && video) {
      const res = authenticateLiveVideo(userName, video, rootDir);
      console.log(res.success ? `\x1b[32m${res.message}\x1b[0m` : `\x1b[31m${res.message}\x1b[0m`);
      return;
    }

    if (device) {
      const res = authenticateDeviceToken(device, 'token_dev', rootDir);
      console.log(res.success ? `\x1b[32m${res.message}\x1b[0m` : `\x1b[31m${res.message}\x1b[0m`);
      return;
    }

    console.log('\x1b[33m%s\x1b[0m', 'Usage: auth signin --passphrase <Secret> | --user <Name> --pin <PIN> | --user <Name> --voice <SampleId> | --user <Name> --video <FeedId> | --device <DeviceId>');
    return;
  }

  if (sub === 'signout' || sub === 'logout') {
    signOutActiveSession(rootDir);
    return;
  }

  console.log('Unknown subcommand for auth. Supported: "auth status", "auth signin", "auth signout"');
}
