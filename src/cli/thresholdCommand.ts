import { getProjectPaths, loadState } from './context';
import { createThresholdGate, evaluateThresholdAccess } from './trustThresholdEngine';

export function runThresholdCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Multi-Party Threshold Trust Consensus Registry ===\n');
    const paths = getProjectPaths(rootDir);
    const state = loadState(paths.statePath);
    const gates = state.thresholdGates || [];

    if (gates.length === 0) {
      console.log('No threshold protected assets registered. Register one using "threshold create --name <Name> --score <ReqScore> --data <Data>"');
      return;
    }

    console.log(`\x1b[1m${'GATE ID'.padEnd(25)} | ${'ASSET NAME'.padEnd(25)} | REQUIRED SCORE | CREATED BY\x1b[0m`);
    console.log(''.padEnd(95, '-'));

    gates.forEach((g) => {
      console.log(
        `${g.gateId.padEnd(25)} | \x1b[1m${g.assetName.padEnd(25)}\x1b[0m | \x1b[33m${g.requiredTrustScore} pts\x1b[0m       | ${g.createdByRole}`
      );
    });
    return;
  }

  if (sub === 'create' || sub === 'add') {
    let name = '';
    let score = 150;
    let data = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--score' && args[i + 1]) score = parseInt(args[i + 1], 10);
      if (args[i] === '--data' && args[i + 1]) data = args[i + 1];
    }

    if (!name && args[1] && !args[1].startsWith('-')) name = args[1];

    if (!name || !data) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: threshold create --name <AssetName> [--score <ReqScore>] --data <ProtectedData>');
      return;
    }

    const gate = createThresholdGate(name, score, data, rootDir);
    console.log(
      '\x1b[32m%s\x1b[0m',
      `✔ Created Multi-Party Threshold Protection Gate for "${gate.assetName}" [ID: ${gate.gateId}] requiring ${gate.requiredTrustScore} combined trust pts.`
    );
    return;
  }

  if (sub === 'unlock' || sub === 'access') {
    let assetQuery = '';
    let membersInput = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--asset' && args[i + 1]) assetQuery = args[i + 1];
      if (args[i] === '--members' && args[i + 1]) membersInput = args[i + 1];
    }

    if (!assetQuery && args[1]) assetQuery = args[1];
    if (!membersInput && args[2]) membersInput = args[2];

    if (!assetQuery || !membersInput) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: threshold unlock --asset <AssetNameOrId> --members <Member1,Member2>');
      return;
    }

    const coSigningMemberIds = membersInput.split(',').map((m) => m.trim());
    const res = evaluateThresholdAccess(assetQuery, coSigningMemberIds, rootDir);

    if (res.granted) {
      console.log('\x1b[32m%s\x1b[0m', res.reason);
      console.log(`\x1b[1mProtected Data Payload:\x1b[0m ${res.protectedData}`);
    } else {
      console.log('\x1b[31m%s\x1b[0m', res.reason);
    }
    return;
  }

  console.log('Unknown subcommand for threshold. Supported: "threshold list", "threshold create --name <N> --score <S> --data <D>", "threshold unlock --asset <A> --members M1,M2"');
}
