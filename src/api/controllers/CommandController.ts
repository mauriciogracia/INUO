import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { executeSemanticCommand } from "../../cli/semanticDispatcher";

export class CommandController extends BaseController {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.rootDir = rootDir;
  }

  public execute(body: any, res: ServerResponse): void {
    if (!body || !body.command) {
      this.sendError(res, 400, "Missing 'command' in request body.");
      return;
    }

    try {
      const result = executeSemanticCommand(body.command, this.rootDir);
      this.sendSuccess(res, result, "Command executed successfully.");
    } catch (err: any) {
      this.sendError(res, 500, "Failed to execute semantic command.", err?.message);
    }
  }
}
