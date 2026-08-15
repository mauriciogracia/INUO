const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addSessionTokens,
  getSessionStats,
  resetSessionStats,
  formatUsageDisplay,
} = require('../dist/cli/usageEngine');

test('AI Usage Engine Unit Tests', async (t) => {

  t.beforeEach(() => resetSessionStats());

  await t.test('getSessionStats returns zeros on fresh session', () => {
    const s = getSessionStats();
    assert.equal(s.requestCount, 0);
    assert.equal(s.totalTokens, 0);
    assert.equal(s.totalInputTokens, 0);
    assert.equal(s.totalOutputTokens, 0);
  });

  await t.test('addSessionTokens accumulates per call', () => {
    addSessionTokens(300, 100, 'gemini-test');
    addSessionTokens(500, 200, 'gemini-test');
    const s = getSessionStats();
    assert.equal(s.requestCount, 2);
    assert.equal(s.totalInputTokens, 800);
    assert.equal(s.totalOutputTokens, 300);
    assert.equal(s.totalTokens, 1100);
    assert.equal(s.model, 'gemini-test');
  });

  await t.test('resetSessionStats clears all counters', () => {
    addSessionTokens(100, 50, 'gemini-test');
    resetSessionStats();
    const s = getSessionStats();
    assert.equal(s.requestCount, 0);
    assert.equal(s.totalTokens, 0);
  });

  await t.test('formatUsageDisplay — connected provider shows capacity', () => {
    addSessionTokens(300, 100, 'gemini-test');
    const session = getSessionStats();
    const out = formatUsageDisplay(
      { connected: true, model: 'gemini-test', contextWindowTokens: 1_000_000, maxOutputTokens: 8192 },
      session,
    );
    assert.match(out, /Context window/);
    assert.match(out, /Connected/);
    assert.match(out, /Requests/);
    assert.match(out, /Total tokens/);
  });

  await t.test('formatUsageDisplay — disconnected shows error', () => {
    const session = getSessionStats();
    const out = formatUsageDisplay({ connected: false, error: 'API key invalid' }, session);
    assert.match(out, /API key invalid/);
  });

  await t.test('formatUsageDisplay — shows budget bar when limit provided', () => {
    addSessionTokens(50_000, 10_000, 'gemini-test');
    const session = getSessionStats();
    const out = formatUsageDisplay(
      { connected: true, model: 'gemini-test', contextWindowTokens: 1_000_000, maxOutputTokens: 8192 },
      session,
      500_000,
    );
    assert.match(out, /Remaining/);
    assert.match(out, /▓/);
  });
});

