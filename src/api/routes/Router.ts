import { IncomingMessage, ServerResponse } from "http";
import { parse as parseUrl } from "url";
import fs from "fs";
import path from "path";
import { CorsMiddleware } from "../middleware/CorsMiddleware";
import { ManipulationDefenseMiddleware } from "../middleware/ManipulationDefenseMiddleware";
import { SseStreamHandler } from "../events/SseStreamHandler";
import { HealthController } from "../controllers/HealthController";
import { ProjectController } from "../controllers/ProjectController";
import { WorkspaceController } from "../controllers/WorkspaceController";
import { TaskController } from "../controllers/TaskController";
import { PreferenceController } from "../controllers/PreferenceController";
import { IntegrationController } from "../controllers/IntegrationController";
import { SyncController } from "../controllers/SyncController";
import { CommandController } from "../controllers/CommandController";
import { calculateInuoVersion } from "../../cli/versionEngine";
import { getProjectPaths, loadState } from "../../cli/context";
import { getSessionStats } from "../../cli/usageEngine";
import {
  deleteLLMConfiguration,
  getLLMConfigurations,
  getLLMProviderSetup,
  saveLLMConfiguration,
} from "../../cli/llmCommand";
import { probeAndConfigureModels, maskApiKey } from "../../cli/setupCommand";
import { executeShellLine } from "../../cli/shell";
import { EventBus } from "../events/EventBus";
import { OutputChannelEnum } from "../../enums/OutputChannelEnum";
import { TOOL_PROMPT } from "../../cli/brand";

const MIME_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

