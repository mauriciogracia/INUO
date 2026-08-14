import {
  getHistorySnapshots,
  pushMasterMindSnapshot,
  rollbackMasterMindState,
} from './masterMindHistoryEngine';
import { initiateProgressiveMasterMindSync, authorizeProgressiveSync } from './progressiveSyncEngine';

export function runMasterMindCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'history';

  if (sub === 'history' || sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Master Mind 3-Version Snapshot History Ring Buffer ===\n');
    const snapshots = getHistorySnapshots(rootDir);

    if (snapshots.length === 0) {
      console.log('No historical snapshots recorded yet. Push one using "mastermind snapshot <summary>"');
      return;
    }

    console.log(`\x1b[1m${'INDEX'.padEnd(7)} | ${'SNAPSHOT ID'.padEnd(25)} | ${'SUMMARY'.padEnd(25)} | NEEDS/OFFERS | TIMESTAMP\x1b[0m`);
    console.log(''.padEnd(95, '-'));

    snapshots.forEach((s, idx) => {
      const tag = idx === 0 ? '\x1b[32m[Current t]\x1b[0m' : idx === 1 ? '\x1b[33m[Prev t-1]\x1b[0m' : '\x1b[31m[Prev t-2]\x1b[0m';
      console.log(
        `${tag.padEnd(16)} | ${s.snapshotId.padEnd(25)} | ${s.summary.padEnd(25)} | ${s.needsCount}N / ${s.offersCount}O | ${s.timestamp}`
      );
    });
    return;
  }

  if (sub === 'snapshot' || sub === 'checkpoint') {
    const summary = args.slice(1).join(' ') || 'Manual Master Mind Checkpoint';
    pushMasterMindSnapshot(summary, rootDir);
    return;
  }

  if (sub === 'rollback') {
    const stepArg = parseInt(args[1] || '1', 10);
    const steps = stepArg === 2 ? 2 : 1;

    console.log(`\x1b[33m%s\x1b[0m`, `Executing Master Mind rollback ${steps} step(s)...`);
    const res = rollbackMasterMindState(steps, rootDir);

    if (res.success) {
      console.log('\x1b[32m%s\x1b[0m', `✔ ${res.message}`);
    } else {
      console.log('\x1b[31m%s\x1b[0m', `❌ Rollback Failed: ${res.message}`);
    }
    return;
  }

  if (sub === 'sync' || sub === 'download') {
    let sizeMb = 500;
    let speedMbps = 2;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--size' && args[i + 1]) sizeMb = parseFloat(args[i + 1]);
      if (args[i] === '--speed' && args[i + 1]) speedMbps = parseFloat(args[i + 1]);
    }

    const payloadSizeBytes = Math.round(sizeMb * 1024 * 1024);
    initiateProgressiveMasterMindSync(payloadSizeBytes, speedMbps, rootDir);
    return;
  }

  if (sub === 'authorize' || sub === 'allow') {
    const syncId = args[1];
    const allow = !args.includes('--deny');

    if (!syncId) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: mastermind authorize <SyncId> [--allow|--deny]');
      return;
    }

    try {
      authorizeProgressiveSync(syncId, allow, rootDir);
    } catch (err: any) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Authorization Error: ${err.message}`);
    }
    return;
  }

  console.log('Unknown subcommand for mastermind. Supported: "mastermind history", "mastermind snapshot <summary>", "mastermind rollback [1|2]", "mastermind sync [--size MB] [--speed Mbps]", "mastermind authorize <SyncId>"');
}
