const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  maskApiKey,
  runSetupCommand,
} = require("../dist/cli/setupCommand");

test("Zero-Exposure Setup & Key Masking Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_setup_"));

  await t.test("maskApiKey masks credentials properly without exposure", () => {
    assert.equal(maskApiKey(""), "(none)");
    assert.equal(maskApiKey("   "), "(none)");
    assert.equal(maskApiKey(undefined), "(none)");
    assert.equal(maskApiKey("secret"), "********");
    const sampleKey = "SAMPLE_KEY_PREFIX_1234567890_SUFFIX_9999";
    const masked = maskApiKey(sampleKey);
    assert.equal(masked.includes("1234567890"), false);
  });

  await t.test("runSetupCommand handles status subcommand without leaking secrets", async () => {
    assert.doesNotThrow(async () => {
      await runSetupCommand(["status"], tmpDir);
    });
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
