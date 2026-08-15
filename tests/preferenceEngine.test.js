const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  detectFormatSignal,
  applyPreference,
  getPreference,
  buildPreferencePromptBlock,
  handleFormatSignal,
} = require("../dist/cli/preferenceEngine");

test("User Format Preference Engine Unit Tests", async (t) => {
  const scratchDir = path.join(__dirname, "scratch_pref_test");
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const statePath = path.join(scratchDir, ".inuo-state.json");
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  t.after(() => {
    if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
    if (fs.existsSync(scratchDir))
      fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  await t.test("detectFormatSignal — returns null for unrelated input", () => {
    assert.equal(
      detectFormatSignal("need create --verb Request --object food"),
      null,
    );
    assert.equal(detectFormatSignal("status"), null);
    assert.equal(detectFormatSignal("who are you"), null);
  });

  await t.test("detectFormatSignal — detects brief signal in English", () => {
    const s = detectFormatSignal("please be more concise");
    assert.ok(s !== null);
    assert.equal(s.delta.responseLength, "brief");
  });

  await t.test("detectFormatSignal — detects brief signal in Spanish", () => {
    const s = detectFormatSignal("sé más breve por favor");
    assert.ok(s !== null);
    assert.equal(s.delta.responseLength, "brief");
  });

  await t.test("detectFormatSignal — detects detailed signal in French", () => {
    const s = detectFormatSignal("donne plus de détails s'il te plaît");
    assert.ok(s !== null);
    assert.equal(s.delta.responseLength, "detailed");
  });

  await t.test("detectFormatSignal — detects bullets signal in German", () => {
    const s = detectFormatSignal("verwende Aufzählungszeichen");
    assert.ok(s !== null);
    assert.equal(s.delta.responseFormat, "bullets");
  });

  await t.test(
    "detectFormatSignal — detects no-tables signal in Portuguese",
    () => {
      const s = detectFormatSignal("sem tabelas por favor");
      assert.ok(s !== null);
      assert.equal(s.delta.preferTables, false);
    },
  );

  await t.test(
    'detectFormatSignal — no-tables takes priority over use-a-table when phrase is "no tables"',
    () => {
      const s = detectFormatSignal("no tables please");
      assert.ok(s !== null);
      assert.equal(s.delta.preferTables, false);
    },
  );

  await t.test(
    "applyPreference + getPreference — persists and retrieves profile",
    () => {
      const saved = applyPreference(
        { responseLength: "brief", responseFormat: "bullets" },
        "user_test",
        scratchDir,
      );
      assert.equal(saved.responseLength, "brief");
      assert.equal(saved.responseFormat, "bullets");
      assert.equal(saved.signalCount, 1);

      const loaded = getPreference("user_test", scratchDir);
      assert.ok(loaded !== null);
      assert.equal(loaded.responseLength, "brief");
      assert.equal(loaded.responseFormat, "bullets");
    },
  );

  await t.test(
    "applyPreference — merges subsequent signals, increments signalCount",
    () => {
      applyPreference({ preferTables: false }, "user_test", scratchDir);
      const loaded = getPreference("user_test", scratchDir);
      assert.equal(loaded.responseLength, "brief"); // retained from previous call
      assert.equal(loaded.preferTables, false); // newly applied
      assert.equal(loaded.signalCount, 2);
    },
  );

  await t.test(
    "buildPreferencePromptBlock — returns empty string when no prefs set",
    () => {
      const block = buildPreferencePromptBlock({
        userId: "u",
        signalCount: 0,
        updatedAt: new Date().toISOString(),
      });
      assert.equal(block, "");
    },
  );

  await t.test(
    "buildPreferencePromptBlock — contains length and format instructions",
    () => {
      const block = buildPreferencePromptBlock({
        userId: "u",
        responseLength: "brief",
        responseFormat: "bullets",
        preferTables: false,
        signalCount: 3,
        updatedAt: new Date().toISOString(),
      });
      assert.match(block, /USER FORMAT PREFERENCES/);
      assert.match(block, /short/);
      assert.match(block, /bullet lists/);
      assert.match(block, /Never use tables/);
    },
  );

  await t.test(
    "handleFormatSignal — returns false for non-format input",
    () => {
      const handled = handleFormatSignal(
        "quiero comprar manzanas",
        "u2",
        "es",
        scratchDir,
      );
      assert.equal(handled, false);
      assert.equal(getPreference("u2", scratchDir), null);
    },
  );

  await t.test(
    "handleFormatSignal — returns true, saves pref, and emits localised confirmation",
    () => {
      const messages = [];
      // capture via process.stdout (writeOutput routes USER_REPLY there when no listener)
      const orig = process.stdout.write.bind(process.stdout);
      process.stdout.write = (chunk) => {
        messages.push(chunk);
        return true;
      };

      const handled = handleFormatSignal(
        "be more concise please",
        "u3",
        "en",
        scratchDir,
      );
      process.stdout.write = orig;

      assert.equal(handled, true);
      const pref = getPreference("u3", scratchDir);
      assert.equal(pref.responseLength, "brief");
      assert.ok(
        messages.some((m) => m.includes("brief") || m.includes("concis")),
      );
    },
  );
});
