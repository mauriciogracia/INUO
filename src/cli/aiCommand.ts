import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";
import {
  queryProviderCapacity,
  getSessionStats,
  resetSessionStats,
  formatUsageDisplay,
} from "./usageEngine";
import { loadEnvironment } from "./environment";

export async function runAiCommand(
  args: string[],
  rootDir: string = process.cwd(),
): Promise<void> {
  const sub = args[0]?.toLowerCase();

  if (sub === "usage") {
    if (args[1] === "--reset") {
      resetSessionStats();
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        "✔ Session usage counters reset.",
      );
      return;
    }
    const env = loadEnvironment(rootDir);
    const [capacity, session] = await Promise.all([
      queryProviderCapacity(rootDir),
      Promise.resolve(getSessionStats()),
    ]);
    writeOutput(
      OutputChannelEnum.USER_REPLY,
      formatUsageDisplay(capacity, session, env.tokenBudgetMonthly),
    );
    return;
  }

  writeOutput(OutputChannelEnum.USER_REPLY, "Usage: ai usage [--reset]");
}
