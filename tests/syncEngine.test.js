const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const { runBootstrap } = require("../dist/cli/bootstrapCommand");
const { checkAndApplySyncProtocol } = require("../dist/cli/syncEngine");
const { loadManifest } = require("../dist/cli/context");

test("Sync Engine Automated Detection & Verification Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_sync_"));
  const manifestPath = path.join(tmpDir, "inuo-manifest.json");
  const specPath = path.join(tmpDir, "INUO_SPEC.md");

  runBootstrap(tmpDir);

  await t.test("detects when manifest and spec are synchronized", () => {
    const result = checkAndApplySyncProtocol(tmpDir);
    assert.equal(result.status, "Synced");
    assert.equal(result.currentManifestVersion, "00.03.72");
  });

  await t.test(
    'detects spec version upgrade (e.g. SPEC_VERSION: "00.03.00") and applies verification update',
    () => {
      // Simulate updating SPEC_VERSION in INUO_SPEC.md to 00.03.00
      const newSpecContent = `# INUO Core Persistent System Prompt (\`INUO_SPEC.md\`)
SPEC_VERSION: "00.03.00"
`;
      fs.writeFileSync(specPath, newSpecContent, "utf8");

      const result = checkAndApplySyncProtocol(tmpDir);
      assert.equal(result.status, "VerificationPassed");
      assert.equal(result.currentManifestVersion, "00.03.00");

      // Verify manifest updated
      const manifest = loadManifest(manifestPath);
      assert.equal(manifest.SPEC_VERSION, "00.03.00");
    },
  );

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
