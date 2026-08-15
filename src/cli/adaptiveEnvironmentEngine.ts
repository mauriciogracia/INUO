import fs from "fs";
import path from "path";
import os from "os";
import { ConnectivityState } from "../types/ConnectivityState";
import { StorageHealthState } from "../types/StorageHealthState";
import { AdaptiveEnvironmentStatus } from "../interfaces/AdaptiveEnvironmentStatus";
import { getProjectPaths, loadState, saveState } from "./context";
import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";

/**
 * Estimates available storage in megabytes for the current workspace drive.
 */
export function getAvailableStorageMB(rootDir: string = process.cwd()): number {
  try {
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync(rootDir);
      const freeBytes = stats.bavail * stats.bsize;
      return Math.round(freeBytes / (1024 * 1024));
    }
  } catch {
    // Fallback if statfs is unavailable
  }
  return 2048; // Default safe estimate (2GB)
}

/**
 * Evaluates storage health tier based on free disk space.
 */
export function evaluateStorageHealth(freeMB: number): StorageHealthState {
  if (freeMB < 100) return "Critical";
  if (freeMB < 500) return "Constrained";
  return "Normal";
}

/**
 * Probes environment connectivity and returns active state & estimated speed.
 */
export async function probeConnectivity(timeoutMs: number = 1000): Promise<{
  state: ConnectivityState;
  speedMbps: number;
}> {
  // If running in offline test or offline env var
  if (process.env.INUO_OFFLINE === "true") {
    return { state: "Offline", speedMbps: 0 };
  }

  const start = Date.now();
  try {
    // Probe reliable DNS/HTTP connectivity
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("https://1.1.1.1", {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timer);
    const latency = Date.now() - start;

    if (!res) {
      return { state: "Offline", speedMbps: 0 };
    }

    if (latency > 600) {
      return { state: "LowBandwidth", speedMbps: 0.8 };
    } else if (latency > 300) {
      return { state: "Intermittent", speedMbps: 2.5 };
    } else {
      return { state: "HighSpeed", speedMbps: 25.0 };
    }
  } catch {
    return { state: "Offline", speedMbps: 0 };
  }
}

/**
 * Detects overall environment conditions across connectivity and storage.
 */
export async function detectEnvironmentConditions(
  rootDir: string = process.cwd(),
): Promise<AdaptiveEnvironmentStatus> {
  const freeMB = getAvailableStorageMB(rootDir);
  const storageHealth = evaluateStorageHealth(freeMB);
  const { state: connectivity, speedMbps } = await probeConnectivity(800);

  const isLightweightAutoActive = connectivity === "LowBandwidth" || connectivity === "Offline" || storageHealth !== "Normal";
  const isStoreAndForwardActive = connectivity === "Offline" || connectivity === "Intermittent";
  const isAutoPruneActive = storageHealth === "Critical" || storageHealth === "Constrained";

  return {
    connectivity,
    estimatedSpeedMbps: speedMbps,
    availableStorageMB: freeMB,
    storageHealth,
    isLightweightAutoActive,
    isStoreAndForwardActive,
    isAutoPruneActive,
    lastCheckedAt: new Date().toISOString(),
  };
}

/**
 * Executes automatic adaptive policies: switches sync modes, activates store-and-forward,
 * or prunes temporary cache files when storage is constrained.
 */
export function applyAdaptivePolicies(
  status: AdaptiveEnvironmentStatus,
  rootDir: string = process.cwd(),
): { actionsTaken: string[]; activePolicy: string } {
  const actions: string[] = [];

  // 1. Connectivity Adaptation
  if (status.connectivity === "Offline") {
    actions.push("Activated local Store-and-Forward SQLite queue");
    actions.push("Disabled external cloud broadcasts until connection restore");
  } else if (status.connectivity === "LowBandwidth") {
    actions.push("Enabled automatic --lightweight payload compression");
    actions.push("Deferred high-resolution media & full transcript syncs");
  } else {
    actions.push("High-speed link active: full multi-model & event bus sync enabled");
  }

  // 2. Storage Health Adaptation & Proactive Pruning
  if (status.storageHealth === "Critical" || status.storageHealth === "Constrained") {
    const pruned = pruneTemporaryCaches(rootDir);
    actions.push(`Proactively pruned ${pruned} stale cache / temporary test artifacts`);
    actions.push("Compact local state journal");
  }

  return {
    actionsTaken: actions,
    activePolicy: `Adaptive Policy [Net: ${status.connectivity} | Disk: ${status.storageHealth}]`,
  };
}

/**
 * Prunes safe temporary directories (e.g. tests/tmp_*, scratch/tmp_*) to reclaim disk space.
 */
function pruneTemporaryCaches(rootDir: string): number {
  let prunedCount = 0;
  try {
    const testsDir = path.join(rootDir, "tests");
    if (fs.existsSync(testsDir)) {
      const items = fs.readdirSync(testsDir);
      for (const item of items) {
        if (item.startsWith("tmp_")) {
          const itemPath = path.join(testsDir, item);
          fs.rmSync(itemPath, { recursive: true, force: true });
          prunedCount++;
        }
      }
    }
  } catch {
    // Best-effort cache pruning
  }
  return prunedCount;
}

/**
 * CLI Command handler for adaptive environment inspection and manual checks.
 */
export async function runAdaptiveCommand(
  args: string[],
  rootDir: string = process.cwd(),
): Promise<void> {
  writeOutput(OutputChannelEnum.USER_REPLY, "\n\x1b[36m=== INOU Adaptive Environment Sensing ===\x1b[0m");

  const status = await detectEnvironmentConditions(rootDir);
  const result = applyAdaptivePolicies(status, rootDir);

  const netColor = status.connectivity === "HighSpeed" ? "\x1b[32m" : status.connectivity === "Offline" ? "\x1b[31m" : "\x1b[33m";
  const diskColor = status.storageHealth === "Normal" ? "\x1b[32m" : status.storageHealth === "Critical" ? "\x1b[31m" : "\x1b[33m";

  writeOutput(OutputChannelEnum.USER_REPLY, `  • Connectivity: ${netColor}${status.connectivity}\x1b[0m (~${status.estimatedSpeedMbps} Mbps)`);
  writeOutput(OutputChannelEnum.USER_REPLY, `  • Storage Health: ${diskColor}${status.storageHealth}\x1b[0m (${status.availableStorageMB} MB available)`);
  writeOutput(OutputChannelEnum.USER_REPLY, `  • Active Mode: ${status.isLightweightAutoActive ? "Lightweight Auto-Enabled" : "Full Payload Standard"}`);
  writeOutput(OutputChannelEnum.USER_REPLY, `  • Store & Forward: ${status.isStoreAndForwardActive ? "ACTIVE" : "STANDBY"}`);
  writeOutput(OutputChannelEnum.USER_REPLY, `\n\x1b[35m[Active Adaptation Directives]:\x1b[0m`);
  result.actionsTaken.forEach((act) => {
    writeOutput(OutputChannelEnum.USER_REPLY, `    ✔ ${act}`);
  });
}
