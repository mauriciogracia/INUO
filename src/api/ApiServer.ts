import http, { Server } from "http";
import { Router } from "./routes/Router";
import { EventBus } from "./events/EventBus";

export class ApiServer {
  private server: Server | null = null;
  private router: Router;
  private port: number;
  private host: string;
  private rootDir: string;

  constructor(port: number = 8765, host: string = "127.0.0.1", rootDir: string = process.cwd()) {
    this.port = port;
    this.host = host;
    this.rootDir = rootDir;
    this.router = new Router(rootDir);
  }

  public start(): Promise<{ port: number; host: string; url: string }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.router.handleRequest(req, res);
      });

      this.server.on("error", (err) => {
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host}:${this.port}`;
        EventBus.getInstance().publish("system.started", "preference", "update", {
          service: "INUO API Gateway",
          url,
          port: this.port,
          host: this.host,
        });
        resolve({ port: this.port, host: this.host, url });
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
