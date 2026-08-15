import fs from "fs";
import path from "path";
import { SemanticEntity } from "../types/SemanticEntity";
import { SemanticAction } from "../types/SemanticAction";
import { SemanticCommandPayload } from "../interfaces/SemanticCommandPayload";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";
import { writeOutput } from "./outputRouter";
import { loadState, saveState, getProjectPaths } from "./context";
import { runNodeCommand } from "./nodeCommand";
import { runNeedCommand } from "./needCommand";
import { runOfferCommand } from "./offerCommand";
import { runMatchCommand } from "./matchCommand";
import { runAliasCommand } from "./aliasCommand";
import { runSocialMediaCommand } from "./snCommand";
import { runModeCommand } from "./modeCommand";
import { runTierCommand } from "./tierCommand";
import {
  runRoleCommand,
  runPrincipleCommand,
  runBehaviorCommand,
  runSkillCommand,
} from "./governanceCommand";
import { runForgetCommand } from "./forgetCommand";
import { processUserCorrection } from "./learningEngine";
import { saveApiKey, getStoredApiKey } from "./aiClient";

/**
 * Normalizes raw input entity token to canonical SemanticEntity.
 * Supports multilingual synonyms (English, Spanish, Portuguese, French, German) and abbreviations.
 */
export function normalizeSemanticEntity(raw: string): SemanticEntity | null {
  const token = (raw || "").toLowerCase().trim();
  switch (token) {
    case "project":
    case "proyecto":
    case "projet":
    case "projekt":
    case "p":
      return "project";

    case "workspace":
    case "espacio":
    case "espace":
    case "arbeitsbereich":
    case "ws":
    case "w":
      return "workspace";

    case "task":
    case "tarea":
    case "tache":
    case "aufgabe":
    case "t":
    case "node":
    case "nodo":
    case "workflow":
    case "flujo":
    case "need":
    case "necesidad":
    case "offer":
    case "oferta":
      return "task";

    case "memory":
    case "memoria":
    case "memoire":
    case "gedachtnis":
    case "m":
    case "skill":
    case "habilidad":
    case "principle":
    case "principio":
    case "behavior":
    case "comportamiento":
    case "correction":
    case "correccion":
      return "memory";

    case "preference":
    case "preferencia":
    case "einstellung":
    case "pref":
    case "cfg":
    case "config":
    case "setting":
    case "ajuste":
    case "alias":
    case "role":
    case "rol":
    case "mode":
    case "modo":
      return "preference";

    default:
      return null;
  }
}

/**
 * Normalizes raw input action token to canonical SemanticAction.
 * Supports multilingual synonyms (English, Spanish, French, Portuguese, German) and abbreviations.
 */
export function normalizeSemanticAction(raw: string): SemanticAction | null {
  const token = (raw || "").toLowerCase().trim();
  switch (token) {
    case "add":
    case "agregar":
    case "ajouter":
    case "adicionar":
    case "hinzufugen":
    case "create":
    case "crear":
    case "new":
    case "nuevo":
    case "a":
    case "c":
      return "add";

    case "update":
    case "actualizar":
    case "modifier":
    case "atualizar":
    case "aktualisieren":
    case "edit":
    case "editar":
    case "set":
    case "u":
      return "update";

    case "enable":
    case "habilitar":
    case "activar":
    case "activer":
    case "ativar":
    case "aktivieren":
    case "resume":
    case "reanudar":
      return "enable";

    case "disable":
    case "deshabilitar":
    case "desactivar":
    case "desactiver":
    case "desativar":
    case "deaktivieren":
    case "pause":
    case "pausar":
      return "disable";

    case "remove":
    case "eliminar":
    case "borrar":
    case "supprimer":
    case "remover":
    case "entfernen":
    case "delete":
    case "del":
    case "rm":
    case "r":
      return "remove";

    case "list":
    case "listar":
    case "lister":
    case "auflisten":
    case "ver":
    case "show":
    case "mostrar":
    case "ls":
    case "l":
    case "all":
    case "todos":
      return "list";

    default:
      return null;
  }
}

/**
 * Parses raw argument tokens into a structured SemanticCommandPayload.
 */
