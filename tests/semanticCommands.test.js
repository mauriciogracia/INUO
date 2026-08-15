const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  normalizeSemanticEntity,
  normalizeSemanticAction,
  parseSemanticCommand,
  executeSemanticCommand,
} = require("../dist/cli/semanticDispatcher");
const { executeShellLine } = require("../dist/cli/shell");
const { loadState } = require("../dist/cli/context");

test("INOU Semantic Entity-Action Command Grammar Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_semantic_"));

  await t.test("Entity token normalization resolves canonical and multilingual names", () => {
    assert.equal(normalizeSemanticEntity("project"), "project");
    assert.equal(normalizeSemanticEntity("proyecto"), "project");
    assert.equal(normalizeSemanticEntity("workspace"), "workspace");
    assert.equal(normalizeSemanticEntity("espacio"), "workspace");
    assert.equal(normalizeSemanticEntity("task"), "task");
    assert.equal(normalizeSemanticEntity("tarea"), "task");
    assert.equal(normalizeSemanticEntity("workflow"), "task");
    assert.equal(normalizeSemanticEntity("node"), "task");
    assert.equal(normalizeSemanticEntity("memory"), "memory");
    assert.equal(normalizeSemanticEntity("memoria"), "memory");
    assert.equal(normalizeSemanticEntity("preference"), "preference");
    assert.equal(normalizeSemanticEntity("preferencia"), "preference");
    assert.equal(normalizeSemanticEntity("unknown_xyz"), null);
  });

  await t.test("Action token normalization resolves canonical and multilingual verbs", () => {
    assert.equal(normalizeSemanticAction("add"), "add");
    assert.equal(normalizeSemanticAction("agregar"), "add");
    assert.equal(normalizeSemanticAction("crear"), "add");
    assert.equal(normalizeSemanticAction("update"), "update");
    assert.equal(normalizeSemanticAction("actualizar"), "update");
    assert.equal(normalizeSemanticAction("enable"), "enable");
    assert.equal(normalizeSemanticAction("habilitar"), "enable");
    assert.equal(normalizeSemanticAction("activar"), "enable");
    assert.equal(normalizeSemanticAction("disable"), "disable");
    assert.equal(normalizeSemanticAction("desactivar"), "disable");
    assert.equal(normalizeSemanticAction("deshabilitar"), "disable");
    assert.equal(normalizeSemanticAction("remove"), "remove");
    assert.equal(normalizeSemanticAction("eliminar"), "remove");
    assert.equal(normalizeSemanticAction("borrar"), "remove");
    assert.equal(normalizeSemanticAction("list"), "list");
    assert.equal(normalizeSemanticAction("listar"), "list");
    assert.equal(normalizeSemanticAction("invalid_verb"), null);
  });

  await t.test("Parser correctly extracts Entity, Action, Flags, and positional ID", () => {
    const payload = parseSemanticCommand([
      "task",
      "add",
      "--workflow",
      "wf_001",
      "--title",
      "Deploy API Gateway",
      "--role",
      "Architect",
    ]);
    assert.ok(payload);
    assert.equal(payload.entity, "task");
    assert.equal(payload.action, "add");
    assert.equal(payload.options.workflow, "wf_001");
    assert.equal(payload.options.title, "Deploy API Gateway");
    assert.equal(payload.options.role, "Architect");
  });

  await t.test("Project entity supports full CRUD lifecycle (add, update, enable, disable, remove, list)", async () => {
    await executeShellLine("project add --name Alpha --jurisdiction US-CA", tmpDir);
    let state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.ok(state.projects && state.projects.length >= 1);
    const proj = state.projects[0];
    assert.equal(proj.name, "Alpha");
    assert.equal(proj.status, "Active");

    await executeShellLine(`project update ${proj.id} --name Alpha-v2`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.projects[0].name, "Alpha-v2");

    await executeShellLine(`project disable ${proj.id}`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.projects[0].status, "Disabled");

    await executeShellLine(`project enable ${proj.id}`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.projects[0].status, "Active");

    await executeShellLine(`project list`, tmpDir);

    await executeShellLine(`project remove ${proj.id}`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.projects.length, 0);
  });

  await t.test("Workspace entity supports full CRUD lifecycle", async () => {
    const wsTarget = path.join(tmpDir, "sample-ws");
    fs.mkdirSync(wsTarget, { recursive: true });

    await executeShellLine(`workspace add --path "${wsTarget}" --name SampleWorkspace`, tmpDir);
    let state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.ok(state.workspaces && state.workspaces.length >= 1);
    const ws = state.workspaces[0];
    assert.equal(ws.name, "SampleWorkspace");

    await executeShellLine(`workspace disable ${ws.id}`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.workspaces[0].status, "Disabled");

    await executeShellLine(`workspace enable ${ws.id}`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.workspaces[0].status, "Active");

    await executeShellLine(`workspace list`, tmpDir);

    await executeShellLine(`workspace remove ${ws.id}`, tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.workspaces.length, 0);
  });

  await t.test("Task entity routes node, workflow, need and offer actions", async () => {
    // Add workflow
    await executeShellLine("task add --type workflow --name CorePipeline", tmpDir);
    // Add node
    await executeShellLine("task add --title BuildModule --role Developer", tmpDir);
    // Add need & offer
    await executeShellLine("task add --type need --verb Request --object Storage", tmpDir);
    await executeShellLine("task add --type offer --verb Provide --object Storage", tmpDir);

    // List tasks
    await executeShellLine("task list", tmpDir);
    // List matches
    await executeShellLine("task list --matches", tmpDir);
  });

  await t.test("Preference entity manages UI mode, roles, aliases, and settings", async () => {
    await executeShellLine("preference update --key mode --value letMeServeYou", tmpDir);
    let state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.operatingMode.currentMode, "letMeServeYou");

    await executeShellLine("preference update --key role --value MasterTrainer", tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.currentRole, "MasterTrainer");

    await executeShellLine("preference add --key alias --name quick-status --target status", tmpDir);
    await executeShellLine("preference list", tmpDir);
    await executeShellLine("preference remove --key alias --name quick-status", tmpDir);
  });

  await t.test("Multilingual Spanish commands execute transparently", async () => {
    await executeShellLine("proyecto agregar --name ProyectoBeta", tmpDir);
    let state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.ok(state.projects.some((p) => p.name === "ProyectoBeta"));

    await executeShellLine("preferencia actualizar --key mode --value promptMe", tmpDir);
    state = loadState(path.join(tmpDir, ".inuo-state.json"));
    assert.equal(state.operatingMode.currentMode, "promptMe");
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
