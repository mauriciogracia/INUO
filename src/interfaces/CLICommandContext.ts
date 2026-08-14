import { InuoManifest } from './InuoManifest';
import { Need } from './Need';
import { Offer } from './Offer';
import { Match } from './Match';

export interface CLICommandContext {
  manifestPath: string;
  specPath: string;
  manifest: InuoManifest | null;
  needs: Need[];
  offers: Offer[];
  matches: Match[];
}
