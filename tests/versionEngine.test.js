const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { formatInuoVersionString, parseInuoVersionString, calculateInuoVersion } = require('../dist/cli/versionEngine');

test('INUO Versioning Model (aa.bb.cc) Unit Tests', async (t) => {
  const scratchDir = path.join(__dirname, 'scratch_version_test');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  await t.test('formats numbers into zero-padded aa.bb.cc version strings', () => {
    assert.strictEqual(formatInuoVersionString(1, 95, 2), '01.95.02');
    assert.strictEqual(formatInuoVersionString(0, 5, 0), '00.05.00');
    assert.strictEqual(formatInuoVersionString(100, 99, 10), '99.99.10');
  });

  await t.test('parses version string into structured InuoVersionSpec object', () => {
    const spec = parseInuoVersionString('01.95.02');
    assert.strictEqual(spec.deployedPercentage, 1);
    assert.strictEqual(spec.implementationPercentage, 95);
    assert.strictEqual(spec.specRevisionIndex, 2);
    assert.strictEqual(spec.fullVersionString, '01.95.02');
  });

  await t.test('calculates system version matching target 01.95.02', () => {
    const sysVer = calculateInuoVersion(scratchDir);
    assert.strictEqual(sysVer.fullVersionString, '01.95.02');
    assert.strictEqual(sysVer.deployedPercentage, 1);
    assert.strictEqual(sysVer.implementationPercentage, 95);
    assert.strictEqual(sysVer.specRevisionIndex, 2);
  });

  // Cleanup
  if (fs.existsSync(scratchDir)) fs.rmSync(scratchDir, { recursive: true, force: true });
});
