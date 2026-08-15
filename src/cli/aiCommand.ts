import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";
import {
  getSummary,
  formatUsageDisplay,
  resetUsage,
  queryProviderCapacity,
} from "./usageEngine";

export async function runAiCommand(
  args: string[],
  rootDir: string = process.cwd(),
): Promise<void> {
  const sub = args[0]?.toLowerCase();

  if (sub === "usage") {
    if (args[1] === "--reset") {
      resetUsage(rootDir);
      writeOutput(OutputChannelEnum.USER_REPLY, "✔ AI usage log cleared.");
      return;
    }
    const [summary, capacity] = await Promise.all([
      Promise.resolve(getSummary(rootDir)),
      queryProviderCapacity(rootDir),
    ]);
    writeOutput(
      OutputChannelEnum.USER_REPLY,
      formatUsageDisplay(summary, capacity),
    );
    return;
  }

  writeOutput(OutputChannelEnum.USER_REPLY, "Usage: ai usage [--reset]");
}
