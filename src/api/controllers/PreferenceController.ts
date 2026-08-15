import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { PreferenceRepository } from "../../repositories/PreferenceRepository";
import { EventBus } from "../events/EventBus";

export class PreferenceController extends BaseController {
  private repo: PreferenceRepository;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.repo = new PreferenceRepository(rootDir);
  }

  public list(res: ServerResponse): void {
    const prefs = this.repo.findAll();
    this.sendSuccess(res, prefs);
  }

  public set(body: any, res: ServerResponse): void {
    if (!body || !body.key || body.value === undefined) {
      this.sendError(res, 400, "Preference key and value are required.");
      return;
    }

    const entity = this.repo.save({
      key: body.key,
      value: body.value,
      scope: body.scope || "global",
      scopeId: body.scopeId,
      enabled: body.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("preference.updated", "preference", "update", entity);
    this.sendSuccess(res, entity, "Preference saved successfully.");
  }
}
