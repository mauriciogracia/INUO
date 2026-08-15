import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { ProjectRepository } from "../../repositories/ProjectRepository";
import { EventBus } from "../events/EventBus";

export class ProjectController extends BaseController {
  private repo: ProjectRepository;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.repo = new ProjectRepository(rootDir);
  }

  public list(res: ServerResponse): void {
    const projects = this.repo.findAll();
    this.sendSuccess(res, projects);
  }

  public getById(id: string, res: ServerResponse): void {
    const project = this.repo.findById(id);
    if (!project) {
      this.sendError(res, 404, `Project with ID '${id}' not found.`);
      return;
    }
    this.sendSuccess(res, project);
  }

  public create(body: any, res: ServerResponse): void {
    if (!body || !body.name) {
      this.sendError(res, 400, "Project name is required.");
      return;
    }

    const id = body.id || `proj_${Date.now()}`;
    const entity = this.repo.save({
      id,
      name: body.name,
      jurisdiction: body.jurisdiction || "GLOBAL",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("project.created", "project", "add", entity);
    this.sendJson(res, 201, { success: true, data: entity });
  }

  public update(id: string, body: any, res: ServerResponse): void {
    const existing = this.repo.findById(id);
    if (!existing) {
      this.sendError(res, 404, `Project with ID '${id}' not found.`);
      return;
    }

    const updated = this.repo.save({
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("project.updated", "project", "update", updated);
    this.sendSuccess(res, updated, "Project updated successfully.");
  }

  public remove(id: string, res: ServerResponse): void {
    const success = this.repo.delete(id);
    if (!success) {
      this.sendError(res, 404, `Project with ID '${id}' could not be deleted.`);
      return;
    }

    EventBus.getInstance().publish("project.removed", "project", "remove", { id });
    this.sendSuccess(res, { id }, "Project deleted successfully.");
  }
}
