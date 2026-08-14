import fs from 'fs';
import path from 'path';
import { InuoManifest } from '../interfaces/InuoManifest';
import { Need } from '../interfaces/Need';
import { Offer } from '../interfaces/Offer';
import { Match } from '../interfaces/Match';
import { CLICommandContext } from '../interfaces/CLICommandContext';

export function getProjectPaths(rootDir: string = process.cwd()) {
  return {
    rootDir,
    manifestPath: path.join(rootDir, 'inuo-manifest.json'),
    specPath: path.join(rootDir, 'INUO_SPEC.md'),
    statePath: path.join(rootDir, '.inuo-state.json'),
  };
}

export function loadManifest(manifestPath: string): InuoManifest | null {
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw) as InuoManifest;
  } catch {
    return null;
  }
}

export interface StateData {
  needs: Need[];
  offers: Offer[];
  matches: Match[];
}

export function loadState(statePath: string): StateData {
  if (!fs.existsSync(statePath)) {
    return { needs: [], offers: [], matches: [] };
  }
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(raw) as StateData;
  } catch {
    return { needs: [], offers: [], matches: [] };
  }
}

export function saveState(statePath: string, data: StateData): void {
  fs.writeFileSync(statePath, JSON.stringify(data, null, 2), 'utf8');
}

export function createContext(rootDir: string = process.cwd()): CLICommandContext {
  const paths = getProjectPaths(rootDir);
  const manifest = loadManifest(paths.manifestPath);
  const state = loadState(paths.statePath);

  return {
    manifestPath: paths.manifestPath,
    specPath: paths.specPath,
    manifest,
    needs: state.needs,
    offers: state.offers,
    matches: state.matches,
  };
}
