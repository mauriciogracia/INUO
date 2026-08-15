import { ServerResponse, IncomingMessage } from "http";

export class CorsMiddleware {
  public static handle(req: IncomingMessage, res: ServerResponse): boolean {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Last-Event-ID");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return true; // Request handled
    }

    return false;
  }
}
