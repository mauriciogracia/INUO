import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { TaskRepository } from "../../repositories/TaskRepository";
import { EventBus } from "../events/EventBus";

export class TaskController extends BaseController {
  private repo: TaskRepository;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.repo = new TaskRepository(rootDir);
  }

  public list(res: ServerResponse): void {
    const tasks = this.repo.findAll();
    this.sendSuccess(res, tasks);
  }

  public getById(id: string, res: ServerResponse): void {
    const task = this.repo.findById(id);
    if (!task) {
      this.sendError(res, 404, `Task with ID '${id}' not found.`);
      return;
    }
    this.sendSuccess(res, task);
  }

  public create(body: any, res: ServerResponse): void {
    if (!body || !body.title) {
      this.sendError(res, 400, "Task title is required.");
      return;
    }

    const id = body.id || `task_${Date.now()}`;
    const entity = this.repo.save({
      id,
      title: body.title,
      projectId: body.projectId,
      workflowId: body.workflowId,
      parentTaskId: body.parentTaskId,
      verb: body.verb || "Request",
      object: body.object || body.title,
      role: body.role,
      status: body.status || "Open",
      details: body.details,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("task.created", "task", "add", entity);
    this.sendJson(res, 201, { success: true, data: entity });
  }

  public update(id: string, body: any, res: ServerResponse): void {
    const existing = this.repo.findById(id);
    if (!existing) {
      this.sendError(res, 404, `Task with ID '${id}' not found.`);
      return;
    }

    const updated = this.repo.save({
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("task.updated", "task", "update", updated);
    this.sendSuccess(res, updated, "Task updated successfully.");
  }

  public remove(id: string, res: ServerResponse): void {
    const success = this.repo.delete(id);
    if (!success) {
      this.sendError(res, 404, `Task with ID '${id}' could not be deleted.`);
      return;
    }

    EventBus.getInstance().publish("task.removed", "task", "remove", { id });
    this.sendSuccess(res, { id }, "Task deleted successfully.");
  }
}
