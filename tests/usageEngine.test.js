const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  recordUsage,
  getSummary,
  formatUsageDisplay,
  resetUsage,
} = require("../dist/cli/usageEngine");

test("AI Usage Engine Unit Tests", async (t) => {
  const scratchDir = path.join(__dirname, "scratch_usage_test");
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const statePath = path.join(scratchDir, ".inuo-state.json");
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  t.after(() => {
    if (fs.existsSync(scratchDir))
      fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  await t.test("getSummary returns empty state when no records", () => {
    const s = getSummary(scratchDir);
    assert.equal(s.requestCount, 0);
    assert.equal(s.totalTokens, 0);
    assert.equal(s.totalInputTokens, 0);
    assert.equal(s.totalOutputTokens, 0);
  });

  await t.test("recordUsage persists a call record", () => {
    recordUsage(
      {
        model: "gemini-test",
        command: "test query",
        inputTokens: 300,
        outputTokens: 100,
        timestamp: new Date().toISOString(),
      },
      scratchDir,
    );
    const s = getSummary(scratchDir);
    assert.equal(s.requestCount, 1);
    assert.equal(s.totalInputTokens, 300);
    assert.equal(s.totalOutputTokens, 100);
    assert.equal(s.totalTokens, 400);
    assert.equal(s.model, "gemini-test");
  });

  await t.test("recordUsage accumulates across multiple calls", () => {
    recordUsage(
      {
        model: "gemini-test",
        command: "second query",
        inputTokens: 500,
        outputTokens: 200,
        timestamp: new Date().toISOString(),
      },
      scratchDir,
    );
    const s = getSummary(scratchDir);
    assert.equal(s.requestCount, 2);
    assert.equal(s.totalInputTokens, 800);
    assert.equal(s.totalOutputTokens, 300);
    assert.equal(s.totalTokens, 1100);
  });

  await t.test("formatUsageDisplay contains model and token counts", () => {
    const s = getSummary(scratchDir);
    const display = formatUsageDisplay(s);
    assert.match(display, /gemini-test/);
    assert.match(display, /Requests/);
    assert.match(display, /Total tokens/);
  });
  await t.test(
    "formatUsageDisplay includes provider section when capacity supplied",
    () => {
      const s = getSummary(scratchDir);
      const display = formatUsageDisplay(s, {
        connected: true,
        contextWindowTokens: 1_000_000,
        maxOutputTokens: 8192,
      });
      assert.match(display, /Context window/);
      assert.match(display, /Connected/);
    },
  );

  await t.test("formatUsageDisplay shows disconnected message on error", () => {
    const s = getSummary(scratchDir);
    const display = formatUsageDisplay(s, {
      connected: false,
      error: "API key invalid",
    });
    assert.match(display, /API key invalid/);
  });
  await t.test("resetUsage clears the log", () => {
    resetUsage(scratchDir);
    const s = getSummary(scratchDir);
    assert.equal(s.requestCount, 0);
    assert.equal(s.totalTokens, 0);
  });
});
