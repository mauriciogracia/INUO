const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  initSqliteDatabase,
  getDatabasePath,
} = require("../dist/cli/sqliteStorageEngine");
const { executeShellLine } = require("../dist/cli/shell");
const { loadState } = require("../dist/cli/context");

test("External Integrations & Provider Adapters Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_integrations_"));
  const dbPath = getDatabasePath(tmpDir);

  await t.test("integrations table schema exists and accepts structured connections", () => {
    const db = initSqliteDatabase(dbPath);
    assert.ok(db, "SQLite db should initialize");

    const stmt = db.prepare(`
      INSERT INTO integrations (id, name, category, provider, auth_type, endpoint, status, scope, scope_id, vault_secret_key_ref, rate_limit_per_minute, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    assert.doesNotThrow(() => {
      stmt.run(
        "conn_gemini_01",
        "GeminiFlash",
        "llm",
        "google-gemini",
        "apiKey",
        "https://generativelanguage.googleapis.com",
        "Connected",
        "global",
        null,
        "vault_gemini_key",
        120,
        now,
        now
      );
    });

    const rows = db.prepare("SELECT * FROM integrations WHERE id = ?").all("conn_gemini_01");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].provider, "google-gemini");
    assert.equal(rows[0].category, "llm");
    assert.equal(rows[0].vault_secret_key_ref, "vault_gemini_key");

    db.close();
  });

  await t.test("Google Workspace and Trello integration commands via semantic preferences", async () => {
    // Register Google Drive integration
    await executeShellLine(
      'preference add --key integration --category cloud_storage --provider google-drive --name "PersonalGoogleDrive"',
      tmpDir
    );

    // Register Trello integration scoped to project
    await executeShellLine(
      'preference add --key integration --category webhook --provider trello --name "RoadTrelloBoard" --project "EmergencyRoad"',
      tmpDir
    );

    const state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.ok(state.preferences);
    assert.ok(state.preferences["integration"]);
    assert.ok(state.preferences["project:EmergencyRoad:integration"]);
  });

  await t.test("Decoupled vault isolates API keys from public exports", async () => {
    // Set API Key via vault command
    await executeShellLine("key MOCK_SECRET_API_KEY_9999", tmpDir);

    const state = loadState(path.join(tmpDir, ".inuo-state.json"));
    // Public state json should not leak raw key
    assert.notEqual(JSON.stringify(state).includes("MOCK_SECRET_API_KEY_9999"), true);
  });

  await t.test("1-Step Google OAuth automatically provisions credentials, Drive sync & Gemini integrations", async () => {
    await executeShellLine("auth google engineer@gmail.com", tmpDir);

    const state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.activeUser.userName, "engineer@gmail.com");
    assert.equal(state.activeUser.lastAuthMethod, "OAuthIdentity");
    assert.equal(state.preferences["default_sync_channel"].value, "google-drive");

    const db = initSqliteDatabase(dbPath);
    const driveRows = db.prepare("SELECT * FROM integrations WHERE provider = ?").all("google-drive");
    assert.equal(driveRows.length, 1);
    assert.equal(driveRows[0].auth_type, "oauth2");
    assert.equal(driveRows[0].status, "Connected");

    const geminiRows = db.prepare("SELECT * FROM integrations WHERE provider = ?").all("google-gemini");
    assert.ok(geminiRows.length >= 1);
    assert.equal(geminiRows[0].category, "llm");
    db.close();
  });

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});


