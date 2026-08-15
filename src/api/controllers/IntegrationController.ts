import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { IntegrationRepository } from "../../repositories/IntegrationRepository";
import { EventBus } from "../events/EventBus";

export class IntegrationController extends BaseController {
  private repo: IntegrationRepository;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.repo = new IntegrationRepository(rootDir);
  }

  public list(res: ServerResponse): void {
    const integrations = this.repo.findAll();
    this.sendSuccess(res, integrations);
  }

  public create(body: any, res: ServerResponse): void {
    if (!body || !body.name || !body.provider || !body.category) {
      this.sendError(res, 400, "Integration name, provider, and category are required.");
      return;
    }

    const id = body.id || `conn_${Date.now()}`;
    const entity = this.repo.save({
      id,
      name: body.name,
      provider: body.provider,
      category: body.category,
      authType: body.authType || "apiKey",
      endpoint: body.endpoint,
      status: "Connected",
      scope: body.scope || "global",
      scopeId: body.scopeId,
      vaultSecretKeyRef: body.vaultSecretKeyRef,
      rateLimitPerMinute: body.rateLimitPerMinute || 60,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    EventBus.getInstance().publish("integration.created", "preference", "add", entity);
    this.sendJson(res, 201, { success: true, data: entity });
  }
}