export class Router {
  private healthCtrl: HealthController;
  private projectCtrl: ProjectController;
  private workspaceCtrl: WorkspaceController;
  private taskCtrl: TaskController;
  private prefCtrl: PreferenceController;
  private integrationCtrl: IntegrationController;
  private syncCtrl: SyncController;
  private commandCtrl: CommandController;
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.healthCtrl = new HealthController(rootDir);
    this.projectCtrl = new ProjectController(rootDir);
    this.workspaceCtrl = new WorkspaceController(rootDir);
    this.taskCtrl = new TaskController(rootDir);
    this.prefCtrl = new PreferenceController(rootDir);
    this.integrationCtrl = new IntegrationController(rootDir);
    this.syncCtrl = new SyncController(rootDir);
    this.commandCtrl = new CommandController(rootDir);
  }

  public async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    // 1. CORS Preflight & Headers
    if (CorsMiddleware.handle(req, res)) return;

    const parsed = parseUrl(req.url || "/", true);
    const pathname = parsed.pathname || "/";
    const method = (req.method || "GET").toUpperCase();

    // 2. SSE Streaming Stream Endpoint
    if (pathname === "/api/stream" || pathname === "/events") {
      SseStreamHandler.handle(req, res);
      return;
    }

    // 3. Static Web PWA Asset Serving
    if (method === "GET") {
      if (this.serveStatic(pathname, res)) return;
    }

    // 4. Buffer Request Body
    const bodyText = await this.readBody(req);

    // 5. Anti-Manipulation Circuit Breaker
    if (!ManipulationDefenseMiddleware.evaluate(bodyText, req, res)) return;

    let bodyJson: any = null;
    if (bodyText) {
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, error: "Malformed JSON payload." }),
        );
        return;
      }
    }

    // 6. REST Route Matrix

    // Health & Diagnostic Checks
    if (
      pathname === "/health" ||
      pathname === "/api/v1/health" ||
      pathname === "/api/v1/status"
    ) {
      this.healthCtrl.getStatus(res);
      return;
    }

    // Web UI System Status
    if (pathname === "/api/status" && method === "GET") {
      const inuoVer = calculateInuoVersion(this.rootDir);
      const paths = getProjectPaths(this.rootDir);
      const state = loadState(paths.statePath);
      const activeUserId = state.activeUser?.userId ?? "user_local";
      const userPref = (state.userPreferences ?? []).find(
        (p) => p.userId === activeUserId,
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          version: inuoVer.fullVersionString,
          lang: (state as any).preferences?.lang || "es",
          succinct: userPref?.interactionStyle === "succinct",
          debugLevel: (state as any).operatingMode?.debugLevel ?? 1,
          userStyle: userPref?.interactionStyle,
          aiUsage: (({ requestCount, totalTokens }) => ({
            requestCount,
            totalTokens,
          }))(getSessionStats()),
        }),
      );
      return;
    }

    // LLM Configuration Endpoints
    if (pathname === "/api/llm/configurations") {
      if (method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            configurations: getLLMConfigurations(this.rootDir),
          }),
        );
        return;
      }
      if (method === "POST") {
        try {
          const forbiddenField = Object.keys(bodyJson || {}).find((key) =>
            /api.?key|secret|token|password|credential/i.test(key),
          );
          if (forbiddenField) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: `Secret field "${forbiddenField}" is not accepted. Configure credentials in the provider environment.`,
              }),
            );
            return;
          }

          const configuration = saveLLMConfiguration(
            {
              configurationName: String(bodyJson.configurationName || ""),
              engineName: String(bodyJson.engineName || ""),
              model: String(bodyJson.model || ""),
              baseUrl: bodyJson.baseUrl ? String(bodyJson.baseUrl) : undefined,
              supportsPlanMode: bodyJson.supportsPlanMode === true,
              supportsExecuteMode: bodyJson.supportsExecuteMode === true,
            },
            this.rootDir,
          );
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "created", configuration }));
          return;
        } catch (error) {
          const message = (error as Error).message;
          res.writeHead(message.includes("already exists") ? 409 : 400, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ error: message }));
          return;
        }
      }
    }

    const llmDeleteMatch = pathname.match(
      /^\/api\/llm\/configurations\/([a-zA-Z0-9._-]+)$/,
    );
    if (llmDeleteMatch && method === "DELETE") {
      const configName = decodeURIComponent(llmDeleteMatch[1]);
      if (!deleteLLMConfiguration(configName, this.rootDir)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: `LLM configuration "${configName}" not found.`,
          }),
        );
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "removed", configurationName: configName }),
      );
      return;
    }

    // LLM Probe & Setup Endpoint
    if (pathname === "/api/setup/llm" && method === "POST") {
      try {
        const apiKey = bodyJson?.apiKey;
        if (!apiKey || typeof apiKey !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Missing or invalid 'apiKey' field in request body.",
            }),
          );
          return;
        }
        const result = await probeAndConfigureModels(apiKey, this.rootDir);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: result.success,
            workingFree: result.workingFree,
            workingPaid: result.workingPaid,
            maskedKey: maskApiKey(apiKey),
            message: result.message,
          }),
        );
        return;
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: err.message || "Failed to configure LLM setup.",
          }),
        );
        return;
      }
    }

    // Web UI / Shell Command Execution Endpoint
    if (pathname === "/api/command" && method === "POST") {
      try {
        const command = (bodyJson?.command || "").trim();
        if (command) {
          EventBus.getInstance().publish(
            "output.message",
            "preference",
            "update",
            {
              channel: OutputChannelEnum.USER_REPLY,
              content: `${TOOL_PROMPT} ${command}`,
              timestamp: new Date().toISOString(),
            },
          );

          const interactiveAdd = /^llm\s+add\s+([A-Za-z0-9._-]+)$/i.exec(
            command,
          );
          if (bodyJson.uiMode === true && interactiveAdd) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                status: "input_required",
                uiAction: {
                  type: "LLM_CONFIGURATION",
                  setup: getLLMProviderSetup(interactiveAdd[1]),
                },
              }),
            );
            return;
          }

          await executeShellLine(command, this.rootDir);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      } catch (err: any) {
        EventBus.getInstance().publish(
          "output.message",
          "preference",
          "update",
          {
            channel: OutputChannelEnum.DEBUG,
            content: `[Command Execution Error] ${err.message}`,
            timestamp: new Date().toISOString(),
          },
        );
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    // REST Semantic Command Execution
    if (pathname === "/api/v1/command" && method === "POST") {
      this.commandCtrl.execute(bodyJson, res);
      return;
    }

    // Projects
    if (pathname === "/api/v1/projects" || pathname === "/api/v1/project") {
      if (method === "GET") return this.projectCtrl.list(res);
      if (method === "POST") return this.projectCtrl.create(bodyJson, res);
    }
    const projectMatch = pathname.match(
      /^\/api\/v1\/projects?\/([a-zA-Z0-9_\-]+)$/,
    );
    if (projectMatch) {
      const id = projectMatch[1];
      if (method === "GET") return this.projectCtrl.getById(id, res);
      if (method === "PUT" || method === "POST")
        return this.projectCtrl.update(id, bodyJson, res);
      if (method === "DELETE") return this.projectCtrl.remove(id, res);
    }

    // Workspaces
    if (pathname === "/api/v1/workspaces" || pathname === "/api/v1/workspace") {
      if (method === "GET") return this.workspaceCtrl.list(res);
      if (method === "POST") return this.workspaceCtrl.create(bodyJson, res);
    }
    const wsMatch = pathname.match(
      /^\/api\/v1\/workspaces?\/([a-zA-Z0-9_\-]+)$/,
    );
    if (wsMatch && method === "DELETE") {
      return this.workspaceCtrl.remove(wsMatch[1], res);
    }

    // Tasks
    if (pathname === "/api/v1/tasks" || pathname === "/api/v1/task") {
      if (method === "GET") return this.taskCtrl.list(res);
      if (method === "POST") return this.taskCtrl.create(bodyJson, res);
    }
    const taskMatch = pathname.match(/^\/api\/v1\/tasks?\/([a-zA-Z0-9_\-]+)$/);
    if (taskMatch) {
      const id = taskMatch[1];
      if (method === "GET") return this.taskCtrl.getById(id, res);
      if (method === "PUT" || method === "POST")
        return this.taskCtrl.update(id, bodyJson, res);
      if (method === "DELETE") return this.taskCtrl.remove(id, res);
    }

    // Preferences
    if (
      pathname === "/api/v1/preferences" ||
      pathname === "/api/v1/preference"
    ) {
      if (method === "GET") return this.prefCtrl.list(res);
      if (method === "POST" || method === "PUT")
        return this.prefCtrl.set(bodyJson, res);
    }

    // Integrations
    if (
      pathname === "/api/v1/integrations" ||
      pathname === "/api/v1/integration"
    ) {
      if (method === "GET") return this.integrationCtrl.list(res);
      if (method === "POST") return this.integrationCtrl.create(bodyJson, res);
    }

    // Sync
    if (pathname === "/api/v1/sync") {
      if (method === "POST") return this.syncCtrl.triggerSync(bodyJson, res);
      if (method === "GET") return this.syncCtrl.getConfig(res);
    }
    if (pathname === "/api/v1/sync/config") {
      if (method === "GET") return this.syncCtrl.getConfig(res);
      if (method === "POST" || method === "PUT")
        return this.syncCtrl.updateConfig(bodyJson, res);
    }

    // 404 Fallback
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: `Route not found: ${method} ${pathname}`,
      }),
    );
  }

  private serveStatic(pathname: string, res: ServerResponse): boolean {
    const publicDir = path.join(this.rootDir, "public");
    let relativeFile =
      pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.join(publicDir, relativeFile);

    // Prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
      return false;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_MAP[ext] || "application/octet-stream";
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
      return true;
    }

    return false;
  }

  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        resolve(data);
      });
      req.on("error", () => {
        resolve("");
      });
    });
  }
}
