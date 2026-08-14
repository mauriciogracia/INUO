import { calculateInuoVersion } from './versionEngine';

export function runVersionCommand(args: string[], rootDir: string = process.cwd()): void {
  const ver = calculateInuoVersion(rootDir);

  console.log('\x1b[36m%s\x1b[0m', '=== INUO Platform Versioning Model (aa.bb.cc) ===\n');
  console.log(`Full Version String:  \x1b[1m\x1b[32mv${ver.fullVersionString}\x1b[0m`);
  console.log(`  └─ \x1b[33maa (Deployed Functionality %):\x1b[0m      ${ver.deployedPercentage}%`);
  console.log(`  └─ \x1b[33mbb (Codebase Implementation %):\x1b[0m    ${ver.implementationPercentage}%`);
  console.log(`  └─ \x1b[33mcc (Spec Revision Index):\x1b[0m          ${ver.specRevisionIndex} (Revision ${ver.specRevisionIndex})`);
  console.log(`\nModel Formula: aa.bb.cc (aa = Deployed %, bb = Implementation %, cc = Spec Bumping)`);
}
