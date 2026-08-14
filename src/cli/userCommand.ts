import { getProjectPaths, loadState, saveState } from './context';
import { UserIdentity } from '../interfaces/UserIdentity';
import { UserRole } from '../types/UserRole';

import { getTrustRecord } from './trustEngine';

export function runWhoamiCommand(rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const user = state.activeUser || {
    userId: 'user_local',
    userName: 'MasterTrainer',
    role: state.currentRole || 'MasterTrainer',
    authenticatedAt: new Date().toISOString(),
  };

  const trustRecord = getTrustRecord(user.userId, 'User', rootDir);

  console.log('\x1b[36m%s\x1b[0m', '=== Active User Session Identity ===');
  console.log(`\x1b[1mUser ID:\x1b[0m ${user.userId}`);
  console.log(`\x1b[1mUser Name:\x1b[0m ${user.userName}`);
  console.log(`\x1b[1mGovernance Role:\x1b[0m \x1b[32m${user.role}\x1b[0m`);
  console.log(`\x1b[1mTrust Score:\x1b[0m \x1b[33m${trustRecord.trustScore}/100 (${trustRecord.trustLevel})\x1b[0m`);
  console.log(`\x1b[1mAuthenticated At:\x1b[0m ${user.authenticatedAt}`);
}


export function runUserSetCommand(args: string[], rootDir: string = process.cwd()): void {
  const name = args[0];
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!name) {
    console.log('\x1b[33m%s\x1b[0m', 'Usage: user set <name> [--role MasterTrainer|RegularUser]');
    return;
  }

  let role: UserRole = state.currentRole || 'RegularUser';
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--role' && args[i + 1]) {
      const r = args[i + 1].toLowerCase();
      if (r === 'mastertrainer' || r === 'master') role = 'MasterTrainer';
      if (r === 'regularuser' || r === 'user') role = 'RegularUser';
    }
  }

  const updatedUser: UserIdentity = {
    userId: `usr_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    userName: name,
    role,
    authenticatedAt: new Date().toISOString(),
  };

  state.activeUser = updatedUser;
  state.currentRole = role;
  saveState(paths.statePath, state);

  console.log('\x1b[32m%s\x1b[0m', `✔ Identity Updated: Active user set to "${updatedUser.userName}" (Role: ${updatedUser.role})`);
}