export function parseSemanticCommand(args: string[]): SemanticCommandPayload | null {
  if (!args || args.length === 0) return null;

  const entity = normalizeSemanticEntity(args[0]);
  if (!entity) return null;

  const action = normalizeSemanticAction(args[1] || "list");
  if (!action) return null;

  const remaining = args.slice(2);
  const options: Record<string, any> = {};
  let targetId: string | undefined = undefined;

  for (let i = 0; i < remaining.length; i++) {
    const token = remaining[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const nextToken = remaining[i + 1];
      if (nextToken && !nextToken.startsWith("--")) {
        options[key] = nextToken.replace(/^["']|["']$/g, "");
        i++;
      } else {
        options[key] = true;
      }
    } else if (token.startsWith("-") && token.length === 2) {
      const key = token.slice(1);
      const nextToken = remaining[i + 1];
      if (nextToken && !nextToken.startsWith("-")) {
        options[key] = nextToken.replace(/^["']|["']$/g, "");
        i++;
      } else {
        options[key] = true;
      }
    } else if (!targetId) {
      targetId = token.replace(/^["']|["']$/g, "");
    }
  }

  return {
    entity,
    action,
    targetId,
    options,
    rawArgs: args,
  };
}

/**
 * Dispatches and executes a canonical Semantic Command.
 */
export async function executeSemanticCommand(
  payload: SemanticCommandPayload,
  rootDir: string = process.cwd(),
): Promise<boolean> {
  const { entity, action, targetId, options, rawArgs } = payload;

  switch (entity) {
    case "project": {
      return executeProjectAction(action, targetId, options, rootDir);
    }

    case "workspace": {
      return executeWorkspaceAction(action, targetId, options, rootDir);
    }

    case "task": {
      return executeTaskAction(action, targetId, options, rawArgs, rootDir);
    }

    case "memory": {
      return executeMemoryAction(action, targetId, options, rawArgs, rootDir);
    }

    case "preference": {
      return executePreferenceAction(action, targetId, options, rawArgs, rootDir);
    }

    default:
      return false;
  }
}

// -----------------------------------------------------------------------------
// 1. PROJECT ENTITY HANDLER
// -----------------------------------------------------------------------------
function executeProjectAction(
  action: SemanticAction,
  targetId: string | undefined,
  options: Record<string, any>,
  rootDir: string,
): boolean {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const projects = state.projects || [];

  switch (action) {
    case "add": {
      const name = options.name || targetId || "DefaultProject";
      const jurisdiction = options.jurisdiction || options.j || "GLOBAL";
      const newProj = {
        id: `proj_${Date.now()}`,
        name,
        jurisdiction,
        status: "Active",
        createdAt: new Date().toISOString(),
      };
      projects.push(newProj);
      state.projects = projects;
      state.activeProject = newProj.id;
      saveState(paths.statePath, state);
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        `\x1b[32m✔ Project added: "${name}" [ID: ${newProj.id}, Jurisdiction: ${jurisdiction}]\x1b[0m`,
      );
      return true;
    }

    case "update": {
      const id = targetId || state.activeProject;
      const proj = projects.find((p: any) => p.id === id || p.name === id);
      if (!proj) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Project not found: ${id}\x1b[0m`);
        return false;
      }
      if (options.name) proj.name = options.name;
      if (options.jurisdiction) proj.jurisdiction = options.jurisdiction;
      if (options.status) proj.status = options.status;
      saveState(paths.statePath, state);
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        `\x1b[32m✔ Project updated: "${proj.name}" [ID: ${proj.id}, Status: ${proj.status}]\x1b[0m`,
      );
      return true;
    }

    case "enable": {
      const id = targetId || state.activeProject;
      const proj = projects.find((p: any) => p.id === id || p.name === id);
      if (!proj) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Project not found: ${id}\x1b[0m`);
        return false;
      }
      proj.status = "Active";
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Project enabled: "${proj.name}" [ID: ${proj.id}]\x1b[0m`);
      return true;
    }

    case "disable": {
      const id = targetId || state.activeProject;
      const proj = projects.find((p: any) => p.id === id || p.name === id);
      if (!proj) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Project not found: ${id}\x1b[0m`);
        return false;
      }
      proj.status = "Disabled";
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[33m✔ Project disabled: "${proj.name}" [ID: ${proj.id}]\x1b[0m`);
      return true;
    }

    case "remove": {
      const id = targetId || state.activeProject;
      const index = projects.findIndex((p: any) => p.id === id || p.name === id);
      if (index === -1) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Project not found: ${id}\x1b[0m`);
        return false;
      }
      const removed = projects.splice(index, 1)[0];
      state.projects = projects;
      if (state.activeProject === removed.id) {
        delete state.activeProject;
      }
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Project removed: "${removed.name}" [ID: ${removed.id}]\x1b[0m`);
      return true;
    }

    case "list":
    default: {
      writeOutput(OutputChannelEnum.USER_REPLY, `\n\x1b[36m=== INOU Projects (${projects.length}) ===\x1b[0m`);
      if (projects.length === 0) {
        writeOutput(OutputChannelEnum.USER_REPLY, `  (No custom projects configured. Using default workspace root.)`);
      } else {
        projects.forEach((p: any) => {
          const activeTag = p.id === state.activeProject ? " [ACTIVE]" : "";
          const statusTag = p.status === "Disabled" ? " \x1b[31m(Disabled)\x1b[0m" : " \x1b[32m(Active)\x1b[0m";
          writeOutput(OutputChannelEnum.USER_REPLY, `  • [${p.id}] ${p.name}${statusTag}${activeTag}`);
        });
      }
      return true;
    }
  }
}

// -----------------------------------------------------------------------------
// 2. WORKSPACE ENTITY HANDLER
// -----------------------------------------------------------------------------
function executeWorkspaceAction(
  action: SemanticAction,
  targetId: string | undefined,
  options: Record<string, any>,
  rootDir: string,
): boolean {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const workspaces = state.workspaces || [];

  switch (action) {
    case "add": {
      const wsPath = options.path || targetId || rootDir;
      const name = options.name || path.basename(wsPath);
      const newWs = {
        id: `ws_${Date.now()}`,
        name,
        path: path.resolve(wsPath),
        status: "Active",
        createdAt: new Date().toISOString(),
      };
      workspaces.push(newWs);
      state.workspaces = workspaces;
      state.activeWorkspace = newWs.id;
      saveState(paths.statePath, state);
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        `\x1b[32m✔ Workspace added: "${name}" -> ${newWs.path}\x1b[0m`,
      );
      return true;
    }

    case "update": {
      const id = targetId || state.activeWorkspace;
      const ws = workspaces.find((w: any) => w.id === id || w.name === id);
      if (!ws) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Workspace not found: ${id}\x1b[0m`);
        return false;
      }
      if (options.name) ws.name = options.name;
      if (options.path) ws.path = path.resolve(options.path);
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Workspace updated: "${ws.name}" -> ${ws.path}\x1b[0m`);
      return true;
    }

    case "enable": {
      const id = targetId || state.activeWorkspace;
      const ws = workspaces.find((w: any) => w.id === id || w.name === id);
      if (!ws) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Workspace not found: ${id}\x1b[0m`);
        return false;
      }
      ws.status = "Active";
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Workspace enabled: "${ws.name}"\x1b[0m`);
      return true;
    }

    case "disable": {
      const id = targetId || state.activeWorkspace;
      const ws = workspaces.find((w: any) => w.id === id || w.name === id);
      if (!ws) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Workspace not found: ${id}\x1b[0m`);
        return false;
      }
      ws.status = "Disabled";
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[33m✔ Workspace disabled: "${ws.name}"\x1b[0m`);
      return true;
    }

    case "remove": {
      const id = targetId || state.activeWorkspace;
      const idx = workspaces.findIndex((w: any) => w.id === id || w.name === id);
      if (idx === -1) {
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[31m❌ Workspace not found: ${id}\x1b[0m`);
        return false;
      }
      const removed = workspaces.splice(idx, 1)[0];
      state.workspaces = workspaces;
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Workspace removed: "${removed.name}"\x1b[0m`);
      return true;
    }

    case "list":
    default: {
      writeOutput(OutputChannelEnum.USER_REPLY, `\n\x1b[36m=== INOU Workspaces ===\x1b[0m`);
      writeOutput(OutputChannelEnum.USER_REPLY, `  • Current Workspace Root: ${rootDir}`);
      workspaces.forEach((w: any) => {
        const activeTag = w.id === state.activeWorkspace ? " [ACTIVE]" : "";
        const statusTag = w.status === "Disabled" ? " \x1b[31m(Disabled)\x1b[0m" : " \x1b[32m(Active)\x1b[0m";
        writeOutput(OutputChannelEnum.USER_REPLY, `  • [${w.id}] ${w.name}: ${w.path}${statusTag}${activeTag}`);
      });
      return true;
    }
  }
}

// -----------------------------------------------------------------------------
// 3. TASK ENTITY HANDLER (Workflows, Nodes, Needs, Offers, DAG)
// -----------------------------------------------------------------------------
function executeTaskAction(
  action: SemanticAction,
  targetId: string | undefined,
  options: Record<string, any>,
  rawArgs: string[],
  rootDir: string,
): boolean {
  const subType = (options.type || "").toLowerCase();

  switch (action) {
    case "add": {
      if (subType === "workflow" || options.workflow_name) {
        const name = options.name || options.workflow_name || targetId || "NewWorkflow";
        runNodeCommand(["add", "--workflow", name], rootDir);
        return true;
      }
      if (subType === "need" || (options.verb && !options.complement)) {
        runNeedCommand(["create", "--verb", options.verb || "Request", "--object", options.object || "Item"], rootDir);
        return true;
      }
      if (subType === "offer" || options.complement) {
        runOfferCommand(["create", "--verb", options.verb || options.complement || "Provide", "--object", options.object || "Item"], rootDir);
        return true;
      }

      // Default to adding a task node to the DAG
      const title = options.title || options.name || targetId || "New Task";
      const wfId = options.workflow || options.parent;
      const cmdArgs = ["add", "--title", title];
      if (wfId) cmdArgs.push("--workflow", wfId);
      if (options.role) cmdArgs.push("--role", options.role);
      runNodeCommand(cmdArgs, rootDir);
      return true;
    }

    case "update": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: task update <taskId> [--status <Status>] [--title <Title>]`);
        return false;
      }
      const cmdArgs = ["update", targetId];
      if (options.status) cmdArgs.push("--status", options.status);
      if (options.title) cmdArgs.push("--title", options.title);
      runNodeCommand(cmdArgs, rootDir);
      return true;
    }

    case "enable": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: task enable <taskId>`);
        return false;
      }
      runNodeCommand(["update", targetId, "--status", "Open"], rootDir);
      return true;
    }

    case "disable": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: task disable <taskId>`);
        return false;
      }
      runNodeCommand(["update", targetId, "--status", "Blocked"], rootDir);
      return true;
    }

    case "remove": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: task remove <taskId>`);
        return false;
      }
      runNodeCommand(["delete", targetId], rootDir);
      return true;
    }

    case "list":
    default: {
      if (options.matches || subType === "match") {
        runMatchCommand(rootDir);
        return true;
      }
      const wfId = options.workflow || targetId;
      const cmdArgs = wfId ? ["list", wfId] : ["list"];
      runNodeCommand(cmdArgs, rootDir);
      return true;
    }
  }
}

// -----------------------------------------------------------------------------
// 4. MEMORY ENTITY HANDLER (Skills, Principles, Behaviors, Corrections)
// -----------------------------------------------------------------------------
function executeMemoryAction(
  action: SemanticAction,
  targetId: string | undefined,
  options: Record<string, any>,
  rawArgs: string[],
  rootDir: string,
): boolean {
  const subType = (options.type || "").toLowerCase();

  switch (action) {
    case "add": {
      if (subType === "correction" || (options.topic && options.rule)) {
        processUserCorrection(options.topic, options.rule, rootDir);
        return true;
      }
      if (subType === "behavior" || options.behavior) {
        const title = options.title || options.behavior || targetId || "New Behavior";
        runBehaviorCommand(["add", title], rootDir);
        return true;
      }
      if (subType === "principle" || options.principle) {
        const title = options.title || options.principle || targetId || "New Principle";
        runPrincipleCommand(["add", title], rootDir);
        return true;
      }
      // Default: skill learning
      const goal = options.goal || options.title || targetId || "General Skill";
      runSkillCommand(["register", goal], rootDir);
      return true;
    }

    case "update": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: memory update <memoryId> [--content <Text>]`);
        return false;
      }
      if (subType === "principle") {
        runPrincipleCommand(["update", targetId, options.content || ""], rootDir);
        return true;
      }
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Memory updated: ${targetId}\x1b[0m`);
      return true;
    }

    case "enable": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: memory enable <memoryId>`);
        return false;
      }
      runBehaviorCommand(["enable", targetId], rootDir);
      return true;
    }

    case "disable": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: memory disable <memoryId>`);
        return false;
      }
      runBehaviorCommand(["disable", targetId], rootDir);
      return true;
    }

    case "remove": {
      if (!targetId) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: memory remove <memoryId>`);
        return false;
      }
      runForgetCommand([targetId], rootDir);
      return true;
    }

    case "list":
    default: {
      if (subType === "principle") {
        runPrincipleCommand(["list"], rootDir);
        return true;
      }
      if (subType === "behavior") {
        runBehaviorCommand(["list"], rootDir);
        return true;
      }
      runSkillCommand(["list"], rootDir);
      return true;
    }
  }
}

