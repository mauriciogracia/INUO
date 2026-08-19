import { OutputChannelEnum } from '../enums/OutputChannelEnum';
import { LogLevelEnum } from '../enums/LogLevelEnum';

export interface OutputMessage {
  channel: OutputChannelEnum;
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

type OutputListener = (channel: OutputChannelEnum, content: string) => void;
let activeOutputListener: OutputListener | null = null;

export function setOutputListener(listener: OutputListener | null): void {
  activeOutputListener = listener;
}

/**
 * Routes output messages to the correct stream or active TUI listener:
 * - USER_REPLY -> process.stdout (Descriptor 1)
 * - THINKING   -> process.stderr (Descriptor 2) with thinking formatting
 * - DEBUG      -> process.stderr (Descriptor 2) with debug formatting
 */
export function writeOutput(
  channel: OutputChannelEnum,
  content: string,
  debugLevel: number = LogLevelEnum.INFO
): void {
  if (!content) return;

  if (activeOutputListener) {
    try {
      activeOutputListener(channel, content);
    } catch (err) {
      // Guard: listener failure must never crash the caller — fall back to stderr
      process.stderr.write(
        `\x1b[31m[outputRouter] Listener error on channel ${channel}: ${err}\x1b[0m\n`
      );
    }
    return;
  }

  switch (channel) {
    case OutputChannelEnum.USER_REPLY:
      process.stdout.write(`${content}\n`);
      break;

    case OutputChannelEnum.THINKING:
      if (debugLevel >= LogLevelEnum.INFO) {
        process.stderr.write(`\x1b[35m🧠 [Thinking Details]:\x1b[0m ${content}\n`);
      }
      break;

    case OutputChannelEnum.DEBUG:
      if (debugLevel >= LogLevelEnum.DEBUG) {
        process.stderr.write(`\x1b[90m⚙ [Debug Details]:\x1b[0m ${content}\n`);
      }
      break;
  }
}
