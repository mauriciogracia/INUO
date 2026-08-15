import { getProjectPaths, loadState, saveState } from "./context";
import { CommandAlias } from "../interfaces/CommandAlias";

export const BUILTIN_ALIASES: Record<string, string> = {
  sn: "socialmedia",
};

export function getRegisteredAliases(
  rootDir: string = process.cwd(),
): Record<string, string> {
  const aliases: Record<string, string> = { ...BUILTIN_ALIASES };
  try {
    const paths = getProjectPaths(rootDir);
    const state = loadState(paths.statePath);
    if (Array.isArray(state.aliases)) {
      for (const item of state.aliases) {
        if (item.aliasName && item.targetCommand) {
          aliases[item.aliasName.toLowerCase()] = item.targetCommand;
        }
      }
    }
  } catch {
    // Ignore errors and return built-in defaults
  }
  return aliases;
}

export function resolveAlias(
  line: string,
  rootDir: string = process.cwd(),
): string {
  const trimmed = line.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split(/\s+/);
  const firstToken = parts[0].toLowerCase();
  const aliases = getRegisteredAliases(rootDir);

  if (aliases[firstToken]) {
    const target = aliases[firstToken];
    const rest = parts.slice(1).join(" ");
    return rest ? `${target} ${rest}` : target;
  }

  return trimmed;
}

export function runAliasCommand(
  args: string[],
  rootDir: string = process.cwd(),
): void {
  const subcommand = args[0]?.toLowerCase() || "list";
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.aliases) state.aliases = [];

  if (subcommand === "add" || subcommand === "set") {
    const aliasName = args[1]?.trim().toLowerCase();
    const targetCommand = args.slice(2).join(" ").trim();

    if (!aliasName || !targetCommand) {
      console.log("Usage: alias add <aliasName> <targetCommand...>");
      return;
    }

    if (aliasName === targetCommand.toLowerCase()) {
      console.log(`Cannot alias "${aliasName}" to itself.`);
      return;
    }

    const existingIndex = state.aliases.findIndex(
      (a) => a.aliasName.toLowerCase() === aliasName,
    );

    const now = new Date().toISOString();
    const newAlias: CommandAlias = {
      aliasName,
      targetCommand,
      createdAt:
        existingIndex >= 0
          ? state.aliases[existingIndex].createdAt
          : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      state.aliases[existingIndex] = newAlias;
      console.log(`Updated alias "${aliasName}" -> "${targetCommand}".`);
    } else {
      state.aliases.push(newAlias);
      console.log(`Created alias "${aliasName}" -> "${targetCommand}".`);
    }

    saveState(paths.statePath, state);
    return;
  }

  if (subcommand === "remove" || subcommand === "rm" || subcommand === "delete") {
    const aliasName = args[1]?.trim().toLowerCase();
    if (!aliasName) {
      console.log("Usage: alias remove <aliasName>");
      return;
    }

    const initialLength = state.aliases.length;
    state.aliases = state.aliases.filter(
      (a) => a.aliasName.toLowerCase() !== aliasName,
    );

    if (state.aliases.length === initialLength) {
      if (BUILTIN_ALIASES[aliasName]) {
        console.log(
          `Cannot remove built-in default alias "${aliasName}". You can override it with "alias add ${aliasName} <target>".`,
        );
      } else {
        console.log(`Alias "${aliasName}" not found.`);
      }
      return;
    }

    saveState(paths.statePath, state);
    console.log(`Removed alias "${aliasName}".`);
    return;
  }

  // Default: list aliases
  const customMap = new Map(
    state.aliases.map((a) => [a.aliasName.toLowerCase(), a.targetCommand]),
  );

  console.log("--- Registered Command Aliases ---");

  // Print built-ins
  for (const [key, val] of Object.entries(BUILTIN_ALIASES)) {
    const override = customMap.get(key);
    if (override) {
      console.log(`  ${key} -> ${override} [custom override]`);
    } else {
      console.log(`  ${key} -> ${val} [built-in]`);
    }
  }

  // Print custom additions
  for (const item of state.aliases) {
    if (!BUILTIN_ALIASES[item.aliasName.toLowerCase()]) {
      console.log(`  ${item.aliasName} -> ${item.targetCommand} [custom]`);
    }
  }
}
