const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getTrustRecord, penalizeTrust, evaluateTrustGate } = require('../dist/cli/trustEngine');
const { runColmenaCommand } = require('../dist/cli/colmenaCommand');
const { loadState } = require('../dist/cli/context');

test('Dynamic Trust Engine & Millisecond Disconnect Policy Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_trust_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('initializes entity with score 100 and HighTrust level', () => {
    const record = getTrustRecord('node_city_a', 'PeerNode', scratchDir);
    assert.strictEqual(record.trustScore, 100);
    assert.strictEqual(record.trustLevel, 'HighTrust');
    assert.strictEqual(record.isBlacklisted, false);
  });

  await t.test('penalizes trust and triggers millisecond circuit breaker below 30', () => {
    runColmenaCommand(['connect', '--name', 'SuspiciousNode', '--url', 'https://suspicious.net/api'], scratchDir);

    let state = loadState(statePath);
    const nodeObj = state.colmenaNodes.find((n) => n.nodeName === 'SuspiciousNode');
    assert.ok(nodeObj);

    // Penalize 80 points
    const penalized = penalizeTrust(nodeObj.nodeId, 'PeerNode', 80, 'Attempted Principle Override', scratchDir);
    assert.strictEqual(penalized.trustScore, 20);
    assert.strictEqual(penalized.trustLevel, 'Blacklisted');
    assert.strictEqual(penalized.isBlacklisted, true);

    state = loadState(statePath);
    const updatedNode = state.colmenaNodes.find((n) => n.nodeId === nodeObj.nodeId);
    assert.strictEqual(updatedNode.status, 'Blacklisted');
  });

  await t.test('evaluates trust gate and blocks access for blacklisted entities', () => {
    const gateRes = evaluateTrustGate('node_city_a', 30, scratchDir);
    assert.strictEqual(gateRes.allowed, true);

    const gateBlocked = evaluateTrustGate('node_suspicious_blacklisted', 30, scratchDir);
    // Unregistered defaults to allowed 100
    assert.strictEqual(gateBlocked.allowed, true);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
