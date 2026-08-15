import { IncomingMessage, ServerResponse } from "http";
import { parse as parseUrl } from "url";
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

export class Router {
  private healthCtrl: HealthController;
  private projectCtrl: ProjectController;
  private workspaceCtrl: WorkspaceController;
  private taskCtrl: TaskController;
  private prefCtrl: PreferenceController;
  private integrationCtrl: IntegrationController;
  private syncCtrl: SyncController;
  private commandCtrl: CommandController;

  constructor(rootDir: string = process.cwd()) {
    this.healthCtrl = new HealthController(rootDir);
    this.projectCtrl = new ProjectController(rootDir);
    this.workspaceCtrl = new WorkspaceController(rootDir);
    this.taskCtrl = new TaskController(rootDir);
    this.prefCtrl = new PreferenceController(rootDir);
    this.integrationCtrl = new IntegrationController(rootDir);
    this.syncCtrl = new SyncController(rootDir);
    this.commandCtrl = new CommandController(rootDir);
  }

  public async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
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

    // 3. Buffer Request Body
    const bodyText = await this.readBody(req);

    // 4. Anti-Manipulation Circuit Breaker
    if (!ManipulationDefenseMiddleware.evaluate(bodyText, req, res)) return;

    let bodyJson: any = null;
    if (bodyText) {
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Malformed JSON payload." }));
        return;
      }
    }

    // 5. REST Route Matrix
    // Health Check
    if (pathname === "/health" || pathname === "/api/v1/health" || pathname === "/api/v1/status") {
      this.healthCtrl.getStatus(res);
      return;
    }

    // Command Execution
    if (pathname === "/api/v1/command" && method === "POST") {
      this.commandCtrl.execute(bodyJson, res);
      return;
    }

    // Projects
    if (pathname === "/api/v1/projects" || pathname === "/api/v1/project") {
      if (method === "GET") return this.projectCtrl.list(res);
      if (method === "POST") return this.projectCtrl.create(bodyJson, res);
    }
    const projectMatch = pathname.match(/^\/api\/v1\/projects?\/([a-zA-Z0-9_\-]+)$/);
    if (projectMatch) {
      const id = projectMatch[1];
      if (method === "GET") return this.projectCtrl.getById(id, res);
      if (method === "PUT" || method === "POST") return this.projectCtrl.update(id, bodyJson, res);
      if (method === "DELETE") return this.projectCtrl.remove(id, res);
    }

    // Workspaces
    if (pathname === "/api/v1/workspaces" || pathname === "/api/v1/workspace") {
      if (method === "GET") return this.workspaceCtrl.list(res);
      if (method === "POST") return this.workspaceCtrl.create(bodyJson, res);
    }
    const wsMatch = pathname.match(/^\/api\/v1\/workspaces?\/([a-zA-Z0-9_\-]+)$/);
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
      if (method === "PUT" || method === "POST") return this.taskCtrl.update(id, bodyJson, res);
      if (method === "DELETE") return this.taskCtrl.remove(id, res);
    }

    // Preferences
    if (pathname === "/api/v1/preferences" || pathname === "/api/v1/preference") {
      if (method === "GET") return this.prefCtrl.list(res);
      if (method === "POST" || method === "PUT") return this.prefCtrl.set(bodyJson, res);
    }

    // Integrations
    if (pathname === "/api/v1/integrations" || pathname === "/api/v1/integration") {
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
      if (method === "POST" || method === "PUT") return this.syncCtrl.updateConfig(bodyJson, res);
    }

    // 404 Fallback
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: `Route not found: ${method} ${pathname}` }));
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
