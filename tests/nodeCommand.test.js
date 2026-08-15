const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { executeShellLine } = require("../dist/cli/shell");
const { loadState } = require("../dist/cli/context");

test("Workflow node CRUD command", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(__dirname, "tmp_node_command_"));
  const statePath = path.join(scratchDir, ".inuo-state.json");

  await t.test("adds a workflow node", async () => {
    await executeShellLine("node add planner-node gemini-prod", scratchDir);

    const state = loadState(statePath);
    assert.ok(Array.isArray(state.workflowNodes));
    assert.equal(state.workflowNodes.length, 1);
    assert.equal(state.workflowNodes[0].nodeName, "planner-node");
    assert.equal(state.workflowNodes[0].engineConfiguration, "gemini-prod");
  });

  await t.test("updates an existing workflow node", async () => {
    await executeShellLine(
      "node update planner-node copilot-default",
      scratchDir,
    );

    const state = loadState(statePath);
    assert.equal(state.workflowNodes.length, 1);
    assert.equal(state.workflowNodes[0].nodeName, "planner-node");
    assert.equal(state.workflowNodes[0].engineConfiguration, "copilot-default");
  });

  await t.test("lists nodes without mutating state", async () => {
    await executeShellLine("node list", scratchDir);

    const state = loadState(statePath);
    assert.equal(state.workflowNodes.length, 1);
  });

  await t.test("removes a workflow node", async () => {
    await executeShellLine("node remove planner-node", scratchDir);

    const state = loadState(statePath);
    assert.equal(state.workflowNodes.length, 0);
  });

  fs.rmSync(scratchDir, { recursive: true, force: true });
});
