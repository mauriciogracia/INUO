import readline from "readline";
import { setOutputListener } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";
import { getProjectPaths, loadState } from "./context";
import { getI18n } from "../i18n";
import { LLMConfigurationPrompter } from "../interfaces/LLMConfigurationPrompter";
import { completer } from "./autocomplete";

export interface TUIRenderContext {
  version: string;
  rootDir: string;
  onCommand: (
    command: string,
    prompter?: LLMConfigurationPrompter,
  ) => Promise<void>;
}

export class INUOTerminalUI {
  private version: string;
  private rootDir: string;
  private onCommand: (
    command: string,
    prompter?: LLMConfigurationPrompter,
  ) => Promise<void>;
  private logBuffer: string[] = [];
  private rl: readline.Interface | null = null;
  private isActive: boolean = false;

  constructor(ctx: TUIRenderContext) {
    this.version = ctx.version;
    this.rootDir = ctx.rootDir;
    this.onCommand = ctx.onCommand;
  }

  public start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Enable TUI Listener in outputRouter
    setOutputListener((channel: OutputChannelEnum, content: string) => {
      this.addLog(channel, content);
    });

    // Handle terminal resize
    process.stdout.on("resize", () => {
      this.renderScreen();
    });

    // Clear screen
    process.stdout.write("\x1b[2J\x1b[3J\x1b[H");

    // Render static frame
    this.renderFrame();

    // Create Readline attached to TUI
    this.setupReadline();
  }

  private addLog(channel: OutputChannelEnum, content: string): void {
    const formattedLines = content.split("\n");
    for (const line of formattedLines) {
      if (!line) continue;
      switch (channel) {
        case OutputChannelEnum.THINKING:
          this.logBuffer.push(`\x1b[35m🧠 [Thinking]:\x1b[0m ${line}`);
          break;
        case OutputChannelEnum.DEBUG:
          this.logBuffer.push(`\x1b[90m⚙ [Debug]:\x1b[0m ${line}`);
          break;
        default:
          this.logBuffer.push(line);
          break;
      }
    }

    if (this.logBuffer.length > 500) {
      this.logBuffer = this.logBuffer.slice(this.logBuffer.length - 500);
    }

    this.renderLogsSafely();
  }

  private setupReadline(): void {
    if (this.rl) {
      this.rl.close();
    }

    const rows = process.stdout.rows || 24;
    const promptRow = rows - 1;

    // Move cursor to bottom prompt row
    process.stdout.write(`\x1b[${promptRow};1H\x1b[2K`);

    const promptStr = `\x1b[32minuo (v${this.version})\x1b[0m > `;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: promptStr,
      completer,
    });

    this.rl.prompt();

    this.rl.on("line", async (line: string) => {
      const input = line.trim();
      if (input) {
        this.addLog(
          OutputChannelEnum.USER_REPLY,
          `\x1b[32minuo (v${this.version})\x1b[0m > ${input}`,
        );
        const prompter: LLMConfigurationPrompter = {
          ask: (question, defaultValue) =>
            new Promise((resolve) => {
              const suffix = defaultValue ? ` [${defaultValue}]` : "";
              this.rl?.question(`${question}${suffix}: `, (answer) => {
                resolve(answer.trim() || defaultValue || "");
              });
            }),
        };
        await this.onCommand(input, prompter);
      }

      // Re-position cursor to prompt row after command
      const updatedRows = process.stdout.rows || 24;
      process.stdout.write(`\x1b[${updatedRows - 1};1H\x1b[2K`);
      if (this.rl) {
        this.rl.prompt();
      }
    });

    // Handle CONTROL+C (SIGINT) to cancel active prompt line
    this.rl.on("SIGINT", () => {
      const activeLine = this.rl ? (this.rl as any).line || "" : "";
      if (activeLine.trim().length > 0) {
        this.addLog(
          OutputChannelEnum.USER_REPLY,
          `\x1b[33m^C [Prompt Cancelled]\x1b[0m`,
        );
        if (this.rl) {
          (this.rl as any).line = "";
          (this.rl as any).cursor = 0;
          const updatedRows = process.stdout.rows || 24;
          process.stdout.write(`\x1b[${updatedRows - 1};1H\x1b[2K`);
          this.rl.prompt();
        }
      } else {
        const paths = getProjectPaths(this.rootDir);
        const state = loadState(paths.statePath);
        const lang = (state as any).preferences?.lang || "es";
        const dict = getI18n(lang);
        console.log(`\n\x1b[33m${dict.farewell}\x1b[0m\n`);
        process.exit(0);
      }
    });
  }

  private renderFrame(): void {
    const rows = process.stdout.rows || 24;
    const cols = process.stdout.columns || 80;

    const paths = getProjectPaths(this.rootDir);
    const state = loadState(paths.statePath);
    const lang = (state as any).preferences?.lang || "en";
    const dict = getI18n(lang);
    const debugLvl = (state as any).operatingMode?.debugLevel ?? 1;
    const userStyle =
      (state.userPreferences ?? []).find(
        (p) => p.userId === (state.activeUser?.userId ?? "user_local"),
      )?.interactionStyle ?? "canonical";

    // 1. Draw Top Header Status Bar (Rows 1..3)
    let header = `\x1b[1;1H\x1b[2K\x1b[44m\x1b[37m\x1b[1m === ${dict.shellBanner.title} (v${this.version}) === \x1b[0m\n`;
    header += `\x1b[2;1H\x1b[2K\x1b[33m[Lang: ${lang.toUpperCase()}]\x1b[0m | \x1b[32m[Style: ${userStyle}]\x1b[0m | \x1b[35m[Debug: ${debugLvl}]\x1b[0m\n`;
    header += `\x1b[3;1H\x1b[2K\x1b[90m${"─".repeat(cols)}\x1b[0m`;
    process.stdout.write(header);

    // 2. Draw Bottom Separator (Row rows-2)
    const sepRow = rows - 2;
    process.stdout.write(
      `\x1b[${sepRow};1H\x1b[2K\x1b[90m${"─".repeat(cols)}\x1b[0m`,
    );
  }

  private renderLogsSafely(): void {
    const rows = process.stdout.rows || 24;
    const logViewportHeight = Math.max(3, rows - 6);
    const logStartRow = 4;

    const visibleLogs = this.logBuffer.slice(-logViewportHeight);

    // Save active cursor position (where user is typing)
    process.stdout.write("\x1b[s");

    for (let i = 0; i < logViewportHeight; i++) {
      const targetRow = logStartRow + i;
      const logLine = visibleLogs[i] || "";
      process.stdout.write(`\x1b[${targetRow};1H\x1b[2K${logLine}`);
    }

    // Restore cursor position back to active readline prompt
    process.stdout.write("\x1b[u");
  }

  private renderScreen(): void {
    process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
    this.renderFrame();
    this.renderLogsSafely();
  }
}
