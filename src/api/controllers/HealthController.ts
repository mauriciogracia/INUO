import { ServerResponse } from "http";
import { BaseController } from "./BaseController";
import { getProjectPaths, loadManifest } from "../../cli/context";
import { getSqliteDatabaseStats } from "../../cli/sqliteStorageEngine";

export class HealthController extends BaseController {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    super();
    this.rootDir = rootDir;
  }

  public getStatus(res: ServerResponse): void {
    const paths = getProjectPaths(this.rootDir);
    const manifest = loadManifest(paths.manifestPath);
    const dbStats = getSqliteDatabaseStats(this.rootDir);

    this.sendSuccess(res, {
      status: "Healthy",
      version: manifest?.SPEC_VERSION || "00.03.72",
      uptimeSeconds: process.uptime(),
      storage: dbStats,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  }
}
