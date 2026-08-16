#!/usr/bin/env node

/**
 * scripts/wait-for-docker.js
 *
 * Polls the Docker daemon until it responds or the timeout is reached.
 * Exit 0 = Docker is ready. Exit 1 = timed out.
 *
 * Usage:
 *   node scripts/wait-for-docker.js [maxAttempts] [intervalMs]
 *   node scripts/wait-for-docker.js 30 3000
 */

const { execSync } = require("child_process");

const maxAttempts = parseInt(process.argv[2] || "30", 10);
const intervalMs  = parseInt(process.argv[3] || "3000", 10);

function log(msg, color = "\x1b[36m") {
  process.stdout.write(`${color}${msg}\x1b[0m\n`);
}

function isDockerReady() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function wait() {
  log(`Waiting for Docker daemon (max ${maxAttempts} attempts, ${intervalMs}ms interval)...`);

  for (let i = 1; i <= maxAttempts; i++) {
    if (isDockerReady()) {
      log(`\nDocker daemon is ready (attempt ${i}/${maxAttempts}).`, "\x1b[32m");
      process.exit(0);
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  log(`\nDocker daemon did not become ready after ${maxAttempts * intervalMs / 1000}s.`, "\x1b[31m");
  process.exit(1);
}

wait();
