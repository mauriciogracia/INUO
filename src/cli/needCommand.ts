import { getProjectPaths, loadState, saveState } from './context';
import { Need } from '../interfaces/Need';
import { KnownNeedVerb } from '../types/KnownNeedVerb';

export function runNeedCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0] || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Active Needs ===');
    if (state.needs.length === 0) {
      console.log('No active Needs recorded. Use "need create --verb <verb> --object <object>" to add one.');
      return;
    }
    state.needs.forEach((n, idx) => {
      console.log(`[${idx + 1}] ID: ${n.id} | NEED = (${n.verb}) + (${n.object}) | Status: ${n.status} | Model: ${n.modelType}`);
    });
    return;
  }

  if (sub === 'create') {
    let verb: KnownNeedVerb = 'Request';
    let object = 'General item';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--verb' && args[i + 1]) verb = args[i + 1];
      if (args[i] === '--object' && args[i + 1]) object = args[i + 1];
    }

    const newNeed: Need = {
      id: `need_${Date.now()}`,
      verb,
      object,
      complementVerb: getComplementForVerb(verb),
      modelType: 'Transactional',
      status: 'Open',
      isAtomic: true,
      prerequisiteNeedIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.needs.push(newNeed);
    saveState(paths.statePath, state);

    console.log('\x1b[32m%s\x1b[0m', `✔ Created Need: NEED = (${newNeed.verb}) + (${newNeed.object}) [ID: ${newNeed.id}]`);
    return;
  }

  console.log('Unknown subcommand for need. Supported: "need list", "need create --verb <verb> --object <object>"');
}

function getComplementForVerb(verb: string): string {
  const map: Record<string, string> = {
    Request: 'Donate',
    Buy: 'Sell',
    Seek: 'Offer',
    Need: 'Fulfill',
    Borrow: 'Lend',
    Consult: 'Advise',
    Search: 'Supply',
    Call: 'Respond',
    Volunteer: 'Coordinate',
    Report: 'Action',
    Ride: 'Drive',
    Talk: 'Listen',
    Transport: 'Carry',
    Deliver: 'Fetch',
    Employ: 'Teach',
    Contract: 'Nurse',
    Recruit: 'Apply',
  };
  return map[verb] || 'Respond';
}
