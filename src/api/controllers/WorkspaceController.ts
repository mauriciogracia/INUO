import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { WorkspaceRepository } from "../../repositories/WorkspaceRepository";
import { EventBus } from "../events/EventBus";

export class WorkspaceController extends BaseController {
  private repo: WorkspaceRepository;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.repo = new WorkspaceRepository(rootDir);
  }

  public list(res: ServerResponse): void {
    const workspaces = this.repo.findAll();
    this.sendSuccess(res, workspaces);
  }

  public create(body: any, res: ServerResponse): void {
    if (!body || !body.name || !body.path) {
      this.sendError(res, 400, "Workspace name and path are required.");
      return;
    }

    const id = body.id || `ws_${Date.now()}`;
    const entity = this.repo.save({
      id,
      name: body.name,
      path: body.path,
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("workspace.created", "workspace", "add", entity);
    this.sendJson(res, 201, { success: true, data: entity });
  }

  public remove(id: string, res: ServerResponse): void {
    const success = this.repo.delete(id);
    if (!success) {
      this.sendError(res, 404, `Workspace with ID '${id}' could not be deleted.`);
      return;
    }

    EventBus.getInstance().publish("workspace.removed", "workspace", "remove", { id });
    this.sendSuccess(res, { id }, "Workspace removed successfully.");
  }
}
