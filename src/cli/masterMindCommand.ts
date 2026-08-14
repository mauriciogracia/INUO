import {
  getHistorySnapshots,
  pushMasterMindSnapshot,
  rollbackMasterMindState,
} from './masterMindHistoryEngine';

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

  console.log('Unknown subcommand for mastermind. Supported: "mastermind history", "mastermind snapshot <summary>", "mastermind rollback [1|2]"');
}
