const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { loadEnvironment, saveGeminiApiKey } = require('../dist/cli/environment');

test('Environment Configuration Unit Tests', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp_env_'));

  await t.test('loads default environment configuration', () => {
    const env = loadEnvironment(tmpDir);
    assert.equal(env.specVersion, '00.02.95');
    assert.equal(env.cliVersion, '00.02.95');
    assert.equal(env.defaultModel, 'gemini-3.6-flash');
  });

  await t.test('saves and detects Gemini API Key', () => {
    const testKey = 'test_gemini_key_12345';
    saveGeminiApiKey(testKey, tmpDir);

    const env = loadEnvironment(tmpDir);
    assert.equal(env.geminiApiKey, testKey);
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
