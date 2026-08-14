import { getProjectPaths, loadState, saveState, StateData } from './context';
import { Need } from '../interfaces/Need';
import { KnownNeedVerb } from '../types/KnownNeedVerb';
import { getComplementForVerb } from './catalogCommand';

export function computeHierarchicalIds(needs: Need[]): void {
  // Map root needs (no parentNeedId)
  const rootNeeds = needs.filter((n) => !n.parentNeedId);
  rootNeeds.forEach((n, idx) => {
    n.hierarchicalId = `${idx + 1}`;
    assignChildHierarchicalIds(n, needs);
  });
}

function assignChildHierarchicalIds(parent: Need, allNeeds: Need[]): void {
  const children = allNeeds.filter((n) => n.parentNeedId === parent.id);
  children.forEach((child, idx) => {
    child.hierarchicalId = `${parent.hierarchicalId}.${idx + 1}`;
    assignChildHierarchicalIds(child, allNeeds);
  });
}

export function updateParentNeedStates(needs: Need[]): void {
  // Post-order evaluation (deepest children first)
  let changed = true;
  while (changed) {
    changed = false;
    for (const need of needs) {
      const children = needs.filter((n) => n.parentNeedId === need.id);
      if (children.length > 0) {
        need.isAtomic = false;
        const allFulfilled = children.every((c) => c.status === 'Fulfilled');

        let newStatus = need.status;
        if (allFulfilled) {
          newStatus = 'Fulfilled';
        } else {
          newStatus = 'Blocked';
        }



        if (need.status !== newStatus) {
          need.status = newStatus;
          need.updatedAt = new Date().toISOString();
          changed = true;
        }
      }
    }
  }
}

export function findNeedByIdOrCode(query: string, state: StateData): Need | undefined {
  const trimmed = query.trim();
  return state.needs.find(
    (n) => n.id.toLowerCase() === trimmed.toLowerCase() || (n.hierarchicalId && n.hierarchicalId === trimmed)
  );
}

export function runNeedCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0] || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  computeHierarchicalIds(state.needs);
  updateParentNeedStates(state.needs);
  saveState(paths.statePath, state);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Active Needs (Detailed Breakdown) ===');
    if (state.needs.length === 0) {
      console.log('No active Needs recorded. Use "need create --verb <verb> --object <object>" or natural language to add one.');
      return;
    }

    // Sort by hierarchicalId
    const sorted = [...state.needs].sort((a, b) => {
      const codeA = a.hierarchicalId || a.id;
      const codeB = b.hierarchicalId || b.id;
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });

    sorted.forEach((n) => {
      const indentLevel = n.hierarchicalId ? n.hierarchicalId.split('.').length - 1 : 0;
      const indent = '  '.repeat(indentLevel);
      const prefix = n.hierarchicalId ? `[${n.hierarchicalId}]` : `[${n.id}]`;
      const typeStr = n.isAtomic ? 'Atomic' : 'Macro';
      const doubtsCount = n.doubts?.length || 0;
      const doubtsStr = doubtsCount > 0 ? ` | Doubts: ${doubtsCount}` : '';

      console.log(
        `${indent}${prefix} ID: ${n.id} | NEED = (${n.verb}) + (${n.object}) | Status: ${n.status} | Model: ${n.modelType} | Type: ${typeStr}${doubtsStr}`
      );
    });
    return;
  }

  if (sub === 'create') {
    let verb: KnownNeedVerb = 'Request';
    let object = 'General item';
    let parentInput: string | undefined;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--verb' && args[i + 1]) verb = args[i + 1] as KnownNeedVerb;
      if (args[i] === '--object' && args[i + 1]) object = args[i + 1];
      if (args[i] === '--parent' && args[i + 1]) parentInput = args[i + 1];
    }

    let parentNeed: Need | undefined;
    if (parentInput) {
      parentNeed = findNeedByIdOrCode(parentInput, state);
      if (!parentNeed) {
        console.log('\x1b[31m%s\x1b[0m', `Parent Need "${parentInput}" not found.`);
        return;
      }
    }

    const complementVerb = getComplementForVerb(verb, rootDir);

    const newNeed: Need = {
      id: `need_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      verb,
      object,
      complementVerb,
      modelType: 'Transactional',
      status: 'Open',
      isAtomic: true,
      parentNeedId: parentNeed ? parentNeed.id : undefined,
      prerequisiteNeedIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (parentNeed) {
      parentNeed.isAtomic = false;
      parentNeed.status = 'Blocked';
    }

    state.needs.push(newNeed);
    computeHierarchicalIds(state.needs);
    updateParentNeedStates(state.needs);
    saveState(paths.statePath, state);

    console.log(
      '\x1b[32m%s\x1b[0m',
      `✔ Created Need [${newNeed.hierarchicalId || newNeed.id}]: NEED = (${newNeed.verb}) + (${newNeed.object}) [ID: ${newNeed.id}]`
    );
    return;
  }

  console.log('Unknown subcommand for need. Supported: "need list", "need create --verb <verb> --object <object> [--parent <id|code>]"');
}
