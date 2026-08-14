import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { executeShellLine } from './shell';
import { setOutputListener } from './outputRouter';
import { OutputChannelEnum } from '../enums/OutputChannelEnum';
import { calculateInuoVersion } from './versionEngine';
import { getProjectPaths, loadState } from './context';
import { OperatingModeConfig } from '../interfaces/OperatingModeConfig';

export interface WebServerOptions {
  port?: number;
  rootDir?: string;
}

export function startWebServer(options: WebServerOptions = {}): http.Server {
  const port = options.port || 3000;
  const rootDir = options.rootDir || process.cwd();
  const sseClients: Response[] = [];

  const app = express();
  app.use(express.json());

  // CORS middleware
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Register Output Router Listener to stream logs to SSE web clients
  setOutputListener((channel: OutputChannelEnum, content: string) => {
    const payload = JSON.stringify({
      channel,
      content,
      timestamp: new Date().toISOString(),
    });

    for (let i = sseClients.length - 1; i >= 0; i--) {
      try {
        sseClients[i].write(`data: ${payload}\n\n`);
      } catch {
        sseClients.splice(i, 1);
      }
    }
  });

  // Serve static files from /public
  const publicDir = path.join(rootDir, 'public');
  app.use(express.static(publicDir));

  // SSE Stream Endpoint
  app.get('/api/stream', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    sseClients.push(res);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // System Status API Endpoint
  app.get('/api/status', (req: Request, res: Response) => {
    const inuoVer = calculateInuoVersion(rootDir);
    const paths = getProjectPaths(rootDir);
    const state = loadState(paths.statePath);
    const modeConfig: OperatingModeConfig = state.operatingMode || {
      currentMode: 'promptMe',
      detectedLanguage: 'en',
      autoDetectLanguage: true,
      authRequiredOnStart: false,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      version: inuoVer.fullVersionString,
      mode: modeConfig.currentMode || 'promptMe',
      lang: modeConfig.detectedLanguage || 'en',
      succinct: modeConfig.isSuccinctMode !== false,
      debugLevel: modeConfig.debugLevel !== undefined ? modeConfig.debugLevel : 1,
    });
  });

  // Command Execution POST Endpoint
  app.post('/api/command', async (req: Request, res: Response) => {
    try {
      const command = (req.body.command || '').trim();
      if (command) {
        const payload = JSON.stringify({
          channel: OutputChannelEnum.USER_REPLY,
          content: `inuo > ${command}`,
          timestamp: new Date().toISOString(),
        });
        for (const client of sseClients) {
          client.write(`data: ${payload}\n\n`);
        }

        await executeShellLine(command, rootDir);
      }
      res.json({ status: 'ok' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  const server = http.createServer(app);
  server.listen(port, () => {
    const inuoVer = calculateInuoVersion(rootDir);
    console.log('\x1b[32m%s\x1b[0m', `\n🚀 [INUO Express Web Server] Light Web UI active at http://localhost:${port}`);
    console.log('\x1b[36m%s\x1b[0m', `   Version: v${inuoVer.fullVersionString} | SSE Stream: http://localhost:${port}/api/stream\n`);
  });

  return server;
}
