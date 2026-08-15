import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { executeAutonomousSync, getAutoSyncConfig, setAutoSyncConfig } from "../../cli/syncEngine";
import { EventBus } from "../events/EventBus";

export class SyncController extends BaseController {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.rootDir = rootDir;
  }

  public triggerSync(body: any, res: ServerResponse): void {
    const channel = body?.channel || "google-drive";
    const entities = body?.entities || ["project", "workspace", "task", "memory", "preference"];
    const projectId = body?.projectId;
    const workflowId = body?.workflowId;
    const isLightweight = body?.isLightweight === true;

    executeAutonomousSync(channel, entities, projectId, workflowId, isLightweight, this.rootDir);

    EventBus.getInstance().publish("sync.reconciled", "preference", "update", {
      channel,
      entities,
      syncedAt: new Date().toISOString(),
    });

    this.sendSuccess(res, {
      channel,
      entities,
      status: "Synced",
      timestamp: new Date().toISOString(),
    }, "Autonomous synchronization completed successfully.");
  }

  public getConfig(res: ServerResponse): void {
    const config = getAutoSyncConfig(this.rootDir);
    this.sendSuccess(res, config);
  }

  public updateConfig(body: any, res: ServerResponse): void {
    if (body?.intervalMinutes === undefined) {
      this.sendError(res, 400, "intervalMinutes is required.");
      return;
    }

    setAutoSyncConfig(body.intervalMinutes, body.promptEnabled !== false, this.rootDir);
    this.sendSuccess(res, getAutoSyncConfig(this.rootDir), "Auto-sync settings updated.");
  }
}
