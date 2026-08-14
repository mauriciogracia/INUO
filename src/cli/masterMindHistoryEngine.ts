import fs from 'fs';
import path from 'path';
import { getProjectPaths, loadState, saveState, StateData } from './context';
import { MasterMindSnapshot } from '../interfaces/MasterMindSnapshot';

export function getSnapshotsFilePath(rootDir: string = process.cwd()): string {
  return path.join(rootDir, '.inuo-snapshots.json');
}

export function getHistorySnapshots(rootDir: string = process.cwd()): MasterMindSnapshot[] {
  const filePath = getSnapshotsFilePath(rootDir);
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as MasterMindSnapshot[];
  } catch {
    return [];
  }
}

export function pushMasterMindSnapshot(
  summary: string = 'Manual Checkpoint',
  rootDir: string = process.cwd()
): MasterMindSnapshot {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const snapshots = getHistorySnapshots(rootDir);

  const snapshot: MasterMindSnapshot = {
    snapshotId: `mm_snap_${Date.now()}`,
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    summary,
    needsCount: state.needs.length,
    offersCount: state.offers.length,
    skillsCount: state.skills?.length || 0,
    stateData: JSON.parse(JSON.stringify(state)),
  };

  // Prepend snapshot and maintain sliding ring buffer of MAX 3 versions
  snapshots.unshift(snapshot);
  const ringBuffer = snapshots.slice(0, 3);

  fs.writeFileSync(getSnapshotsFilePath(rootDir), JSON.stringify(ringBuffer, null, 2), 'utf8');
  console.log(
    `\x1b[32m✔ Pushed Master Mind Snapshot [${snapshot.snapshotId}]\x1b[0m ("${summary}") | Ring Buffer: ${ringBuffer.length}/3 snapshots stored.`
  );

  return snapshot;
}

export function rollbackMasterMindState(
  steps: 1 | 2 = 1,
  rootDir: string = process.cwd()
): { success: boolean; restoredSnapshot?: MasterMindSnapshot; message: string } {
  const snapshots = getHistorySnapshots(rootDir);

  if (snapshots.length <= steps) {
    return {
      success: false,
      message: `Cannot rollback ${steps} step(s). Only ${snapshots.length} snapshot(s) available in history ring buffer.`,
    };
  }

  const targetSnapshot = snapshots[steps];
  const paths = getProjectPaths(rootDir);
  const currentState = loadState(paths.statePath);

  // Preserve locked Master Trainer Principles across rollback
  const currentPrinciples = currentState.principles || [];
  const restoredState: StateData = JSON.parse(JSON.stringify(targetSnapshot.stateData));

  // Merge immutable principles back into restored state
  if (restoredState.principles) {
    currentPrinciples.forEach((p) => {
      if (p.isImmutable && !restoredState.principles?.some((rp) => rp.id === p.id)) {
        restoredState.principles?.push(p);
      }
    });
  }

  saveState(paths.statePath, restoredState);

  // Rotate ring buffer to make targetSnapshot the top snapshot
  const newRingBuffer = snapshots.slice(steps);
  fs.writeFileSync(getSnapshotsFilePath(rootDir), JSON.stringify(newRingBuffer, null, 2), 'utf8');

  return {
    success: true,
    restoredSnapshot: targetSnapshot,
    message: `Successfully rolled back Master Mind state ${steps} step(s) to snapshot [${targetSnapshot.snapshotId}] ("${targetSnapshot.summary}").`,
  };
}
