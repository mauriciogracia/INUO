const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  getCostGovernanceConfig,
  saveCostGovernanceConfig,
  getActiveTierModel,
  getNextAvailableFreeModel,
  recordModelExhaustion,
  selectPaidModelWithConsent,
  handleFreeTierExhaustion,
  grantPaidTierConsent,
  setTierModel,
  resetFreeTierStatus,
  addModelToPool,
  removeModelFromPool,
} = require("../dist/cli/costGovernanceEngine");
const { runTierCommand } = require("../dist/cli/tierCommand");

test("Cost Governance & Tier Fallback Engine Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_cost_gov_"));

  await t.test(
    "initializes with FreeTierFirst, Available free tier, and no paid consent",
    () => {
      const config = getCostGovernanceConfig(tmpDir);
      assert.equal(config.tierMode, "FreeTierFirst");
      assert.equal(config.freeTierStatus, "Available");
      assert.equal(config.paidTierConsent, false);
      assert.equal(config.preferredFreeModel, "gemini-flash-latest");
      assert.equal(config.preferredPaidModel, "gemini-pro-latest");
      assert.ok(config.freeModelsPool.length >= 3);
      assert.ok(config.paidModelsPool.length >= 2);
    },
  );

  await t.test(
    "getActiveTierModel selects free model when free tier is Available",
    () => {
      const active = getActiveTierModel(tmpDir);
      assert.equal(active.model, "gemini-flash-latest");
      assert.equal(active.isPaid, false);
      assert.equal(active.requiresConsent, false);
    },
  );

  await t.test(
    "cascades transparently across free models in the pool upon individual model exhaustion",
    () => {
      // 1. Primary model (gemini-flash-latest) hits quota limit
      const res1 = recordModelExhaustion("gemini-flash-latest", "es", tmpDir);
      assert.equal(res1.allExhausted, false);
      assert.equal(res1.cascadedModel, "gemini-3.7-flash");

      const active1 = getActiveTierModel(tmpDir);
      assert.equal(active1.model, "gemini-3.7-flash");
      assert.equal(active1.isPaid, false);
      assert.equal(active1.requiresConsent, false);

      // 2. Second model (gemini-3.7-flash) hits quota limit
      const res2 = recordModelExhaustion("gemini-3.7-flash", "es", tmpDir);
      assert.equal(res2.allExhausted, false);
      assert.equal(res2.cascadedModel, "gemini-3.5-flash");

      const active2 = getActiveTierModel(tmpDir);
      assert.equal(active2.model, "gemini-3.5-flash");
      assert.equal(active2.isPaid, false);
      assert.equal(active2.requiresConsent, false);
    },
  );

  await t.test(
    "halts execution and triggers paid selection prompt when ALL free models are exhausted",
    () => {
      const config = getCostGovernanceConfig(tmpDir);
      // Exhaust remaining free models
      for (const m of config.freeModelsPool) {
        if (!config.exhaustedFreeModels.includes(m)) {
          recordModelExhaustion(m, "es", tmpDir);
        }
      }

      const updated = getCostGovernanceConfig(tmpDir);
      assert.equal(updated.freeTierStatus, "Exhausted");
      assert.ok(updated.lastExhaustedAt);

      const active = getActiveTierModel(tmpDir);
      assert.equal(active.requiresConsent, true);
      assert.equal(active.isPaid, false);
    },
  );

  await t.test(
    "selectPaidModelWithConsent authorizes specific user-chosen paid model",
    () => {
      selectPaidModelWithConsent("gemini-pro-latest", "es", tmpDir);
      const config = getCostGovernanceConfig(tmpDir);
      assert.equal(config.paidTierConsent, true);
      assert.equal(config.tierMode, "PaidAllowed");
      assert.equal(config.selectedPaidModel, "gemini-pro-latest");

      const active = getActiveTierModel(tmpDir);
      assert.equal(active.model, "gemini-pro-latest");
      assert.equal(active.isPaid, true);
      assert.equal(active.requiresConsent, false);
    },
  );

  await t.test(
    "grantPaidTierConsent(false) revokes consent and re-blocks paid models",
    () => {
      grantPaidTierConsent(false, "en", tmpDir);
      const config = getCostGovernanceConfig(tmpDir);
      assert.equal(config.paidTierConsent, false);
      assert.equal(config.tierMode, "FreeOnly");

      const active = getActiveTierModel(tmpDir);
      assert.equal(active.requiresConsent, true);
    },
  );

  await t.test(
    "free-pool and paid-pool can be dynamically managed",
    () => {
      addModelToPool("free", "ollama-llama3-free", tmpDir);
      addModelToPool("paid", "openai-gpt-4o", tmpDir);

      const config = getCostGovernanceConfig(tmpDir);
      assert.ok(config.freeModelsPool.includes("ollama-llama3-free"));
      assert.ok(config.paidModelsPool.includes("openai-gpt-4o"));

      removeModelFromPool("free", "ollama-llama3-free", tmpDir);
      removeModelFromPool("paid", "openai-gpt-4o", tmpDir);

      const after = getCostGovernanceConfig(tmpDir);
      assert.equal(after.freeModelsPool.includes("ollama-llama3-free"), false);
      assert.equal(after.paidModelsPool.includes("openai-gpt-4o"), false);
    },
  );

  await t.test(
    "resetFreeTierStatus restores Available status and clears exhausted list",
    () => {
      resetFreeTierStatus(tmpDir);
      const config = getCostGovernanceConfig(tmpDir);
      assert.equal(config.freeTierStatus, "Available");
      assert.equal(config.exhaustedFreeModels.length, 0);

      const active = getActiveTierModel(tmpDir);
      assert.equal(active.model, "gemini-flash-latest");
      assert.equal(active.isPaid, false);
      assert.equal(active.requiresConsent, false);
    },
  );

  await t.test(
    "runTierCommand handles CLI commands without error",
    () => {
      assert.doesNotThrow(() => runTierCommand(["status"], tmpDir));
      assert.doesNotThrow(() => runTierCommand(["select", "gemini-pro-latest"], tmpDir));
      assert.doesNotThrow(() => runTierCommand(["consent", "yes"], tmpDir));
      assert.doesNotThrow(() => runTierCommand(["consent", "no"], tmpDir));
      assert.doesNotThrow(() => runTierCommand(["free-pool", "list"], tmpDir));
      assert.doesNotThrow(() => runTierCommand(["paid-pool", "list"], tmpDir));
      assert.doesNotThrow(() => runTierCommand(["reset"], tmpDir));
    },
  );

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
