import fs from 'fs';
import { createContext } from './context';

export function runRollback(previousVersion: string, rootDir: string = process.cwd()): void {
  const ctx = createContext(rootDir);
  console.log('\x1b[36m%s\x1b[0m', `=== Rollback Sequence to Version [${previousVersion}] ===`);

  if (!ctx.manifest) {
    console.log('\x1b[31m%s\x1b[0m', 'FAIL: inuo-manifest.json not found!');
    return;
  }

  const currentVersion = ctx.manifest.SPEC_VERSION;
  ctx.manifest.SPEC_VERSION = previousVersion;
  ctx.manifest.lastSyncedAt = new Date().toISOString();

  fs.writeFileSync(ctx.manifestPath, JSON.stringify(ctx.manifest, null, 2), 'utf8');

  console.log(
    '\x1b[32m%s\x1b[0m',
    `✔ Successfully rolled back SPEC_VERSION from "${currentVersion}" to "${previousVersion}".`
  );
}
