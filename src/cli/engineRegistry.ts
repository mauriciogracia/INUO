import { getProjectPaths, loadState, saveState, BASELINE_ENGINES } from './context';
import { EngineConfig } from '../interfaces/EngineConfig';
import { Behavior } from '../interfaces/Behavior';

export function registerEngine(
  engineName: string,
  description: string,
  behaviorIds: string[],
  rootDir: string = process.cwd()
): EngineConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.engines) state.engines = [...BASELINE_ENGINES];

  const engineId = `engine_${engineName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  const engine: EngineConfig = {
    engineId,
    engineName,
    description,
    behaviorIds,
    createdBy: state.currentRole || 'RegularUser',
    isImmutable: false,
    updatedAt: new Date().toISOString(),
  };

  state.engines.push(engine);
  saveState(paths.statePath, state);
  return engine;
}

export function listEngines(rootDir: string = process.cwd()): EngineConfig[] {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  return state.engines || [...BASELINE_ENGINES];
}

export function inspectEngineBehaviors(
  engineIdOrName: string,
  rootDir: string = process.cwd()
): { engine?: EngineConfig; behaviors: Behavior[] } {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const engines = state.engines || [...BASELINE_ENGINES];
  const allBehaviors = state.behaviors || [];

  const engine = engines.find(
    (e) => e.engineId.toLowerCase() === engineIdOrName.toLowerCase() || e.engineName.toLowerCase() === engineIdOrName.toLowerCase()
  );

  if (!engine) return { behaviors: [] };

  const behaviors = allBehaviors.filter((b) => engine.behaviorIds.includes(b.id));
  return { engine, behaviors };
}
