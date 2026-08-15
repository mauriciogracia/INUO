import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { TOOL_NAME } from "../cli/brand";

// args after the script name are forwarded to the child process (e.g. "web 3000")
const childArgs = process.argv.slice(2);

let appProcess: ChildProcess | null = null;
let isBuilding = false;

// compiled output lives in dist/scripts/ → root is 2 levels up
const rootDir = path.join(__dirname, "../..");
const srcDir = path.join(rootDir, "src");
const browserDir = path.join(rootDir, "browser");

function getSystemVersion(): string {
  try {
    const manifestPath = path.join(rootDir, "inuo-manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        SPEC_VERSION?: string;
      };
      if (manifest.SPEC_VERSION) return manifest.SPEC_VERSION;
    }
  } catch {
    /* fall through to default */
  }
  return "00.03.70";
}

function startApp(): void {
  if (appProcess) {
    try {
      appProcess.kill();
    } catch {
      /* already dead */
    }
  }
  const version = getSystemVersion();
  console.log(
    "\x1b[36m%s\x1b[0m",
    `\n⚡ [${TOOL_NAME} Live-Reload] Reloading latest ${TOOL_NAME} version (v${version})...\n`,
  );
  appProcess = spawn("node", ["./bin/inuo.js", ...childArgs], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function triggerRebuild(): void {
  if (isBuilding) return;
  isBuilding = true;

  const version = getSystemVersion();
  console.log(
    "\x1b[33m%s\x1b[0m",
    `\n🔄 [${TOOL_NAME} Dev Server] Source change detected! Recompiling & reloading ${TOOL_NAME} (v${version})...`,
  );
  const build = spawn("tsc", [], {
    cwd: rootDir,
    stdio: "ignore",
    shell: true,
  });

  build.on("close", (code: number | null) => {
    if (code !== 0) {
      isBuilding = false;
      console.log(
        "\x1b[31m%s\x1b[0m",
        `\u274c [${TOOL_NAME} Dev Server] TypeScript Compilation Error! Fix error to trigger auto-reload...`,
      );
      return;
    }
    // Also rebuild browser assets after the main build succeeds
    const browserBuild = spawn("tsc", ["--project", "tsconfig.browser.json"], {
      cwd: rootDir,
      stdio: "ignore",
      shell: true,
    });
    browserBuild.on("close", () => {
      isBuilding = false;
      startApp();
    });
  });
}

function watchDirectory(dir: string): void {
  try {
    fs.watch(
      dir,
      { recursive: true },
      (_event: string, filename: string | null) => {
        if (
          filename &&
          (filename.endsWith(".ts") || filename.endsWith(".json"))
        ) {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(triggerRebuild, 150);
        }
      },
    );
  } catch (err: unknown) {
    console.log(`[Watch Error] ${(err as Error).message}`);
  }
}

const currentVersion = getSystemVersion();
console.log(
  "\x1b[32m%s\x1b[0m",
  `🚀 [${TOOL_NAME} Dev Server] Live-Reload Active for v${currentVersion} (watching src/**/*.ts)...`,
);
console.log(
  "\x1b[90m%s\x1b[0m",
  `Any code change will automatically recompile and reload the latest ${TOOL_NAME} version.\n`,
);

const initialBuild = spawn("tsc", [], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});
initialBuild.on("close", (code: number | null) => {
  if (code === 0) {
    startApp();
    watchDirectory(srcDir);
    watchDirectory(browserDir);
  }
});