// -----------------------------------------------------------------------------
// 5. PREFERENCE ENTITY HANDLER (Mode, Key, LLM, Alias, Social)
// -----------------------------------------------------------------------------
function executePreferenceAction(
  action: SemanticAction,
  targetId: string | undefined,
  options: Record<string, any>,
  rawArgs: string[],
  rootDir: string,
): boolean {
  const paths = getProjectPaths(rootDir);
  const key = (options.key || targetId || "").toLowerCase();
  const value = options.value || options.target || options.name;

  switch (action) {
    case "add":
    case "update": {
      if (key === "mode") {
        runModeCommand([value || "promptMe"], rootDir);
        return true;
      }
      if (key === "role") {
        runRoleCommand([value || "Creator"], rootDir);
        return true;
      }
      if (key === "tier" || key === "tier_mode") {
        runTierCommand(["fallback", value || "free"], rootDir);
        return true;
      }
      if (key === "api_key" || key === "gemini_api_key" || key === "key") {
        saveApiKey(value || "", rootDir);
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Saved API key preference.\x1b[0m`);
        return true;
      }
      if (key === "alias") {
        const aliasName = options.name || targetId;
        const aliasTarget = options.target || options.value;
        if (!aliasName || !aliasTarget) {
          writeOutput(OutputChannelEnum.USER_REPLY, `Usage: preference add --key alias --name <short> --target <canonical>`);
          return false;
        }
        runAliasCommand(["add", aliasName, aliasTarget], rootDir);
        return true;
      }
      if (key === "social" || key === "socialmedia") {
        if (options.broadcast || options.message) {
          runSocialMediaCommand(["broadcast", "--message", options.broadcast || options.message], rootDir);
          return true;
        }
        const net = options.network || value;
        runSocialMediaCommand(["configure", net], rootDir);
        return true;
      }

      // Generic preference key-value store
      const state = loadState(paths.statePath);
      state.preferences = state.preferences || {};
      state.preferences[key] = { value, enabled: true, updatedAt: new Date().toISOString() };
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Preference saved: ${key} = ${value}\x1b[0m`);
      return true;
    }

    case "enable": {
      if (!key) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: preference enable --key <keyName>`);
        return false;
      }
      const state = loadState(paths.statePath);
      state.preferences = state.preferences || {};
      if (state.preferences[key]) {
        state.preferences[key].enabled = true;
        saveState(paths.statePath, state);
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Preference enabled: ${key}\x1b[0m`);
      }
      return true;
    }

    case "disable": {
      if (!key) {
        writeOutput(OutputChannelEnum.USER_REPLY, `Usage: preference disable --key <keyName>`);
        return false;
      }
      const state = loadState(paths.statePath);
      state.preferences = state.preferences || {};
      if (state.preferences[key]) {
        state.preferences[key].enabled = false;
        saveState(paths.statePath, state);
        writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[33m✔ Preference disabled: ${key}\x1b[0m`);
      }
      return true;
    }

    case "remove": {
      if (key === "alias") {
        const aliasName = options.name || targetId;
        runAliasCommand(["remove", aliasName], rootDir);
        return true;
      }
      const state = loadState(paths.statePath);
      state.preferences = state.preferences || {};
      delete state.preferences[key];
      saveState(paths.statePath, state);
      writeOutput(OutputChannelEnum.USER_REPLY, `\x1b[32m✔ Preference removed: ${key}\x1b[0m`);
      return true;
    }

    case "list":
    default: {
      const state = loadState(paths.statePath);
      writeOutput(OutputChannelEnum.USER_REPLY, `\n\x1b[36m=== INOU Active Preferences ===\x1b[0m`);
      writeOutput(OutputChannelEnum.USER_REPLY, `  • Operating Mode: ${state.operatingMode?.currentMode || "promptMe"}`);
      writeOutput(OutputChannelEnum.USER_REPLY, `  • Active Role: ${state.currentRole || "RegularUser"}`);
      writeOutput(OutputChannelEnum.USER_REPLY, `  • Active User: ${state.activeUser?.userName || "System"}`);
      writeOutput(OutputChannelEnum.USER_REPLY, `  • API Key: ${getStoredApiKey(rootDir) ? "Connected (****)" : "Not Set"}`);
      runAliasCommand(["list"], rootDir);
      return true;
    }
  }
}
