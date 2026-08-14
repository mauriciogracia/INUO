import { getProjectPaths, loadState, saveState } from './context';
import { Offer } from '../interfaces/Offer';

export function runOfferCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0] || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Active Offers ===');
    if (state.offers.length === 0) {
      console.log('No active Offers recorded. Use "offer create --verb <complementVerb> --object <object>" to add one.');
      return;
    }
    state.offers.forEach((o, idx) => {
      console.log(`[${idx + 1}] ID: ${o.id} | OFFER = (${o.complementVerb}) + (${o.object}) | Status: ${o.status}`);
    });
    return;
  }

  if (sub === 'create') {
    let complementVerb = 'Donate';
    let object = 'General item';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--verb' && args[i + 1]) complementVerb = args[i + 1];
      if (args[i] === '--object' && args[i + 1]) object = args[i + 1];
    }

    const newOffer: Offer = {
      id: `offer_${Date.now()}`,
      complementVerb,
      object,
      providerId: 'user_local',
      modelType: 'Transactional',
      details: `Offer for ${object}`,
      status: 'Available',
      createdAt: new Date().toISOString(),
    };

    state.offers.push(newOffer);
    saveState(paths.statePath, state);

    console.log('\x1b[32m%s\x1b[0m', `✔ Created Offer: OFFER = (${newOffer.complementVerb}) + (${newOffer.object}) [ID: ${newOffer.id}]`);
    return;
  }

  console.log('Unknown subcommand for offer. Supported: "offer list", "offer create --verb <complementVerb> --object <object>"');
}
