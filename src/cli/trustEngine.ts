import { getProjectPaths, loadState, saveState } from './context';
import { TrustRecord } from '../interfaces/TrustRecord';
import { TrustLevel } from '../types/TrustLevel';

export function getTrustRecord(
  entityId: string,
  entityType: 'User' | 'PeerNode' | 'MCPServer' | 'ExternalAI' = 'User',
  rootDir: string = process.cwd()
): TrustRecord {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.trustRecords) state.trustRecords = [];

  let record = state.trustRecords.find((r) => r.entityId === entityId);
  if (!record) {
    record = {
      entityId,
      entityType,
      trustScore: 100,
      trustLevel: 'HighTrust',
      violationsCount: 0,
      isBlacklisted: false,
      lastEvaluatedAt: new Date().toISOString(),
    };
    state.trustRecords.push(record);
    saveState(paths.statePath, state);
  }

  return record;
}

export function penalizeTrust(
  entityId: string,
  entityType: 'User' | 'PeerNode' | 'MCPServer' | 'ExternalAI',
  penaltyPoints: number,
  reason: string,
  rootDir: string = process.cwd()
): TrustRecord {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.trustRecords) state.trustRecords = [];

  let record = state.trustRecords.find((r) => r.entityId === entityId);
  if (!record) {
    record = {
      entityId,
      entityType,
      trustScore: 100,
      trustLevel: 'HighTrust',
      violationsCount: 0,
      isBlacklisted: false,
      lastEvaluatedAt: new Date().toISOString(),
    };
    state.trustRecords.push(record);
  }

  const startTime = Date.now();

  record.trustScore = Math.max(0, record.trustScore - penaltyPoints);
  record.violationsCount += 1;
  record.lastPenaltyReason = reason;
  record.lastEvaluatedAt = new Date().toISOString();

  // Dynamic Trust Level Recalculation
  if (record.trustScore >= 80) {
    record.trustLevel = 'HighTrust';
  } else if (record.trustScore >= 50) {
    record.trustLevel = 'MediumTrust';
  } else if (record.trustScore >= 30) {
    record.trustLevel = 'LowTrust';
  } else {
    record.trustLevel = 'Blacklisted';
    record.isBlacklisted = true;
  }

  // === Millisecond Reactive Disconnect & Circuit Breaker ===
  if (record.isBlacklisted || record.trustScore < 30) {
    if (entityType === 'PeerNode' && state.colmenaNodes) {
      const node = state.colmenaNodes.find((n) => n.nodeId === entityId || n.nodeName === entityId);
      if (node) {
        node.status = 'Blacklisted';
        node.isBlacklisted = true;
        node.trustScore = record.trustScore;
        node.trustLevel = record.trustLevel;
      }
    }

    if (entityType === 'User' && state.activeUser) {
      if (state.activeUser.userId === entityId || state.activeUser.userName === entityId) {
        state.activeUser.trustScore = record.trustScore;
        state.activeUser.trustLevel = record.trustLevel;
      }
    }
  }

  saveState(paths.statePath, state);

  const durationMs = Date.now() - startTime;
  console.log(
    `\x1b[31m⚡ [Millisecond Circuit Breaker] Trust penalization completed in ${durationMs}ms.\x1b[0m`
  );
  console.log(
    `  Entity: ${entityId} (${entityType}) | Score: ${record.trustScore}/100 | Level: ${record.trustLevel} | Disconnected: ${record.isBlacklisted}`
  );

  return record;
}

export function evaluateTrustGate(
  entityId: string,
  requiredScore: number = 30,
  rootDir: string = process.cwd()
): { allowed: boolean; currentScore: number; reason?: string } {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const record = (state.trustRecords || []).find((r) => r.entityId === entityId);

  if (!record) {
    return { allowed: true, currentScore: 100 };
  }

  if (record.isBlacklisted || record.trustScore < requiredScore) {
    return {
      allowed: false,
      currentScore: record.trustScore,
      reason: `Entity ${entityId} is untrusted/blacklisted (Trust Score: ${record.trustScore}/${requiredScore}). Access revoked.`,
    };
  }

  return { allowed: true, currentScore: record.trustScore };
}
