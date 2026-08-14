import { getProjectPaths, loadState } from './context';
import { IncoherenceReport } from '../interfaces/IncoherenceReport';

export function detectPrincipleIncoherence(
  inputText: string,
  rootDir: string = process.cwd()
): IncoherenceReport {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const principles = state.principles || [];
  const lowerInput = inputText.toLowerCase();

  for (const p of principles) {
    if (p.isImmutable) {
      const pNameLower = p.name.toLowerCase();

      // Check zero tolerance / safety incoherence
      if (pNameLower.includes('zero tolerance') || pNameLower.includes('safety')) {
        if (
          (lowerInput.includes('bypass') || lowerInput.includes('ignore') || lowerInput.includes('disable') || lowerInput.includes('override')) &&
          (lowerInput.includes('safety') || lowerInput.includes('zero tolerance') || lowerInput.includes('prohibited') || lowerInput.includes('illegal'))
        ) {
          return {
            hasIncoherence: true,
            conflictingPrincipleId: p.id,
            conflictingPrincipleName: p.name,
            explanation: `Prompt/Skill contradicts Master Trainer Principle "${p.name}": ${p.statement}`,
            checkedAt: new Date().toISOString(),
          };
        }
      }

      // Check canonical formula integrity incoherence
      if (pNameLower.includes('canonical') || pNameLower.includes('formula')) {
        if (
          (lowerInput.includes('disable') || lowerInput.includes('abandon') || lowerInput.includes('remove')) &&
          (lowerInput.includes('canonical') || lowerInput.includes('formula') || lowerInput.includes('need = verb'))
        ) {
          return {
            hasIncoherence: true,
            conflictingPrincipleId: p.id,
            conflictingPrincipleName: p.name,
            explanation: `Prompt/Skill contradicts Master Trainer Principle "${p.name}": ${p.statement}`,
            checkedAt: new Date().toISOString(),
          };
        }
      }
    }
  }

  return {
    hasIncoherence: false,
    checkedAt: new Date().toISOString(),
  };
}
