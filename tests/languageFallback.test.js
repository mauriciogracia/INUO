const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { resolveLanguageAndIntent } = require('../dist/cli/languageFallbackEngine');
const { runMCPCommand } = require('../dist/cli/mcpCommand');
const { loadState, saveState, getProjectPaths } = require('../dist/cli/context');

test('Tiered Language & Intent Resolution Engine Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_fallback_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const statePath = path.join(scratchDir, '.inuo-state.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  await t.test('falls back to Tier 2 Catalog Engine when LLM is unavailable', async () => {
    const res = await resolveLanguageAndIntent('Request clean water supply', scratchDir);
    assert.strictEqual(res.resolutionTier, 'CatalogEngine');
    assert.strictEqual(res.parsedIntent.verb, 'Request');
    assert.strictEqual(res.resolvedLanguage, 'es');
  });

  await t.test('falls back to Tier 3 MCP Integration when MCP server is active and catalog misses', async () => {
    runMCPCommand(['add', '--name', 'ExternalSearch', '--url', 'https://mcp.search.api'], scratchDir);

    const res = await resolveLanguageAndIntent('Search latest weather forecast', scratchDir);
    assert.strictEqual(res.resolutionTier, 'MCPIntegration');
    assert.strictEqual(res.parsedIntent.mcpServerId !== undefined, true);
  });

  await t.test('falls back to Tier 4 Proactive Doubt Engine when prompt is unparseable and no active MCP server', async () => {
    const paths = getProjectPaths(scratchDir);
    const state = loadState(paths.statePath);
    state.mcpServers = []; // Clear MCP servers so Tier 3 is skipped
    saveState(paths.statePath, state);

    const res = await resolveLanguageAndIntent('xyz999 random unparseable text', scratchDir);
    assert.strictEqual(res.resolutionTier, 'ProactiveDoubt');
    assert.strictEqual(res.parsedIntent.type, 'PROACTIVE_DOUBT');

    const updatedState = loadState(statePath);
    assert.strictEqual(updatedState.doubts.length, 1);
  });

  // Cleanup
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
