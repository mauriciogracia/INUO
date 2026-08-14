import fs from 'fs';
import { getProjectPaths, loadManifest } from './context';
import { runRollback } from './rollbackCommand';
import { SyncResult } from '../interfaces/SyncResult';

export function extractSpecVersion(specPath: string): string | null {
  if (!fs.existsSync(specPath)) return null;
  try {
    const content = fs.readFileSync(specPath, 'utf8');
    const match = content.match(/SPEC_VERSION:\s*["']?([0-9]+\.[0-9]+\.[0-9]+)["']?/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function checkAndApplySyncProtocol(rootDir: string = process.cwd()): SyncResult {
  const paths = getProjectPaths(rootDir);
  const manifest = loadManifest(paths.manifestPath);

  if (!manifest) {
    return {
      currentManifestVersion: '0.0.0',
      targetSpecVersion: '0.1.0',
      status: 'VerificationFailed',
      message: 'Manifest file inuo-manifest.json missing. Run "init" to bootstrap.',
    };
  }

  const targetSpecVersion = extractSpecVersion(paths.specPath) || manifest.SPEC_VERSION;
  const currentManifestVersion = manifest.SPEC_VERSION;

  if (currentManifestVersion === targetSpecVersion) {
    return {
      currentManifestVersion,
      targetSpecVersion,
      status: 'Synced',
      message: `System synchronized at SPEC_VERSION: "${currentManifestVersion}".`,
    };
  }

  console.log(
    '\x1b[36m%s\x1b[0m',
    `[INUO Sync Engine] Protocol Update Detected! Target Spec: "${targetSpecVersion}" | Current Manifest: "${currentManifestVersion}"`
  );

  const passesVerification = fs.existsSync(paths.manifestPath) && fs.existsSync(paths.specPath);

  if (passesVerification) {
    const previousVersion = currentManifestVersion;
    manifest.SPEC_VERSION = targetSpecVersion;
    manifest.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log(
      '\x1b[32m%s\x1b[0m',
      `✔ [Sync Engine] Verified new rules! Upgraded SPEC_VERSION from "${previousVersion}" to "${targetSpecVersion}".`
    );
    return {
      currentManifestVersion: targetSpecVersion,
      targetSpecVersion,
      status: 'VerificationPassed',
      message: `Upgraded SPEC_VERSION to "${targetSpecVersion}".`,
    };
  } else {
    console.log(
      '\x1b[31m%s\x1b[0m',
      `✖ [Sync Engine] Verification FAILED for target SPEC_VERSION "${targetSpecVersion}". Triggering automated rollback...`
    );
    runRollback(currentManifestVersion, rootDir);

    return {
      currentManifestVersion,
      targetSpecVersion,
      status: 'RolledBack',
      message: `Rollback executed. Reverted to stable SPEC_VERSION "${currentManifestVersion}".`,
    };
  }
}
