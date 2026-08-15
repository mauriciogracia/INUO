const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  ProjectRepository,
  WorkspaceRepository,
  TaskRepository,
  PreferenceRepository,
  IntegrationRepository,
} = require("../dist/repositories");

test("Typed Repository Pattern & Micro-ORM Layer Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_repo_"));

  const projectRepo = new ProjectRepository(tmpDir);
  const workspaceRepo = new WorkspaceRepository(tmpDir);
  const taskRepo = new TaskRepository(tmpDir);
  const prefRepo = new PreferenceRepository(tmpDir);
  const integrationRepo = new IntegrationRepository(tmpDir);

  await t.test("ProjectRepository supports full CRUD and delta querying", () => {
    const proj = projectRepo.save({
      id: "proj_repo_01",
      name: "AutonomousPipeline",
      jurisdiction: "GLOBAL",
      status: "Active",
      createdAt: "2026-08-15T12:00:00.000Z",
      updatedAt: "2026-08-15T12:00:00.000Z",
    });
    assert.equal(proj.name, "AutonomousPipeline");

    const found = projectRepo.findById("proj_repo_01");
    assert.ok(found);
    assert.equal(found.name, "AutonomousPipeline");
    assert.equal(projectRepo.count(), 1);

    const mutated = projectRepo.findMutatedSince("2026-08-15T00:00:00.000Z");
    assert.equal(mutated.length, 1);

    const deleted = projectRepo.delete("proj_repo_01");
    assert.equal(deleted, true);
    assert.equal(projectRepo.count(), 0);
  });

  await t.test("WorkspaceRepository and TaskRepository execute typed operations", () => {
    workspaceRepo.save({
      id: "ws_repo_01",
      name: "SectorA",
      path: "/work/sectorA",
      status: "Active",
      createdAt: "2026-08-15T12:00:00.000Z",
      updatedAt: "2026-08-15T12:00:00.000Z",
    });
    assert.equal(workspaceRepo.count(), 1);

    taskRepo.save({
      id: "task_repo_01",
      title: "Lay Foundations",
      role: "Engineer",
      status: "InProgress",
      createdAt: "2026-08-15T12:00:00.000Z",
      updatedAt: "2026-08-15T12:00:00.000Z",
    });
    assert.equal(taskRepo.count(), 1);

    const task = taskRepo.findById("task_repo_01");
    assert.equal(task.title, "Lay Foundations");
  });

  await t.test("PreferenceRepository and IntegrationRepository map complex metadata", () => {
    prefRepo.save({
      key: "theme",
      value: "dark",
      scope: "global",
      enabled: true,
      createdAt: "2026-08-15T12:00:00.000Z",
      updatedAt: "2026-08-15T12:00:00.000Z",
    });

    const pref = prefRepo.findById("theme");
    assert.ok(pref);
    assert.equal(pref.value, "dark");

    integrationRepo.save({
      id: "conn_drive_01",
      name: "GoogleDrive",
      category: "cloud_storage",
      provider: "google-drive",
      authType: "oauth2",
      status: "Connected",
      scope: "global",
      vaultSecretKeyRef: "vault_key_drive",
      rateLimitPerMinute: 100,
      createdAt: "2026-08-15T12:00:00.000Z",
      updatedAt: "2026-08-15T12:00:00.000Z",
    });

    const conn = integrationRepo.findById("conn_drive_01");
    assert.ok(conn);
    assert.equal(conn.provider, "google-drive");
    assert.equal(conn.vaultSecretKeyRef, "vault_key_drive");
  });

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});
