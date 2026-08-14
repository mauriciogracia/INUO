import fs from 'fs';
import path from 'path';
import { Environment } from '../interfaces/Environment';

export function loadEnvironment(rootDir: string = process.cwd()): Environment {
  const manifestPath = path.join(rootDir, 'inuo-manifest.json');
  const specPath = path.join(rootDir, 'INUO_SPEC.md');
  const statePath = path.join(rootDir, '.inuo-state.json');
  const configPath = path.join(rootDir, '.inuo-key.json');
  const envFilePath = path.join(rootDir, '.env');

  let geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  let defaultModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  // Load from .env if present and key not in env
  if (fs.existsSync(envFilePath)) {
    try {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      if (!geminiApiKey) {
        const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.+)/) || envContent.match(/GOOGLE_API_KEY\s*=\s*(.+)/);
        if (match && match[1]) {
          geminiApiKey = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
      const modelMatch = envContent.match(/GEMINI_MODEL\s*=\s*(.+)/);
      if (modelMatch && modelMatch[1]) {
        defaultModel = modelMatch[1].trim().replace(/^["']|["']$/g, '');
      }
    } catch {}
  }

  // Load from .inuo-key.json if key still empty
  if (!geminiApiKey && fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data.apiKey) geminiApiKey = data.apiKey;
    } catch {}
  }

  let specVersion = '00.02.95';
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.SPEC_VERSION) specVersion = manifest.SPEC_VERSION;
    } catch {}
  }

  return {
    geminiApiKey,
    specVersion,
    cliVersion: '00.02.95',
    rootDir,
    manifestPath,
    specPath,
    statePath,
    configPath,
    defaultModel,
  };
}

export function saveGeminiApiKey(apiKey: string, rootDir: string = process.cwd()): void {
  const configPath = path.join(rootDir, '.inuo-key.json');
  fs.writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2), 'utf8');
  process.env.GEMINI_API_KEY = apiKey;
}

export function isGeminiConnected(rootDir: string = process.cwd()): boolean {
  const env = loadEnvironment(rootDir);
  return !!env.geminiApiKey;
}
