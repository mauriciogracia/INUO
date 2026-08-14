import { getProjectPaths, loadState, saveState } from './context';
import { Match } from '../interfaces/Match';

export function runMatchCommand(rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  console.log('\x1b[36m%s\x1b[0m', '=== Running Interaction Engine Matching ===');

  let matchesCount = 0;

  for (const need of state.needs) {
    if (need.status === 'Matched' || need.status === 'Fulfilled') continue;

    const candidateOffer = state.offers.find(
      (o) =>
        o.status === 'Available' &&
        o.object.toLowerCase() === need.object.toLowerCase() &&
        o.complementVerb.toLowerCase() === need.complementVerb.toLowerCase()
    );

    if (candidateOffer) {
      const match: Match = {
        id: `match_${Date.now()}_${matchesCount}`,
        needId: need.id,
        offerId: candidateOffer.id,
        verb: need.verb,
        complementVerb: candidateOffer.complementVerb,
        status: 'Validated',
        matchedAt: new Date().toISOString(),
      };

      need.status = 'Matched';
      candidateOffer.status = 'Matched';
      state.matches.push(match);
      matchesCount++;

      console.log(
        '\x1b[32m%s\x1b[0m',
        `✔ MATCH FOUND: NEED (${need.verb} ${need.object}) <---> OFFER (${candidateOffer.complementVerb} ${candidateOffer.object})`
      );
    }
  }

  saveState(paths.statePath, state);

  if (matchesCount === 0) {
    console.log('No new matches found between current open Needs and available Offers.');
  } else {
    console.log(`\x1b[32m%s\x1b[0m`, `★ Processed ${matchesCount} new match(es). Total system matches: ${state.matches.length}`);
  }
}
