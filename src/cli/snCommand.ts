import { getProjectPaths, loadState, saveState } from "./context";
import { SocialNetworkConfiguration } from "../interfaces/SocialNetworkConfiguration";
import { SocialNetworkName } from "../types/SocialNetworkName";

const SUPPORTED_NETWORKS: SocialNetworkName[] = [
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
];

function normalizeName(value: string): string {
  return value.trim();
}

function normalizeNetwork(value: string): SocialNetworkName | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalized === "instagram") return "instagram";
  if (normalized === "tiktok" || normalized === "tt") return "tiktok";
  if (normalized === "facebook" || normalized === "meta") return "facebook";
  if (normalized === "linkedin") return "linkedin";
  return null;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["yes", "y", "true", "on", "1"].includes(value.toLowerCase());
}

function getFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function findByConfigurationName(
  items: SocialNetworkConfiguration[],
  configurationName: string,
): SocialNetworkConfiguration | undefined {
  const normalized = normalizeName(configurationName).toLowerCase();
  return items.find(
    (item) => item.configurationName.toLowerCase() === normalized,
  );
}

function printSupportedNetworks(): void {
  console.log(`Supported networks: ${SUPPORTED_NETWORKS.join(", ")}`);
}

export function getSocialNetworkConfigurations(
  rootDir: string = process.cwd(),
): SocialNetworkConfiguration[] {
  const paths = getProjectPaths(rootDir);
  return loadState(paths.statePath).socialNetworkConfigurations || [];
}

export function runSNCommand(
  args: string[],
  rootDir: string = process.cwd(),
): void {
  const subcommand = args[0]?.toLowerCase() || "list";
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.socialNetworkConfigurations)
    state.socialNetworkConfigurations = [];

  if (subcommand === "add") {
    const networkInput = args[1];
    const configurationNameInput = args[2];

    if (!networkInput || !configurationNameInput) {
      console.log(
        "Usage: sn add <network> <configurationName> [--account <handle>] [--enabled yes|no]",
      );
      printSupportedNetworks();
      return;
    }

    const network = normalizeNetwork(networkInput);
    if (!network) {
      console.log(`Unsupported network \"${networkInput}\".`);
      printSupportedNetworks();
      return;
    }

    const configurationName = normalizeName(configurationNameInput);
    if (
      state.socialNetworkConfigurations.some(
        (item) =>
          item.configurationName.toLowerCase() ===
          configurationName.toLowerCase(),
      )
    ) {
      console.log(`SN configuration \"${configurationName}\" already exists.`);
      return;
    }

    const now = new Date().toISOString();
    const accountHandle = getFlag(args, "--account");
    const isEnabled = parseBoolean(getFlag(args, "--enabled"), true);

    const configuration: SocialNetworkConfiguration = {
      id: `sn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      configurationName,
      network,
      accountHandle: accountHandle?.trim() || undefined,
      isEnabled,
      createdAt: now,
      updatedAt: now,
    };

    state.socialNetworkConfigurations.push(configuration);
    saveState(paths.statePath, state);
    console.log(
      `Saved SN configuration \"${configuration.configurationName}\" for ${configuration.network}.`,
    );
    return;
  }

  if (subcommand === "list") {
    const items = state.socialNetworkConfigurations;
    if (items.length === 0) {
      console.log(
        "No social network configurations saved. Use: sn add <network> <configurationName>",
      );
      printSupportedNetworks();
      return;
    }

    console.log("=== Social Network Configurations ===");
    for (const item of items) {
      const handle = item.accountHandle || "n/a";
      console.log(
        `${item.configurationName} | network=${item.network} | account=${handle} | enabled=${item.isEnabled ? "yes" : "no"}`,
      );
    }
    return;
  }

  if (subcommand === "remove") {
    const configurationName = args[1];
    if (!configurationName) {
      console.log("Usage: sn remove <configurationName>");
      return;
    }

    const index = state.socialNetworkConfigurations.findIndex(
      (item) =>
        item.configurationName.toLowerCase() ===
        configurationName.toLowerCase(),
    );

    if (index < 0) {
      console.log(`SN configuration \"${configurationName}\" not found.`);
      return;
    }

    state.socialNetworkConfigurations.splice(index, 1);
    saveState(paths.statePath, state);
    console.log(`Removed SN configuration \"${configurationName}\".`);
    return;
  }

  if (subcommand === "update") {
    const configurationName = args[1];
    if (!configurationName) {
      console.log(
        "Usage: sn update <configurationName> [--network <network>] [--account <handle>] [--enabled yes|no]",
      );
      return;
    }

    const current = findByConfigurationName(
      state.socialNetworkConfigurations,
      configurationName,
    );

    if (!current) {
      console.log(`SN configuration \"${configurationName}\" not found.`);
      return;
    }

    const networkInput = getFlag(args, "--network");
    if (networkInput) {
      const normalizedNetwork = normalizeNetwork(networkInput);
      if (!normalizedNetwork) {
        console.log(`Unsupported network \"${networkInput}\".`);
        printSupportedNetworks();
        return;
      }
      current.network = normalizedNetwork;
    }

    const accountHandle = getFlag(args, "--account");
    if (accountHandle !== undefined) {
      current.accountHandle = accountHandle.trim() || undefined;
    }

    if (args.includes("--enabled")) {
      current.isEnabled = parseBoolean(
        getFlag(args, "--enabled"),
        current.isEnabled,
      );
    }

    current.updatedAt = new Date().toISOString();
    saveState(paths.statePath, state);
    console.log(`Updated SN configuration \"${current.configurationName}\".`);
    return;
  }

  console.log(
    "Unknown sn command. Supported: sn add <network> <configurationName>, sn list, sn update <configurationName>, sn remove <configurationName>",
  );
  printSupportedNetworks();
}
