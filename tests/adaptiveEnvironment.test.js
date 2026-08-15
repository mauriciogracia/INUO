const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  getAvailableStorageMB,
  evaluateStorageHealth,
  probeConnectivity,
  detectEnvironmentConditions,
  applyAdaptivePolicies,
  runAdaptiveCommand,
} = require("../dist/cli/adaptiveEnvironmentEngine");
const { executeShellLine } = require("../dist/cli/shell");

test("Adaptive Environment Sensing & Dynamic Degradation Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_adapt_"));

  await t.test("evaluates storage health tiers correctly", () => {
    assert.equal(evaluateStorageHealth(50), "Critical");
    assert.equal(evaluateStorageHealth(250), "Constrained");
    assert.equal(evaluateStorageHealth(1500), "Normal");
  });

  await t.test("getAvailableStorageMB returns a positive number", () => {
    const storageMB = getAvailableStorageMB(tmpDir);
    assert.ok(typeof storageMB === "number");
    assert.ok(storageMB > 0);
  });

  await t.test("detects environment conditions and generates adaptive status", async () => {
    const status = await detectEnvironmentConditions(tmpDir);
    assert.ok(status);
    assert.ok(["HighSpeed", "LowBandwidth", "Intermittent", "Offline"].includes(status.connectivity));
    assert.ok(["Normal", "Constrained", "Critical"].includes(status.storageHealth));
    assert.ok(typeof status.isLightweightAutoActive === "boolean");
    assert.ok(typeof status.isStoreAndForwardActive === "boolean");
  });

  await t.test("applies adaptive policies based on status", () => {
    const mockStatusOffline = {
      connectivity: "Offline",
      estimatedSpeedMbps: 0,
      availableStorageMB: 50,
      storageHealth: "Critical",
      isLightweightAutoActive: true,
      isStoreAndForwardActive: true,
      isAutoPruneActive: true,
      lastCheckedAt: new Date().toISOString(),
    };

    const policyResult = applyAdaptivePolicies(mockStatusOffline, tmpDir);
    assert.ok(policyResult.actionsTaken.some((a) => a.includes("Store-and-Forward")));
    assert.ok(policyResult.actionsTaken.some((a) => a.includes("pruned") || a.includes("Compact")));
    assert.match(policyResult.activePolicy, /Offline/);
  });

  await t.test("executes adapt command via shell without throwing", async () => {
    await assert.doesNotReject(async () => {
      await executeShellLine("adapt", tmpDir);
    });
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
