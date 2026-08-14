import { Need } from './Need';

export interface EvolveResult {
  poIntent: string;
  decomposedNeeds: Need[];
  generatedFiles: string[];
  testStatus: 'Passed' | 'Failed' | 'RolledBack';
  summary: string;
}
