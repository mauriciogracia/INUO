const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  initSqliteDatabase,
  getDatabasePath,
  persistStateToSqlite,
  queryMutatedEntitiesSince,
} = require("../dist/cli/sqliteStorageEngine");
const { saveState, loadState } = require("../dist/cli/context");

test("Phase 2: Hybrid L1 RAM + L2 SQLite WAL Storage Layer Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_sqlite_"));
  const dbPath = getDatabasePath(tmpDir);
  const statePath = path.join(tmpDir, ".inuo-state.json");

  await t.test("initializes SQLite database in WAL mode with correct tables", () => {
    const db = initSqliteDatabase(dbPath);
    assert.ok(db, "SQLite database should initialize successfully");
    if (db) db.close();
    assert.ok(fs.existsSync(dbPath), ".inuo.db file should exist on disk");
  });

  await t.test("Write-Through & Dual-Write: saveState persists to both SQLite and JSON", () => {
    const sampleState = {
      projects: [
        {
          id: "proj_test_101",
          name: "TestProject",
          jurisdiction: "GLOBAL",
          status: "Active",
          createdAt: "2026-08-15T12:00:00.000Z",
          updatedAt: "2026-08-15T12:00:00.000Z",
        },
      ],
      workspaces: [
        {
          id: "ws_test_202",
          name: "TestWorkspace",
          path: "/tmp/ws",
          status: "Active",
          createdAt: "2026-08-15T12:00:00.000Z",
          updatedAt: "2026-08-15T12:00:00.000Z",
        },
      ],
      needs: [
        {
          id: "need_303",
          verb: "Request",
          object: "Sand",
          complementVerb: "Donate",
          modelType: "GiftBased",
          status: "Open",
          isAtomic: true,
          prerequisiteNeedIds: [],
          createdAt: "2026-08-15T12:00:00.000Z",
          updatedAt: "2026-08-15T12:00:00.000Z",
        },
      ],
      preferences: {
        "project:proj_test_101:llm_provider": {
          key: "llm_provider",
          value: "gemini-pro",
          scope: "project",
          scopeId: "proj_test_101",
          enabled: true,
          createdAt: "2026-08-15T12:00:00.000Z",
          updatedAt: "2026-08-15T12:00:00.000Z",
        },
      },
    };

    saveState(statePath, sampleState);

    // Verify JSON was exported (Dual-Write)
    assert.ok(fs.existsSync(statePath), ".inuo-state.json must exist");
    const jsonContent = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(jsonContent.projects[0].name, "TestProject");

    // Verify SQLite has persisted rows
    const mutatedProjects = queryMutatedEntitiesSince("projects", "2026-08-15T00:00:00.000Z", tmpDir);
    assert.ok(mutatedProjects.length >= 1, "Should find at least 1 mutated project in SQLite");
    assert.equal(mutatedProjects[0].name, "TestProject");

    const mutatedTasks = queryMutatedEntitiesSince("tasks", "2026-08-15T00:00:00.000Z", tmpDir);
    assert.ok(mutatedTasks.length >= 1, "Should find at least 1 task/need in SQLite");
    assert.equal(mutatedTasks[0].verb, "Request");
  });

  await t.test("Zero-Loss Auto-Recovery: loadState rehydrates seamlessly from SQLite when JSON is deleted", () => {
    // 1. Delete JSON file
    fs.unlinkSync(statePath);
    assert.equal(fs.existsSync(statePath), false);

    // 2. loadState should recover state directly from .inuo.db
    const recovered = loadState(statePath);
    assert.ok(recovered.projects.length >= 1, "Should recover projects from SQLite");
    assert.equal(recovered.projects[0].name, "TestProject");
    assert.ok(recovered.needs.length >= 1, "Should recover needs from SQLite");
    assert.equal(recovered.needs[0].verb, "Request");
    assert.ok(recovered.preferences["project:proj_test_101:llm_provider"]);
  });

  await t.test("Maintenance: vacuumSqliteDatabase and getSqliteDatabaseStats return telemetry", () => {
    const { vacuumSqliteDatabase, getSqliteDatabaseStats } = require("../dist/cli/sqliteStorageEngine");

    const vacuumed = vacuumSqliteDatabase(tmpDir);
    assert.equal(vacuumed, true);

    const stats = getSqliteDatabaseStats(tmpDir);
    assert.equal(stats.exists, true);
    assert.ok(stats.sizeBytes > 0);
    assert.ok(stats.tables["projects"] >= 1);
    assert.ok(stats.tables["tasks"] >= 1);
  });

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});

