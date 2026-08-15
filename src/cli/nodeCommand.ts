import { getProjectPaths, loadState, saveState } from "./context";
import { WorkflowNode } from "../interfaces/WorkflowNode";

function normalizeNodeName(value: string): string {
  return value.trim();
}

function findNodeByName(
  nodes: WorkflowNode[],
  nodeName: string,
): WorkflowNode | undefined {
  const normalized = normalizeNodeName(nodeName).toLowerCase();
  return nodes.find((node) => node.nodeName.toLowerCase() === normalized);
}

export function runNodeCommand(
  args: string[],
  rootDir: string = process.cwd(),
): void {
  const sub = args[0]?.toLowerCase() || "list";
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!state.workflowNodes) {
    state.workflowNodes = [];
  }

  if (sub === "list") {
    console.log("\x1b[36m%s\x1b[0m", "=== Workflow Nodes ===\n");
    if (state.workflowNodes.length === 0) {
      console.log(
        'No workflow nodes registered. Add one using "node add <nodeName> <engineConfiguration>"',
      );
      return;
    }

    console.log(
      `\x1b[1m${"NODE ID".padEnd(20)} | ${"NODE NAME".padEnd(24)} | ${"ENGINE CONFIGURATION".padEnd(30)} | UPDATED AT\x1b[0m`,
    );
    console.log("".padEnd(110, "-"));

    state.workflowNodes.forEach((node) => {
      console.log(
        `${node.nodeId.padEnd(20)} | \x1b[1m${node.nodeName.padEnd(24)}\x1b[0m | ${node.engineConfiguration.padEnd(30)} | ${node.updatedAt}`,
      );
    });
    return;
  }

  if (sub === "add" || sub === "create") {
    const nodeName = args[1];
    const engineConfiguration = args[2];

    if (!nodeName || !engineConfiguration) {
      console.log(
        "\x1b[33m%s\x1b[0m",
        "Usage: node add <nodeName> <engineConfiguration>",
      );
      return;
    }

    const existing = findNodeByName(state.workflowNodes, nodeName);
    if (existing) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        `Node \"${nodeName}\" already exists. Use \"node update <nodeName> <engineConfiguration>\".`,
      );
      return;
    }

    const now = new Date().toISOString();
    const node: WorkflowNode = {
      nodeId: `wf_node_${Date.now()}`,
      nodeName: normalizeNodeName(nodeName),
      engineConfiguration,
      createdAt: now,
      updatedAt: now,
    };

    state.workflowNodes.push(node);
    saveState(paths.statePath, state);

    console.log(
      "\x1b[32m%s\x1b[0m",
      `✔ Added workflow node \"${node.nodeName}\" with engine configuration \"${node.engineConfiguration}\".`,
    );
    return;
  }

  if (sub === "remove" || sub === "delete") {
    const nodeName = args[1];
    if (!nodeName) {
      console.log("\x1b[33m%s\x1b[0m", "Usage: node remove <nodeName>");
      return;
    }

    const before = state.workflowNodes.length;
    state.workflowNodes = state.workflowNodes.filter(
      (node) =>
        node.nodeName.toLowerCase() !==
        normalizeNodeName(nodeName).toLowerCase(),
    );

    if (state.workflowNodes.length === before) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        `Workflow node \"${nodeName}\" not found.`,
      );
      return;
    }

    saveState(paths.statePath, state);
    console.log(
      "\x1b[32m%s\x1b[0m",
      `✔ Removed workflow node \"${nodeName}\".`,
    );
    return;
  }

  if (sub === "update") {
    const nodeName = args[1];
    const engineConfiguration = args[2];

    if (!nodeName || !engineConfiguration) {
      console.log(
        "\x1b[33m%s\x1b[0m",
        "Usage: node update <nodeName> <engineConfiguration>",
      );
      return;
    }

    const node = findNodeByName(state.workflowNodes, nodeName);
    if (!node) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        `Workflow node \"${nodeName}\" not found.`,
      );
      return;
    }

    node.engineConfiguration = engineConfiguration;
    node.updatedAt = new Date().toISOString();

    saveState(paths.statePath, state);
    console.log(
      "\x1b[32m%s\x1b[0m",
      `✔ Updated workflow node \"${node.nodeName}\" to engine configuration \"${node.engineConfiguration}\".`,
    );
    return;
  }

  console.log(
    'Unknown subcommand for node. Supported: "node add <nodeName> <engineConfiguration>", "node list", "node update <nodeName> <engineConfiguration>", "node remove <nodeName>"',
  );
}
