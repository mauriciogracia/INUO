const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { executeShellLine } = require("../dist/cli/shell");
const { loadState } = require("../dist/cli/context");

test("Social network configuration command", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(__dirname, "tmp_sn_command_"));
  const statePath = path.join(scratchDir, ".inuo-state.json");

  await t.test("adds social network configurations", async () => {
    await executeShellLine(
      "sn add instagram ig-brand --account @inuo.brand --enabled yes",
      scratchDir,
    );
    await executeShellLine(
      "sn add tiktok tt-brand --account @inuo.brand --enabled no",
      scratchDir,
    );

    const state = loadState(statePath);
    assert.ok(Array.isArray(state.socialNetworkConfigurations));
    assert.equal(state.socialNetworkConfigurations.length, 2);

    const instagram = state.socialNetworkConfigurations.find(
      (item) => item.configurationName === "ig-brand",
    );
    assert.ok(instagram);
    assert.equal(instagram.network, "instagram");
    assert.equal(instagram.isEnabled, true);

    const tiktok = state.socialNetworkConfigurations.find(
      (item) => item.configurationName === "tt-brand",
    );
    assert.ok(tiktok);
    assert.equal(tiktok.network, "tiktok");
    assert.equal(tiktok.isEnabled, false);
  });

  await t.test("updates a social network configuration", async () => {
    await executeShellLine(
      "sn update tt-brand --network linkedin --account @inuo.company --enabled yes",
      scratchDir,
    );

    const state = loadState(statePath);
    const updated = state.socialNetworkConfigurations.find(
      (item) => item.configurationName === "tt-brand",
    );

    assert.ok(updated);
    assert.equal(updated.network, "linkedin");
    assert.equal(updated.accountHandle, "@inuo.company");
    assert.equal(updated.isEnabled, true);
  });

  await t.test("removes a social network configuration", async () => {
    await executeShellLine("sn remove ig-brand", scratchDir);

    const state = loadState(statePath);
    assert.equal(state.socialNetworkConfigurations.length, 1);
    assert.equal(
      state.socialNetworkConfigurations[0].configurationName,
      "tt-brand",
    );
  });

  fs.rmSync(scratchDir, { recursive: true, force: true });
});
