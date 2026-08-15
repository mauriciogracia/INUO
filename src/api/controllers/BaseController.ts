import { ServerResponse } from "http";

export abstract class BaseController {
  protected sendJson(res: ServerResponse, statusCode: number, data: any): void {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  protected sendError(res: ServerResponse, statusCode: number, message: string, details?: any): void {
    this.sendJson(res, statusCode, {
      success: false,
      error: message,
      details,
    });
  }

  protected sendSuccess(res: ServerResponse, data: any, message?: string): void {
    this.sendJson(res, 200, {
      success: true,
      message,
      data,
    });
  }
}
