const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { executeShellLine } = require("../dist/cli/shell");
const { loadState } = require("../dist/cli/context");

test("SocialMedia command and User Alias system", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(__dirname, "tmp_alias_sm_"));
  const statePath = path.join(scratchDir, ".inuo-state.json");

  await t.test("adds social media configurations via canonical 'socialmedia' command", async () => {
    await executeShellLine(
      "socialmedia add instagram ig-primary --account @inuo.primary --enabled yes",
      scratchDir,
    );
    await executeShellLine(
      "socialmedia add linkedin li-corp --account @inuo.corp --enabled yes",
      scratchDir,
    );

    const state = loadState(statePath);
    assert.ok(Array.isArray(state.socialNetworkConfigurations));
    assert.equal(state.socialNetworkConfigurations.length, 2);

    const ig = state.socialNetworkConfigurations.find(
      (item) => item.configurationName === "ig-primary",
    );
    assert.ok(ig);
    assert.equal(ig.network, "instagram");
    assert.equal(ig.isEnabled, true);
  });

  await t.test("works with built-in alias 'sn'", async () => {
    await executeShellLine(
      "sn add tiktok tt-viral --account @inuo.viral --enabled no",
      scratchDir,
    );

    const state = loadState(statePath);
    assert.equal(state.socialNetworkConfigurations.length, 3);
    const tt = state.socialNetworkConfigurations.find(
      (item) => item.configurationName === "tt-viral",
    );
    assert.ok(tt);
    assert.equal(tt.network, "tiktok");
    assert.equal(tt.isEnabled, false);
  });

  await t.test("supports user-defined aliases and persistence", async () => {
    // Define a custom alias 'sm' -> 'socialmedia'
    await executeShellLine("alias add sm socialmedia", scratchDir);

    const stateAfterAlias = loadState(statePath);
    assert.ok(Array.isArray(stateAfterAlias.aliases));
    assert.equal(stateAfterAlias.aliases.length, 1);
    assert.equal(stateAfterAlias.aliases[0].aliasName, "sm");
    assert.equal(stateAfterAlias.aliases[0].targetCommand, "socialmedia");

    // Execute through the custom alias 'sm'
    await executeShellLine(
      "sm add facebook fb-main --account @inuo.main --enabled yes",
      scratchDir,
    );

    const state = loadState(statePath);
    assert.equal(state.socialNetworkConfigurations.length, 4);
    const fb = state.socialNetworkConfigurations.find(
      (item) => item.configurationName === "fb-main",
    );
    assert.ok(fb);
    assert.equal(fb.network, "facebook");
  });

  await t.test("allows removing custom aliases", async () => {
    await executeShellLine("alias remove sm", scratchDir);

    const state = loadState(statePath);
    assert.equal(state.aliases.length, 0);
  });

  fs.rmSync(scratchDir, { recursive: true, force: true });
});
